import AppsFlyer, { AFPurchaseType, MEDIATION_NETWORK } from '../index';
import NativeAppsFlyer from '../src/NativeAppsFlyer';

function mockRpcResponse(data = {}) {
	return JSON.stringify({ success: true, data });
}

function mockRpcError(message, code = 500) {
	return JSON.stringify({ success: false, error: { code, message } });
}

// Compares parsed JSON, not raw strings, so key-insertion order doesn't cause flakiness (see testing.md).
function payloadAt(index, mock = NativeAppsFlyer.executeRpc) {
	const [requestJson] = mock.mock.calls[index];
	return JSON.parse(requestJson);
}
function lastPayload(mock = NativeAppsFlyer.executeRpc) {
	return payloadAt(mock.mock.calls.length - 1, mock);
}

// Re-requires index.ts fresh with Platform.OS pinned, since RNTransport.platform is captured once at
// construction and the module-level `AppsFlyer` singleton (imported above) only ever exercises iOS.
function freshAppsFlyerForPlatform(platform) {
	jest.resetModules();
	const { Platform: FreshPlatform } = require('react-native');
	FreshPlatform.OS = platform;
	return {
		AppsFlyer: require('../index').default,
		NativeAppsFlyer: require('../src/NativeAppsFlyer').default,
	};
}

describe("Test AppsFlyer API's", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('init() sends setPluginInfo then init on Android — appId is dropped (unused/absent from the Android wire contract)', async () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidNative.executeRpc.mockResolvedValueOnce(mockRpcResponse()).mockResolvedValueOnce(mockRpcResponse());
		await androidAppsFlyer.init({ devKey: 'xxxx', appId: '777' });
		expect(androidNative.executeRpc).toHaveBeenCalledTimes(2);
		expect(payloadAt(0, androidNative.executeRpc)).toEqual({
			method: 'setPluginInfo',
			params: { plugin: 'react_native', pluginVersion: require('../package.json').version },
		});
		expect(payloadAt(1, androidNative.executeRpc)).toEqual({ method: 'init', params: { devKey: 'xxxx' } });
	});

	test('init() sends the real iOS wire method ("initialize", not "init") and keeps appId', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse()).mockResolvedValueOnce(mockRpcResponse());
		await AppsFlyer.init({ devKey: 'xxxx', appId: '777' });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(2);
		expect(payloadAt(0)).toEqual({
			method: 'setPluginInfo',
			params: { plugin: 'react_native', pluginVersion: require('../package.json').version },
		});
		expect(payloadAt(1)).toEqual({ method: 'initialize', params: { devKey: 'xxxx', appId: '777' } });
	});

	// Old hand-rolled index.ts rejected non-string appId client-side; js-core-plugin trusts InitParams typing instead (removed, not a gap).

	test('it calls AppsFlyer.init and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc
			.mockResolvedValueOnce(mockRpcResponse())
			.mockResolvedValueOnce(mockRpcError('devKey missing', 400));
		await expect(AppsFlyer.init({ devKey: 'xxxx', appId: '777' })).rejects.toEqual({
			code: 400,
			message: 'devKey missing',
		});
	});

	test('it calls AppsFlyer.enableDebug — real wire method is "isDebug", field renamed enabled -> isDebug', () => {
		AppsFlyer.enableDebug({ enabled: true });
		expect(lastPayload()).toEqual({ method: 'isDebug', params: { isDebug: true } });
	});

	test('it calls AppsFlyer.stop', () => {
		AppsFlyer.stop({ shouldStop: true });
		expect(lastPayload()).toEqual({ method: 'stop', params: { shouldStop: true } });
	});

	test('it calls AppsFlyer.logEvent — awaitResponse omitted from the wire when not passed', () => {
		let eventValues = {};
		let eventName = 'test';
		AppsFlyer.logEvent({ eventName, eventValues });
		expect(lastPayload()).toEqual({ method: 'logEvent', params: { eventName, eventValues } });
	});

	test('it calls AppsFlyer.logEvent with awaitResponse: true', () => {
		let eventValues = {};
		let eventName = 'test';
		AppsFlyer.logEvent({ eventName, eventValues, awaitResponse: true });
		expect(lastPayload()).toEqual({
			method: 'logEvent',
			params: { eventName, eventValues, awaitResponse: true },
		});
	});

	test('it calls AppsFlyer.logLocation with valid coordinates', () => {
		AppsFlyer.logLocation({ longitude: 12, latitude: 12 });
		expect(lastPayload()).toEqual({ method: 'logLocation', params: { longitude: 12, latitude: 12 } });
	});

	// Old hand-rolled index.ts rejected invalid coordinates client-side; js-core-plugin forwards them as-is (removed, not a gap).

	test('it calls AppsFlyer.setUserEmail', () => {
		AppsFlyer.setUserEmail({ email: 'a@b.com' });
		expect(lastPayload()).toEqual({ method: 'setUserEmail', params: { email: 'a@b.com' } });
	});

	test('it calls AppsFlyer.setAdditionalData', () => {
		AppsFlyer.setAdditionalData({ customData: {} });
		expect(lastPayload()).toEqual({ method: 'setAdditionalData', params: { customData: {} } });
	});

	test('it calls AppsFlyer.getAppsFlyerUID', () => {
		AppsFlyer.getAppsFlyerUID();
		expect(lastPayload()).toEqual({ method: 'getAppsFlyerUID', params: {} });
	});

	// Regression: mock only modeled Android's bare-value shape, so iOS's keyed-dict shape ({uid}, {version}) went uncovered.
	describe('getter resolved values are platform-neutral', () => {
		test.each([
			['iOS keyed dict', { uid: 'af-uid-1' }],
			['Android bare value', 'af-uid-1'],
		])('getAppsFlyerUID resolves whatever native returns given an %s (core does not unwrap a keyed dict)', async (_shape, data) => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(data));
			await expect(AppsFlyer.getAppsFlyerUID()).resolves.toEqual(data);
		});

		// Guards against a truthiness rewrite: `data.x || data` would wrongly resolve true here.
		test('isSessionReady resolves a falsy value as-is', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(false));
			await expect(AppsFlyer.isSessionReady()).resolves.toBe(false);
		});

		// Regression guard: isSessionReady must not fire registerSessionReadyListener as a side effect.
		test('isSessionReady does not register the session-ready listener as a side effect', async () => {
			await AppsFlyer.isSessionReady();
			const dispatchedMethods = NativeAppsFlyer.executeRpc.mock.calls.map(
				([requestJson]) => JSON.parse(requestJson).method
			);
			expect(dispatchedMethods).not.toContain('registerSessionReadyListener');
		});

		// setUserEmail's core signature is Promise<void> — always resolves undefined regardless of native's response, unlike the old callRpc.
		test('a void RPC resolves undefined regardless of native\'s resolved data', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(null));
			await expect(AppsFlyer.setUserEmail({ email: 'a@b.com' })).resolves.toBeUndefined();
		});
	});

	test('it calls AppsFlyer.updateServerUninstallToken on Android — same method name, token key unchanged', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.updateServerUninstallToken({ token: 'xxx' });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'updateServerUninstallToken',
			params: { token: 'xxx' },
		});
	});

	test('it calls AppsFlyer.updateServerUninstallToken on iOS — real wire method is "registerUninstall", field renamed token -> deviceToken', () => {
		AppsFlyer.updateServerUninstallToken({ token: 'xxx' });
		expect(lastPayload()).toEqual({ method: 'registerUninstall', params: { deviceToken: 'xxx' } });
	});

	test('it calls AppsFlyer.setCustomerUserId', () => {
		AppsFlyer.setCustomerUserId({ customerId: 'xxx' });
		expect(lastPayload()).toEqual({ method: 'setCustomerUserId', params: { customerId: 'xxx' } });
	});

	test('it calls AppsFlyer.setPartnerData', () => {
		AppsFlyer.setPartnerData({ partnerId: 'xxx', data: {} });
		expect(lastPayload()).toEqual({ method: 'setPartnerData', params: { partnerId: 'xxx', data: {} } });
	});

	test('it calls AppsFlyer.setPartnerData with a null data object', () => {
		AppsFlyer.setPartnerData({ partnerId: 'xxx', data: null });
		expect(lastPayload()).toEqual({ method: 'setPartnerData', params: { partnerId: 'xxx', data: null } });
	});

	// Old hand-rolled index.ts silently no-op'd invalid partnerId/data; js-core-plugin has no such guard (removed, not a gap).

	test('it calls AppsFlyer.setSharingFilterForPartners', () => {
		AppsFlyer.setSharingFilterForPartners({ partners: [] });
		expect(lastPayload()).toEqual({ method: 'setSharingFilterForPartners', params: { partners: [] } });
	});

	test('it calls AppsFlyer.setCurrentDeviceLanguage — iOS-only', () => {
		AppsFlyer.setCurrentDeviceLanguage({ language: 'EN' });
		expect(lastPayload()).toEqual({ method: 'setCurrentDeviceLanguage', params: { language: 'EN' } });
	});

	test('setCurrentDeviceLanguage rejects on Android — no rpc.android entry exists for it', async () => {
		const { AppsFlyer: androidAppsFlyer } = freshAppsFlyerForPlatform('android');
		await expect(androidAppsFlyer.setCurrentDeviceLanguage({ language: 'EN' })).rejects.toThrow(/not supported on android/);
	});

	test('it calls AppsFlyer.stop(false) with shouldStop:false', () => {
		// Regression: Android's parser reads optBoolean('shouldStop', true) — a missing key leaves the SDK stopped forever.
		AppsFlyer.stop({ shouldStop: false });
		expect(lastPayload()).toEqual({ method: 'stop', params: { shouldStop: false } });
	});

	// sendPushNotificationData (Android) and handlePushNotification (iOS) are now separate per-platform methods, no longer merged into one request.
	test('sendPushNotificationData is Android-only, sending the flat campaign fields', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.sendPushNotificationData({ campaign: 'c1', pid: 'firebase', isRetargeting: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'sendPushNotificationData',
			params: { campaign: 'c1', pid: 'firebase', isRetargeting: true },
		});
	});

	test('handlePushNotification is iOS-only, sending the raw pushPayload', () => {
		AppsFlyer.handlePushNotification({ pushPayload: { foo: 'bar' } });
		expect(lastPayload()).toEqual({ method: 'handlePushNotification', params: { pushPayload: { foo: 'bar' } } });
	});

	test('it calls AppsFlyer.appendParametersToDeepLinkingURL', () => {
		AppsFlyer.appendParametersToDeepLinkingURL({ contains: 'dummy-url', parameters: {} });
		expect(lastPayload()).toEqual({
			method: 'appendParametersToDeepLinkingURL',
			params: { contains: 'dummy-url', parameters: {} },
		});
	});

	test('it calls AppsFlyer.setDisableNetworkData on Android — field renamed isDisable, same key already', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setDisableNetworkData({ isDisable: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setDisableNetworkData',
			params: { isDisable: true },
		});
	});

	test('setDisableNetworkData rejects on iOS — Android-only', async () => {
		await expect(AppsFlyer.setDisableNetworkData({ isDisable: true })).rejects.toThrow(/not supported on ios/);
	});

	test('it calls AppsFlyer.start()', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse());
		await AppsFlyer.start({ awaitResponse: true });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
		expect(lastPayload()).toEqual({ method: 'start', params: { awaitResponse: true } });
	});

	test('it calls AppsFlyer.start() and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcError('start completed with error: timed out'));
		await expect(AppsFlyer.start()).rejects.toEqual({
			code: 500,
			message: 'start completed with error: timed out',
		});
	});

	test('it calls AppsFlyer.performDeepLinking() on Android — same method name, both fields kept', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.performDeepLinking({ url: '', shouldTriggerSession: false });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'performDeepLinking',
			params: { url: '', shouldTriggerSession: false },
		});
	});

	test('it calls AppsFlyer.performDeepLinking() on iOS — wire method renamed to match Android in AppsFlyerRPC 7.0.13, shouldTriggerSession dropped', () => {
		AppsFlyer.performDeepLinking({ url: '' });
		expect(lastPayload()).toEqual({ method: 'performDeepLinking', params: { url: '' } });
	});

	test('it calls AppsFlyer.setDisableIDFVCollection — iOS-only', () => {
		AppsFlyer.setDisableIDFVCollection({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableIDFVCollection', params: { disable: true } });
	});

	test('it calls AppsFlyer.logAdRevenue with valid ad revenue data', () => {
		const adRevenueData = {
			monetizationNetwork: 'test_network',
			mediationNetwork: 'ironsource',
			currencyIso4217Code: 'USD',
			revenue: 10.99,
			additionalParameters: { test: 'param' },
		};
		AppsFlyer.logAdRevenue(adRevenueData);
		expect(lastPayload()).toEqual({ method: 'logAdRevenue', params: adRevenueData });
	});

	// Android matches case-insensitively against the enum name; iOS normalizes case/underscores — both handled by js-core-plugin's rpc-resolver.ts.
	describe('logAdRevenue mediationNetwork per-platform resolution', () => {
		// Needs a fresh instance per platform since RNTransport.platform is captured once at construction.
		function paramsSentFor(platform, mediationNetwork) {
			const { AppsFlyer: platformAppsFlyer, NativeAppsFlyer: platformNative } = freshAppsFlyerForPlatform(platform);
			platformAppsFlyer.logAdRevenue({
				monetizationNetwork: 'test_network',
				mediationNetwork,
				currencyIso4217Code: 'USD',
				revenue: 1,
			});
			return lastPayload(platformNative.executeRpc).params;
		}

		test('Android: values pass through unchanged (af-android-sdk matches case-insensitively against the enum name, e.g. "applovin_max" == APPLOVIN_MAX)', () => {
			expect(paramsSentFor('android', MEDIATION_NETWORK.APPLOVIN_MAX).mediationNetwork).toBe('applovin_max');
			expect(paramsSentFor('android', MEDIATION_NETWORK.GOOGLE_ADMOB).mediationNetwork).toBe('google_admob');
			expect(paramsSentFor('android', MEDIATION_NETWORK.TOPON_PTE).mediationNetwork).toBe('topon_pte');
		});

		test('Android: CUSTOM_MEDIATION/DIRECT_MONETIZATION_NETWORK also pass through unchanged, same enum-name match', () => {
			expect(paramsSentFor('android', MEDIATION_NETWORK.CUSTOM_MEDIATION).mediationNetwork).toBe('custom_mediation');
			expect(paramsSentFor('android', MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK).mediationNetwork).toBe(
				'direct_monetization_network'
			);
		});

		test('iOS: APPLOVIN_MAX/GOOGLE_ADMOB/TOPON_PTE pass through unchanged (iOS normalizes case/underscores itself)', () => {
			expect(paramsSentFor('ios', MEDIATION_NETWORK.APPLOVIN_MAX).mediationNetwork).toBe('applovin_max');
			expect(paramsSentFor('ios', MEDIATION_NETWORK.GOOGLE_ADMOB).mediationNetwork).toBe('google_admob');
			expect(paramsSentFor('ios', MEDIATION_NETWORK.TOPON_PTE).mediationNetwork).toBe('topon_pte');
		});

		test("iOS: CUSTOM_MEDIATION/DIRECT_MONETIZATION_NETWORK resolve to iOS's normalizer-safe spelling", () => {
			expect(paramsSentFor('ios', MEDIATION_NETWORK.CUSTOM_MEDIATION).mediationNetwork).toBe('custom');
			expect(paramsSentFor('ios', MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK).mediationNetwork).toBe(
				'directmonetization'
			);
		});
	});

	test('it calls AppsFlyer.anonymizeUser', () => {
		AppsFlyer.anonymizeUser({ shouldAnonymize: true });
		expect(lastPayload()).toEqual({ method: 'anonymizeUser', params: { shouldAnonymize: true } });
	});

	test('it calls AppsFlyer.setCurrencyCode', () => {
		AppsFlyer.setCurrencyCode({ currencyCode: 'USD' });
		expect(lastPayload()).toEqual({ method: 'setCurrencyCode', params: { currencyCode: 'USD' } });
	});

	test('it calls AppsFlyer.setOneLinkCustomDomain', () => {
		const domains = ['example.com', 'brand.com'];
		AppsFlyer.setOneLinkCustomDomain({ domains });
		expect(lastPayload()).toEqual({ method: 'setOneLinkCustomDomain', params: { domains } });
	});

	test('it calls AppsFlyer.setAppInviteOneLink', () => {
		AppsFlyer.setAppInviteOneLink({ oneLinkId: 'test_one_link_id' });
		expect(lastPayload()).toEqual({ method: 'setAppInviteOneLink', params: { oneLinkId: 'test_one_link_id' } });
	});

	test('it calls AppsFlyer.generateInviteLink on iOS — referrerCustomerId kept as-is', () => {
		AppsFlyer.generateInviteLink({
			parameters: {
				channel: 'test_channel',
				campaign: 'test_campaign',
				referrerCustomerId: 'test_customer',
				userParams: { deep_link_value: 'test_value' },
			},
		});
		expect(lastPayload()).toEqual({
			method: 'generateInviteLink',
			params: {
				channel: 'test_channel',
				campaign: 'test_campaign',
				referrerCustomerId: 'test_customer',
				userParams: { deep_link_value: 'test_value' },
			},
		});
	});

	test('it calls AppsFlyer.generateInviteLink on Android — referrerCustomerId remapped to customerId', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.generateInviteLink({
			parameters: {
				channel: 'test_channel',
				campaign: 'test_campaign',
				referrerCustomerId: 'test_customer',
				userParams: { deep_link_value: 'test_value' },
			},
		});
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'generateInviteLink',
			params: {
				channel: 'test_channel',
				campaign: 'test_campaign',
				customerId: 'test_customer',
				userParams: { deep_link_value: 'test_value' },
			},
		});
	});

	test('it calls AppsFlyer.setDisableCollectASA — iOS-only', () => {
		AppsFlyer.setDisableCollectASA({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableCollectASA', params: { disable: true } });
	});

	test('it calls AppsFlyer.setUseReceiptValidationSandbox — iOS-only', () => {
		AppsFlyer.setUseReceiptValidationSandbox({ sandbox: true });
		expect(lastPayload()).toEqual({ method: 'setUseReceiptValidationSandbox', params: { sandbox: true } });
	});

	test('it calls AppsFlyer.setDisableSKAdNetwork — iOS-only', () => {
		AppsFlyer.setDisableSKAdNetwork({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableSKAdNetwork', params: { disable: true } });
	});

	test('it calls AppsFlyer.setCollectAndroidID — Android-only', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setCollectAndroidID({ isCollect: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setCollectAndroidID',
			params: { isCollect: true },
		});
	});

	test('setCollectAndroidID rejects on iOS — Android-only', async () => {
		await expect(AppsFlyer.setCollectAndroidID({ isCollect: true })).rejects.toThrow(/not supported on ios/);
	});

	test('it calls AppsFlyer.disableAppSetId — Android-only', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.disableAppSetId();
		expect(lastPayload(androidNative.executeRpc)).toEqual({ method: 'disableAppSetId', params: {} });
	});

	test('it calls AppsFlyer.validateAndLogInAppPurchase on Android — flattens purchase.* onto the wire params, purchaseType snake_cased', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		const additionalParameters = { test: 'param' };
		androidAppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'subscription', productId: 'test_product_123', purchaseToken: 'test_transaction_123' },
			additionalParameters,
		});
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'validateAndLogInAppPurchase',
			params: {
				purchaseType: 'subscription',
				purchaseToken: 'test_transaction_123',
				productId: 'test_product_123',
				additionalParameters,
			},
		});
	});

	test('it calls AppsFlyer.validateAndLogInAppPurchase on iOS — nests purchase.* under product/transaction', () => {
		// NOTE: AFPurchaseType.ONE_TIME_PURCHASE is stale snake_case vs the new camelCase schema enum — flagged for index.ts owner, not fixed here.
		AppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'oneTimePurchase', productId: 'test_product_456', transactionId: 'test_transaction_456' },
		});
		expect(lastPayload()).toEqual({
			method: 'validateAndLogInAppPurchase',
			params: {
				product: { productId: 'test_product_456' },
				transaction: { transactionId: 'test_transaction_456', purchaseType: 'oneTimePurchase' },
			},
		});
	});

	// Uses the schema's real value ('oneTimePurchase'), not the stale AFPurchaseType constant — see the note above.
	test('validateAndLogInAppPurchase maps purchaseType per platform (Android: snake_case)', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'oneTimePurchase', productId: 'sku', purchaseToken: 'txn' },
		});
		expect(lastPayload(androidNative.executeRpc).params.purchaseType).toBe('one_time_purchase');
	});

	test('validateAndLogInAppPurchase maps purchaseType per platform (iOS: camelCase, nested)', () => {
		AppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'oneTimePurchase', productId: 'sku', transactionId: 'txn' },
		});
		expect(lastPayload().params.transaction.purchaseType).toBe('oneTimePurchase');
	});

	test('validateAndLogInAppPurchase leaves subscription spelling untouched on both platforms', () => {
		AppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: AFPurchaseType.SUBSCRIPTION, productId: 'p', transactionId: 't' },
		});
		expect(lastPayload().params.transaction.purchaseType).toBe('subscription');
	});

	test('AFPurchaseType enum values are correct', () => {
		expect(AFPurchaseType.SUBSCRIPTION).toBe('subscription');
		expect(AFPurchaseType.ONE_TIME_PURCHASE).toBe('one_time_purchase');
	});

	test('MEDIATION_NETWORK enum values are correct', () => {
		expect(MEDIATION_NETWORK.IRONSOURCE).toBe('ironsource');
		expect(MEDIATION_NETWORK.APPLOVIN_MAX).toBe('applovin_max');
		expect(MEDIATION_NETWORK.GOOGLE_ADMOB).toBe('google_admob');
		expect(MEDIATION_NETWORK.FYBER).toBe('fyber');
		expect(MEDIATION_NETWORK.APPODEAL).toBe('appodeal');
		expect(MEDIATION_NETWORK.ADMOST).toBe('Admost');
		expect(MEDIATION_NETWORK.TOPON).toBe('Topon');
		expect(MEDIATION_NETWORK.TRADPLUS).toBe('Tradplus');
		expect(MEDIATION_NETWORK.YANDEX).toBe('Yandex');
		expect(MEDIATION_NETWORK.CHARTBOOST).toBe('chartboost');
		expect(MEDIATION_NETWORK.UNITY).toBe('Unity');
		expect(MEDIATION_NETWORK.TOPON_PTE).toBe('topon_pte');
		expect(MEDIATION_NETWORK.CUSTOM_MEDIATION).toBe('custom_mediation');
		expect(MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK).toBe('direct_monetization_network');
	});

	test('it calls AppsFlyer.setResolveDeepLinkURLs', () => {
		const urls = ['example.com', 'brand.com'];
		AppsFlyer.setResolveDeepLinkURLs({ urls });
		expect(lastPayload()).toEqual({ method: 'setResolveDeepLinkURLs', params: { urls } });
	});

	test('it calls AppsFlyer.setDisableAdvertisingIdentifiers on iOS — field stays "disable"', () => {
		AppsFlyer.setDisableAdvertisingIdentifiers({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableAdvertisingIdentifiers', params: { disable: true } });
	});

	test('it calls AppsFlyer.setDisableAdvertisingIdentifiers on Android — field renamed disable -> isDisable', () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setDisableAdvertisingIdentifiers({ disable: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setDisableAdvertisingIdentifiers',
			params: { isDisable: true },
		});
	});

	test('it calls AppsFlyer.enableTCFDataCollection', () => {
		AppsFlyer.enableTCFDataCollection({ shouldCollect: true });
		expect(lastPayload()).toEqual({ method: 'enableTCFDataCollection', params: { shouldCollect: true } });
	});

	test('it calls AppsFlyer.setConsentData', () => {
		const consentData = { isUserSubjectToGDPR: true };
		AppsFlyer.setConsentData(consentData);
		expect(lastPayload()).toEqual({ method: 'setConsentData', params: consentData });
	});

	// Old hand-rolled index.ts defaulted isUserSubjectToGDPR to false when omitted; js-core-plugin forwards params as-is now (no default).

	// AppsFlyerConsent convenience class is no longer exported after the js-core-plugin migration — an unflagged public-API removal, out of scope for this test-only pass; these two tests are deleted, not converted.
});

describe('Test native event emitter', () => {
	// Resets module state since listener-registration state lives in js-core-plugin's module-level AppsFlyerSDK singleton.
	function freshModule() {
		jest.resetModules();
		const { NativeEventEmitter: FreshNativeEventEmitter } = require('react-native');
		const freshAppsFlyer = require('../index').default;
		const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
		return {
			AppsFlyer: freshAppsFlyer,
			nativeEventEmitter: new FreshNativeEventEmitter(freshNativeAppsFlyer),
		};
	}

	let AppsFlyer;
	let nativeEventEmitter;
	let nativeEventObject = { test: 'la' };

	function emitRpcEvent(event, data) {
		nativeEventEmitter.emit('RNAppsFlyer_rpcEvent', JSON.stringify({ event, data, timestamp: Date.now() }));
	}

	beforeEach(() => {
		({ AppsFlyer, nativeEventEmitter } = freshModule());
	});

	test('registerConversionListener onConversionDataSuccess Happy Flow', async () => {
		const onSuccess = jest.fn();
		await AppsFlyer.registerConversionListener({ onConversionDataSuccess: onSuccess, onConversionDataFail: jest.fn() });

		emitRpcEvent('onConversionDataSuccess', nativeEventObject);
		expect(onSuccess).toHaveBeenCalledWith(nativeEventObject);
	});

	test('registerConversionListener onConversionDataFail Happy Flow', async () => {
		const onFail = jest.fn();
		await AppsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: onFail });

		emitRpcEvent('onConversionDataFail', { error: 'DevKey is incorrect' });
		expect(onFail).toHaveBeenCalledWith({ error: 'DevKey is incorrect' });
	});

	// unregisterConversionListener has no rpc.ios entry (verified against native source) — rejects instead of sending a doomed RPC.
	test('unregisterConversionListener rejects on iOS — no rpc.ios entry exists for it', async () => {
		await AppsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		await expect(AppsFlyer.unregisterConversionListener()).rejects.toThrow(/not supported on ios/);
	});

	test('unregisterConversionListener on Android sends the native unregister call, but does not clear the JS callback', async () => {
		const { AppsFlyer: androidAppsFlyer, nativeEventEmitter: androidEmitter } = (() => {
			jest.resetModules();
			const { Platform: FreshPlatform, NativeEventEmitter: FreshNativeEventEmitter } = require('react-native');
			FreshPlatform.OS = 'android';
			const freshAppsFlyer = require('../index').default;
			const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
			return { AppsFlyer: freshAppsFlyer, nativeEventEmitter: new FreshNativeEventEmitter(freshNativeAppsFlyer) };
		})();
		const successCallback = jest.fn();
		await androidAppsFlyer.registerConversionListener({ onConversionDataSuccess: successCallback, onConversionDataFail: jest.fn() });
		await androidAppsFlyer.unregisterConversionListener();

		androidEmitter.emit('RNAppsFlyer_rpcEvent', JSON.stringify({ event: 'onConversionDataSuccess', data: nativeEventObject }));

		// unregisterConversionListener only tears down the native subscription, not the JS callback (see js-core-plugin's AppsFlyerSDK) — still fires here since the fake emitter delivers regardless.
		expect(successCallback).toHaveBeenCalledWith(nativeEventObject);
	});

	// js-core-plugin's registerDeepLinkListener always defaults a missing `status` to 'NOT_FOUND' — see compatibility.test.js.
	test('registerDeepLinkListener Happy Flow (iOS native event name)', async () => {
		const onDeepLinking = jest.fn();
		await AppsFlyer.registerDeepLinkListener({ onDeepLinking });
		emitRpcEvent('onDeepLinkReceived', nativeEventObject);
		expect(onDeepLinking).toHaveBeenCalledWith({ ...nativeEventObject, status: 'NOT_FOUND' });
	});

	test('registerDeepLinkListener Happy Flow (Android native event name)', async () => {
		const onDeepLinking = jest.fn();
		await AppsFlyer.registerDeepLinkListener({ onDeepLinking });
		emitRpcEvent('onDeepLinking', nativeEventObject);
		expect(onDeepLinking).toHaveBeenCalledWith({ ...nativeEventObject, status: 'NOT_FOUND' });
	});

	test('onAppOpenAttribution / onAttributionFailure were removed and merged into registerDeepLinkListener', () => {
		expect(AppsFlyer.onAppOpenAttribution).toBeUndefined();
		expect(AppsFlyer.onAttributionFailure).toBeUndefined();
	});
});

describe('net-new RPC-only method wrappers (one per domain block)', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	function lastPayloadOf(mockedExecuteRpc) {
		const calls = mockedExecuteRpc.mock.calls;
		const [requestJson] = calls[calls.length - 1];
		return JSON.parse(requestJson);
	}

	test('setMinTimeBetweenSessions (Complex-config) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await AppsFlyer.setMinTimeBetweenSessions({ seconds: 30 });

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({
			method: 'setMinTimeBetweenSessions',
			params: { seconds: 30 },
		});
	});

	test('setUserPhone (Hashed-PII) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		// Native reads a split country code + number, never a combined `phone` string.
		await AppsFlyer.setUserPhone({ countryCode: '1', phoneNumber: '5551234567' });

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({
			method: 'setUserPhone',
			params: { countryCode: '1', phoneNumber: '5551234567' },
		});
	});

	test('clearUserPii (Hashed-PII) calls executeRpc with empty params', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await AppsFlyer.clearUserPii();

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({ method: 'clearUserPii', params: {} });
	});

	test('setPreinstallAttribution (Android-only) calls executeRpc with the right envelope', async () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidNative.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await androidAppsFlyer.setPreinstallAttribution({ mediaSource: 'media_src', campaign: 'campaign_1', siteId: 'site_1' });

		expect(lastPayloadOf(androidNative.executeRpc)).toEqual({
			method: 'setPreinstallAttribution',
			params: { mediaSource: 'media_src', campaign: 'campaign_1', siteId: 'site_1' },
		});
	});

	test('isStopped (Android-only getter) resolves with response.data', async () => {
		const { AppsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidNative.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: false }));

		await expect(androidAppsFlyer.isStopped()).resolves.toBe(false);
		expect(lastPayloadOf(androidNative.executeRpc)).toEqual({ method: 'isStopped', params: {} });
	});
});
