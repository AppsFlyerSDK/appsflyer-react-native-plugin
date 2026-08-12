import appsFlyer, { AFPurchaseType, MEDIATION_NETWORK } from '../index';
import { Platform } from 'react-native';
import NativeAppsFlyer from '../src/NativeAppsFlyer';

function mockRpcResponse(data = {}) {
	return JSON.stringify({ success: true, data });
}

function mockRpcError(message, code = 500) {
	return JSON.stringify({ success: false, error: { code, message } });
}

// Parses the last (or nth) executeRpc call's request JSON. Preferred over string-equality
// (`toHaveBeenCalledWith(JSON.stringify(...))`) per testing.md's own documented pattern --
// object equality doesn't depend on the resolver's key insertion order.
function payloadAt(index, mock = NativeAppsFlyer.executeRpc) {
	const [requestJson] = mock.mock.calls[index];
	return JSON.parse(requestJson);
}
function lastPayload(mock = NativeAppsFlyer.executeRpc) {
	return payloadAt(mock.mock.calls.length - 1, mock);
}

// Re-requires index.ts (and its NativeAppsFlyer mock) fresh with Platform.OS pinned, for methods
// whose real wire method name/params genuinely diverge per platform (see
// node_modules/@appsflyer-sdk/js-core-plugin/dist/generated/rpc-map.js) -- RNTransport.platform is
// captured once at construction, so the module-level `appsFlyer` singleton (imported above,
// under this Jest environment's default 'ios' haste platform) only ever exercises iOS's mapping.
function freshAppsFlyerForPlatform(platform) {
	jest.resetModules();
	const { Platform: FreshPlatform } = require('react-native');
	FreshPlatform.OS = platform;
	return {
		appsFlyer: require('../index').default,
		NativeAppsFlyer: require('../src/NativeAppsFlyer').default,
	};
}

describe("Test appsFlyer API's", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('init() sends setPluginInfo then init on Android — appId is dropped (unused/absent from the Android wire contract)', async () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
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
		await appsFlyer.init({ devKey: 'xxxx', appId: '777' });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(2);
		expect(payloadAt(0)).toEqual({
			method: 'setPluginInfo',
			params: { plugin: 'react_native', pluginVersion: require('../package.json').version },
		});
		expect(payloadAt(1)).toEqual({ method: 'initialize', params: { devKey: 'xxxx', appId: '777' } });
	});

	// The old hand-rolled index.ts rejected client-side if `appId` wasn't a string. @appsflyer-sdk/js-core-plugin
	// does no such runtime validation (it trusts TypeScript's InitParams typing) -- removed, not a gap.

	test('it calls appsFlyer.init and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc
			.mockResolvedValueOnce(mockRpcResponse())
			.mockResolvedValueOnce(mockRpcError('devKey missing', 400));
		await expect(appsFlyer.init({ devKey: 'xxxx', appId: '777' })).rejects.toEqual({
			code: 400,
			message: 'devKey missing',
		});
	});

	test('it calls appsFlyer.enableDebug — real wire method is "isDebug", field renamed enabled -> isDebug', () => {
		appsFlyer.enableDebug({ enabled: true });
		expect(lastPayload()).toEqual({ method: 'isDebug', params: { isDebug: true } });
	});

	test('it calls appsFlyer.stop', () => {
		appsFlyer.stop({ shouldStop: true });
		expect(lastPayload()).toEqual({ method: 'stop', params: { shouldStop: true } });
	});

	test('it calls appsFlyer.logEvent — awaitResponse omitted from the wire when not passed', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent({ eventName, eventValues });
		expect(lastPayload()).toEqual({ method: 'logEvent', params: { eventName, eventValues } });
	});

	test('it calls appsFlyer.logEvent with awaitResponse: true', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent({ eventName, eventValues, awaitResponse: true });
		expect(lastPayload()).toEqual({
			method: 'logEvent',
			params: { eventName, eventValues, awaitResponse: true },
		});
	});

	test('it calls appsFlyer.logLocation with valid coordinates', () => {
		appsFlyer.logLocation({ longitude: 12, latitude: 12 });
		expect(lastPayload()).toEqual({ method: 'logLocation', params: { longitude: 12, latitude: 12 } });
	});

	// The old hand-rolled index.ts rejected empty-string/non-numeric coordinates client-side before
	// dispatching. @appsflyer-sdk/js-core-plugin's logLocation forwards whatever the caller passes (it
	// trusts LogLocationParams's `number` typing) -- there is no equivalent runtime guard anymore.

	test('it calls appsFlyer.setUserEmail', () => {
		appsFlyer.setUserEmail({ email: 'a@b.com' });
		expect(lastPayload()).toEqual({ method: 'setUserEmail', params: { email: 'a@b.com' } });
	});

	test('it calls appsFlyer.setAdditionalData', () => {
		appsFlyer.setAdditionalData({ customData: {} });
		expect(lastPayload()).toEqual({ method: 'setAdditionalData', params: { customData: {} } });
	});

	test('it calls appsFlyer.getAppsFlyerUID', () => {
		appsFlyer.getAppsFlyerUID();
		expect(lastPayload()).toEqual({ method: 'getAppsFlyerUID', params: {} });
	});

	// Regression: mock only modeled Android's bare-value shape, so iOS's keyed-dict shape ({uid}, {version}) went uncovered.
	describe('getter resolved values are platform-neutral', () => {
		test.each([
			['iOS keyed dict', { uid: 'af-uid-1' }],
			['Android bare value', 'af-uid-1'],
		])('getAppsFlyerUID resolves whatever native returns given an %s (core does not unwrap a keyed dict)', async (_shape, data) => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(data));
			await expect(appsFlyer.getAppsFlyerUID()).resolves.toEqual(data);
		});

		// Guards against a truthiness rewrite: `data.x || data` would wrongly resolve true here.
		test('isSessionReady resolves a falsy value as-is', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(false));
			await expect(appsFlyer.isSessionReady()).resolves.toBe(false);
		});

		// Regression guard: isSessionReady is a pure read-only status query — it must not fire
		// registerSessionReadyListener as a side effect (that RPC is only for actual listener attach).
		test('isSessionReady does not register the session-ready listener as a side effect', async () => {
			await appsFlyer.isSessionReady();
			const dispatchedMethods = NativeAppsFlyer.executeRpc.mock.calls.map(
				([requestJson]) => JSON.parse(requestJson).method
			);
			expect(dispatchedMethods).not.toContain('registerSessionReadyListener');
		});

		// setUserEmail's core signature is `Promise<void>` -- unlike the old hand-rolled callRpc
		// (which resolved with whatever `data` native returned), it never propagates the RPC's
		// resolved value, so it always resolves undefined regardless of what native sends back.
		test('a void RPC resolves undefined regardless of native\'s resolved data', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(null));
			await expect(appsFlyer.setUserEmail({ email: 'a@b.com' })).resolves.toBeUndefined();
		});
	});

	test('it calls appsFlyer.updateServerUninstallToken on Android — same method name, token key unchanged', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.updateServerUninstallToken({ token: 'xxx' });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'updateServerUninstallToken',
			params: { token: 'xxx' },
		});
	});

	test('it calls appsFlyer.updateServerUninstallToken on iOS — real wire method is "registerUninstall", field renamed token -> deviceToken', () => {
		appsFlyer.updateServerUninstallToken({ token: 'xxx' });
		expect(lastPayload()).toEqual({ method: 'registerUninstall', params: { deviceToken: 'xxx' } });
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId({ customerId: 'xxx' });
		expect(lastPayload()).toEqual({ method: 'setCustomerUserId', params: { customerId: 'xxx' } });
	});

	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData({ partnerId: 'xxx', data: {} });
		expect(lastPayload()).toEqual({ method: 'setPartnerData', params: { partnerId: 'xxx', data: {} } });
	});

	test('it calls appsFlyer.setPartnerData with a null data object', () => {
		appsFlyer.setPartnerData({ partnerId: 'xxx', data: null });
		expect(lastPayload()).toEqual({ method: 'setPartnerData', params: { partnerId: 'xxx', data: null } });
	});

	// The old hand-rolled index.ts silently no-op'd for a non-string partnerId or non-object data
	// (typeof guards). @appsflyer-sdk/js-core-plugin has no such client-side guard -- removed, not a gap;
	// TypeScript's SetPartnerDataParams is the enforcement point for real callers.

	test('it calls appsFlyer.setSharingFilterForPartners', () => {
		appsFlyer.setSharingFilterForPartners({ partners: [] });
		expect(lastPayload()).toEqual({ method: 'setSharingFilterForPartners', params: { partners: [] } });
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage — iOS-only', () => {
		appsFlyer.setCurrentDeviceLanguage({ language: 'EN' });
		expect(lastPayload()).toEqual({ method: 'setCurrentDeviceLanguage', params: { language: 'EN' } });
	});

	test('setCurrentDeviceLanguage rejects on Android — no rpc.android entry exists for it', async () => {
		const { appsFlyer: androidAppsFlyer } = freshAppsFlyerForPlatform('android');
		await expect(androidAppsFlyer.setCurrentDeviceLanguage({ language: 'EN' })).rejects.toThrow(/not supported on android/);
	});

	test('it calls appsFlyer.stop(false) with shouldStop:false', () => {
		// Regression: Android's parser reads optBoolean('shouldStop', true) — a missing key leaves the SDK stopped forever.
		appsFlyer.stop({ shouldStop: false });
		expect(lastPayload()).toEqual({ method: 'stop', params: { shouldStop: false } });
	});

	// sendPushNotificationData (Android's flat campaign/pid/isRetargeting shape) and
	// handlePushNotification (iOS's raw pushPayload) are now two separate schema methods,
	// each supported on exactly one platform (see rpc-map.js) -- the old repo unified them into
	// one method that shipped both shapes in a single merged request; that merge is gone.
	test('sendPushNotificationData is Android-only, sending the flat campaign fields', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.sendPushNotificationData({ campaign: 'c1', pid: 'firebase', isRetargeting: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'sendPushNotificationData',
			params: { campaign: 'c1', pid: 'firebase', isRetargeting: true },
		});
	});

	test('handlePushNotification is iOS-only, sending the raw pushPayload', () => {
		appsFlyer.handlePushNotification({ pushPayload: { foo: 'bar' } });
		expect(lastPayload()).toEqual({ method: 'handlePushNotification', params: { pushPayload: { foo: 'bar' } } });
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL', () => {
		appsFlyer.appendParametersToDeepLinkingURL({ contains: 'dummy-url', parameters: {} });
		expect(lastPayload()).toEqual({
			method: 'appendParametersToDeepLinkingURL',
			params: { contains: 'dummy-url', parameters: {} },
		});
	});

	test('it calls appsFlyer.setDisableNetworkData on Android — field renamed isDisable, same key already', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setDisableNetworkData({ isDisable: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setDisableNetworkData',
			params: { isDisable: true },
		});
	});

	test('setDisableNetworkData rejects on iOS — Android-only', async () => {
		await expect(appsFlyer.setDisableNetworkData({ isDisable: true })).rejects.toThrow(/not supported on ios/);
	});

	test('it calls appsFlyer.start()', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse());
		await appsFlyer.start({ awaitResponse: true });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
		expect(lastPayload()).toEqual({ method: 'start', params: { awaitResponse: true } });
	});

	test('it calls appsFlyer.start() and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcError('start completed with error: timed out'));
		await expect(appsFlyer.start()).rejects.toEqual({
			code: 500,
			message: 'start completed with error: timed out',
		});
	});

	test('it calls appsFlyer.performDeepLinking() on Android — same method name, both fields kept', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.performDeepLinking({ url: '', shouldTriggerSession: false });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'performDeepLinking',
			params: { url: '', shouldTriggerSession: false },
		});
	});

	test('it calls appsFlyer.performDeepLinking() on iOS — real wire method is "performOnAppAttributionWithURL", shouldTriggerSession dropped', () => {
		appsFlyer.performDeepLinking({ url: '' });
		expect(lastPayload()).toEqual({ method: 'performOnAppAttributionWithURL', params: { url: '' } });
	});

	test('it calls appsFlyer.setDisableIDFVCollection — iOS-only', () => {
		appsFlyer.setDisableIDFVCollection({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableIDFVCollection', params: { disable: true } });
	});

	test('it calls appsFlyer.logAdRevenue with valid ad revenue data', () => {
		const adRevenueData = {
			monetizationNetwork: 'test_network',
			mediationNetwork: 'ironsource',
			currencyIso4217Code: 'USD',
			revenue: 10.99,
			additionalParameters: { test: 'param' },
		};
		appsFlyer.logAdRevenue(adRevenueData);
		expect(lastPayload()).toEqual({ method: 'logAdRevenue', params: adRevenueData });
	});

	// Android's RPC layer requires an exact mediationNetwork string match (no normalization);
	// iOS lowercases and strips underscores before matching. A few MEDIATION_NETWORK constants
	// don't survive Android's exact match as-is — logAdRevenue must resolve them per-platform.
	// This override reads Platform.OS live on every call (unlike RNTransport.platform, which is
	// captured once at construction) — so toggling Platform.OS against the same shared `appsFlyer`
	// singleton still works here, unlike the platform-divergent RPC-dispatch cases above.
	describe('logAdRevenue mediationNetwork per-platform resolution', () => {
		const originalOS = Platform.OS;

		afterEach(() => {
			Platform.OS = originalOS;
		});

		function paramsSentFor(mediationNetwork) {
			appsFlyer.logAdRevenue({
				monetizationNetwork: 'test_network',
				mediationNetwork,
				currencyIso4217Code: 'USD',
				revenue: 1,
			});
			return lastPayload().params;
		}

		test('Android: APPLOVIN_MAX/GOOGLE_ADMOB/TOPON_PTE are rewritten to Android\'s exact spelling', () => {
			Platform.OS = 'android';
			expect(paramsSentFor(MEDIATION_NETWORK.APPLOVIN_MAX).mediationNetwork).toBe('applovinmax');
			expect(paramsSentFor(MEDIATION_NETWORK.GOOGLE_ADMOB).mediationNetwork).toBe('googleadmob');
			expect(paramsSentFor(MEDIATION_NETWORK.TOPON_PTE).mediationNetwork).toBe('toponpte');
		});

		test('Android: CUSTOM_MEDIATION/DIRECT_MONETIZATION_NETWORK resolve to Android\'s camelCase spelling', () => {
			Platform.OS = 'android';
			expect(paramsSentFor(MEDIATION_NETWORK.CUSTOM_MEDIATION).mediationNetwork).toBe('customMediation');
			expect(paramsSentFor(MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK).mediationNetwork).toBe(
				'directMonetizationNetwork'
			);
		});

		test('iOS: APPLOVIN_MAX/GOOGLE_ADMOB/TOPON_PTE pass through unchanged (iOS normalizes case/underscores itself)', () => {
			Platform.OS = 'ios';
			expect(paramsSentFor(MEDIATION_NETWORK.APPLOVIN_MAX).mediationNetwork).toBe('applovin_max');
			expect(paramsSentFor(MEDIATION_NETWORK.GOOGLE_ADMOB).mediationNetwork).toBe('google_admob');
			expect(paramsSentFor(MEDIATION_NETWORK.TOPON_PTE).mediationNetwork).toBe('topon_pte');
		});

		test('iOS: CUSTOM_MEDIATION/DIRECT_MONETIZATION_NETWORK resolve to iOS\'s normalizer-safe spelling', () => {
			Platform.OS = 'ios';
			expect(paramsSentFor(MEDIATION_NETWORK.CUSTOM_MEDIATION).mediationNetwork).toBe('custom');
			expect(paramsSentFor(MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK).mediationNetwork).toBe(
				'directmonetization'
			);
		});
	});

	test('it calls appsFlyer.anonymizeUser', () => {
		appsFlyer.anonymizeUser({ shouldAnonymize: true });
		expect(lastPayload()).toEqual({ method: 'anonymizeUser', params: { shouldAnonymize: true } });
	});

	test('it calls appsFlyer.setCurrencyCode', () => {
		appsFlyer.setCurrencyCode({ currencyCode: 'USD' });
		expect(lastPayload()).toEqual({ method: 'setCurrencyCode', params: { currencyCode: 'USD' } });
	});

	test('it calls appsFlyer.setOneLinkCustomDomain', () => {
		const domains = ['example.com', 'brand.com'];
		appsFlyer.setOneLinkCustomDomain({ domains });
		expect(lastPayload()).toEqual({ method: 'setOneLinkCustomDomain', params: { domains } });
	});

	test('it calls appsFlyer.setAppInviteOneLink', () => {
		appsFlyer.setAppInviteOneLink({ oneLinkId: 'test_one_link_id' });
		expect(lastPayload()).toEqual({ method: 'setAppInviteOneLink', params: { oneLinkId: 'test_one_link_id' } });
	});

	test('it calls appsFlyer.generateInviteLink on iOS — referrerCustomerId kept as-is', () => {
		appsFlyer.generateInviteLink({
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

	test('it calls appsFlyer.generateInviteLink on Android — referrerCustomerId remapped to customerId', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
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

	test('it calls appsFlyer.setDisableCollectASA — iOS-only', () => {
		appsFlyer.setDisableCollectASA({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableCollectASA', params: { disable: true } });
	});

	test('it calls appsFlyer.setUseReceiptValidationSandbox — iOS-only', () => {
		appsFlyer.setUseReceiptValidationSandbox({ sandbox: true });
		expect(lastPayload()).toEqual({ method: 'setUseReceiptValidationSandbox', params: { sandbox: true } });
	});

	test('it calls appsFlyer.setDisableSKAdNetwork — iOS-only', () => {
		appsFlyer.setDisableSKAdNetwork({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableSKAdNetwork', params: { disable: true } });
	});

	test('it calls appsFlyer.setCollectAndroidID — Android-only', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setCollectAndroidID({ isCollect: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setCollectAndroidID',
			params: { isCollect: true },
		});
	});

	test('setCollectAndroidID rejects on iOS — Android-only', async () => {
		await expect(appsFlyer.setCollectAndroidID({ isCollect: true })).rejects.toThrow(/not supported on ios/);
	});

	test('it calls appsFlyer.disableAppSetId — Android-only', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.disableAppSetId();
		expect(lastPayload(androidNative.executeRpc)).toEqual({ method: 'disableAppSetId', params: {} });
	});

	test('it calls appsFlyer.validateAndLogInAppPurchase on Android — flattens purchase.* onto the wire params, purchaseType snake_cased', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
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

	test('it calls appsFlyer.validateAndLogInAppPurchase on iOS — nests purchase.* under product/transaction', () => {
		// NOTE: the schema's publicApi.purchase.purchaseType enum is ['oneTimePurchase', 'subscription']
		// (camelCase) on BOTH platforms -- androidPurchaseType is the only place snake_case appears,
		// applied by the resolver, not something a caller should pass in directly. This repo's own
		// exported `AFPurchaseType.ONE_TIME_PURCHASE` constant still equals the OLD snake_case value
		// ('one_time_purchase'), which is stale against this new public contract -- flagged for the
		// index.ts owner, not fixed here (out of scope for this test-only pass).
		appsFlyer.validateAndLogInAppPurchase({
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

	// Wire value, not key: Android's "one_time_purchase" vs iOS's "oneTimePurchase" spelling.
	// Uses the schema's real publicApi value ('oneTimePurchase') rather than the stale
	// AFPurchaseType.ONE_TIME_PURCHASE constant -- see the note above.
	test('validateAndLogInAppPurchase maps purchaseType per platform (Android: snake_case)', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'oneTimePurchase', productId: 'sku', purchaseToken: 'txn' },
		});
		expect(lastPayload(androidNative.executeRpc).params.purchaseType).toBe('one_time_purchase');
	});

	test('validateAndLogInAppPurchase maps purchaseType per platform (iOS: camelCase, nested)', () => {
		appsFlyer.validateAndLogInAppPurchase({
			purchase: { purchaseType: 'oneTimePurchase', productId: 'sku', transactionId: 'txn' },
		});
		expect(lastPayload().params.transaction.purchaseType).toBe('oneTimePurchase');
	});

	test('validateAndLogInAppPurchase leaves subscription spelling untouched on both platforms', () => {
		appsFlyer.validateAndLogInAppPurchase({
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

	test('it calls appsFlyer.setResolveDeepLinkURLs', () => {
		const urls = ['example.com', 'brand.com'];
		appsFlyer.setResolveDeepLinkURLs({ urls });
		expect(lastPayload()).toEqual({ method: 'setResolveDeepLinkURLs', params: { urls } });
	});

	test('it calls appsFlyer.setDisableAdvertisingIdentifiers on iOS — field stays "disable"', () => {
		appsFlyer.setDisableAdvertisingIdentifiers({ disable: true });
		expect(lastPayload()).toEqual({ method: 'setDisableAdvertisingIdentifiers', params: { disable: true } });
	});

	test('it calls appsFlyer.setDisableAdvertisingIdentifiers on Android — field renamed disable -> isDisable', () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidAppsFlyer.setDisableAdvertisingIdentifiers({ disable: true });
		expect(lastPayload(androidNative.executeRpc)).toEqual({
			method: 'setDisableAdvertisingIdentifiers',
			params: { isDisable: true },
		});
	});

	test('it calls appsFlyer.enableTCFDataCollection', () => {
		appsFlyer.enableTCFDataCollection({ shouldCollect: true });
		expect(lastPayload()).toEqual({ method: 'enableTCFDataCollection', params: { shouldCollect: true } });
	});

	test('it calls appsFlyer.setConsentData', () => {
		const consentData = { isUserSubjectToGDPR: true };
		appsFlyer.setConsentData(consentData);
		expect(lastPayload()).toEqual({ method: 'setConsentData', params: consentData });
	});

	// The old hand-rolled index.ts defaulted isUserSubjectToGDPR to false when omitted (iOS's parser
	// requires it, no default). @appsflyer-sdk/js-core-plugin's setConsentData forwards params as given --
	// no such default is applied anymore. Reject-at-native (iOS) or accept-with-Android-default is
	// now native's own behavior, not this plugin's; TypeScript's SetConsentDataParams still requires
	// the field, so real callers can't omit it silently.

	// `AppsFlyerConsent` (a convenience constructor class for building the setConsentData payload)
	// is no longer exported from index.ts after the @appsflyer-sdk/js-core-plugin migration -- callers now
	// build the plain SetConsentDataParams object directly (see the setConsentData test above).
	// Flagged for the index.ts owner as a real, unflagged public-API removal; not re-added here
	// (out of scope for this test-only pass) -- these two tests are deleted, not converted.
});

describe('Test native event emitter', () => {
	// freshModule() resets module state (Platform.OS defaults back to 'ios' each time, matching this
	// Jest environment's haste default) -- listener-registration state lives inside
	// @appsflyer-sdk/js-core-plugin's AppsFlyerSDK instance, which is itself a module-level singleton in index.ts.
	function freshModule() {
		jest.resetModules();
		const { NativeEventEmitter: FreshNativeEventEmitter } = require('react-native');
		const freshAppsFlyer = require('../index').default;
		const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
		return {
			appsFlyer: freshAppsFlyer,
			nativeEventEmitter: new FreshNativeEventEmitter(freshNativeAppsFlyer),
		};
	}

	let appsFlyer;
	let nativeEventEmitter;
	let nativeEventObject = { test: 'la' };

	function emitRpcEvent(event, data) {
		nativeEventEmitter.emit('RNAppsFlyer_rpcEvent', JSON.stringify({ event, data, timestamp: Date.now() }));
	}

	beforeEach(() => {
		({ appsFlyer, nativeEventEmitter } = freshModule());
	});

	test('registerConversionListener onConversionDataSuccess Happy Flow', async () => {
		const onSuccess = jest.fn();
		await appsFlyer.registerConversionListener({ onConversionDataSuccess: onSuccess, onConversionDataFail: jest.fn() });

		emitRpcEvent('onConversionDataSuccess', nativeEventObject);
		expect(onSuccess).toHaveBeenCalledWith(nativeEventObject);
	});

	test('registerConversionListener onConversionDataFail Happy Flow', async () => {
		const onFail = jest.fn();
		await appsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: onFail });

		emitRpcEvent('onConversionDataFail', { error: 'DevKey is incorrect' });
		expect(onFail).toHaveBeenCalledWith({ error: 'DevKey is incorrect' });
	});

	// unregisterConversionListener has no rpc.ios entry at all (verified against native source --
	// AFRPCTypedRequests.swift/AFRPCParser.swift register no such method) -- it rejects on the
	// default (iOS) singleton instead of silently sending a doomed RPC.
	test('unregisterConversionListener rejects on iOS — no rpc.ios entry exists for it', async () => {
		await appsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		await expect(appsFlyer.unregisterConversionListener()).rejects.toThrow(/not supported on ios/);
	});

	test('unregisterConversionListener on Android sends the native unregister call, but does not clear the JS callback', async () => {
		const { appsFlyer: androidAppsFlyer, nativeEventEmitter: androidEmitter } = (() => {
			jest.resetModules();
			const { Platform: FreshPlatform, NativeEventEmitter: FreshNativeEventEmitter } = require('react-native');
			FreshPlatform.OS = 'android';
			const freshAppsFlyer = require('../index').default;
			const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
			return { appsFlyer: freshAppsFlyer, nativeEventEmitter: new FreshNativeEventEmitter(freshNativeAppsFlyer) };
		})();
		const successCallback = jest.fn();
		await androidAppsFlyer.registerConversionListener({ onConversionDataSuccess: successCallback, onConversionDataFail: jest.fn() });
		await androidAppsFlyer.unregisterConversionListener();

		androidEmitter.emit('RNAppsFlyer_rpcEvent', JSON.stringify({ event: 'onConversionDataSuccess', data: nativeEventObject }));

		// unregisterConversionListener only tears down the transport's native subscription (a no-op
		// in this in-memory event emitter); the JS ListenerRegistry callback itself is not cleared --
		// see @appsflyer-sdk/js-core-plugin's AppsFlyerSDK for this behavior. Still fires because the fake
		// event emitter delivers regardless.
		expect(successCallback).toHaveBeenCalledWith(nativeEventObject);
	});

	test('registerDeepLinkListener Happy Flow (iOS native event name)', async () => {
		const onDeepLinking = jest.fn();
		await appsFlyer.registerDeepLinkListener({ onDeepLinking });
		emitRpcEvent('onDeepLinkReceived', nativeEventObject);
		expect(onDeepLinking).toHaveBeenCalledWith(nativeEventObject);
	});

	test('registerDeepLinkListener Happy Flow (Android native event name)', async () => {
		const onDeepLinking = jest.fn();
		await appsFlyer.registerDeepLinkListener({ onDeepLinking });
		emitRpcEvent('onDeepLinking', nativeEventObject);
		expect(onDeepLinking).toHaveBeenCalledWith(nativeEventObject);
	});

	test('onAppOpenAttribution / onAttributionFailure were removed and merged into registerDeepLinkListener', () => {
		expect(appsFlyer.onAppOpenAttribution).toBeUndefined();
		expect(appsFlyer.onAttributionFailure).toBeUndefined();
	});
});

// --- net-new RPC-only method wrappers ---

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

		await appsFlyer.setMinTimeBetweenSessions({ seconds: 30 });

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({
			method: 'setMinTimeBetweenSessions',
			params: { seconds: 30 },
		});
	});

	test('setUserPhone (Hashed-PII) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		// Native reads a split country code + number, never a combined `phone` string.
		await appsFlyer.setUserPhone({ countryCode: '1', phoneNumber: '5551234567' });

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({
			method: 'setUserPhone',
			params: { countryCode: '1', phoneNumber: '5551234567' },
		});
	});

	test('clearUserPii (Hashed-PII) calls executeRpc with empty params', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.clearUserPii();

		expect(lastPayloadOf(NativeAppsFlyer.executeRpc)).toEqual({ method: 'clearUserPii', params: {} });
	});

	test('setPreinstallAttribution (Android-only) calls executeRpc with the right envelope', async () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidNative.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await androidAppsFlyer.setPreinstallAttribution({ mediaSource: 'media_src', campaign: 'campaign_1', siteId: 'site_1' });

		expect(lastPayloadOf(androidNative.executeRpc)).toEqual({
			method: 'setPreinstallAttribution',
			params: { mediaSource: 'media_src', campaign: 'campaign_1', siteId: 'site_1' },
		});
	});

	test('isStopped (Android-only getter) resolves with response.data', async () => {
		const { appsFlyer: androidAppsFlyer, NativeAppsFlyer: androidNative } = freshAppsFlyerForPlatform('android');
		androidNative.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: false }));

		await expect(androidAppsFlyer.isStopped()).resolves.toBe(false);
		expect(lastPayloadOf(androidNative.executeRpc)).toEqual({ method: 'isStopped', params: {} });
	});
});
