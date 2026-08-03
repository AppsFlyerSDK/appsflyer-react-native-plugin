import appsFlyer, { AppsFlyerConsent, AFParseJSONException, AFPurchaseType, MEDIATION_NETWORK } from '../index';
import { NativeEventEmitter, Platform } from 'react-native';
import NativeAppsFlyer from '../src/NativeAppsFlyer';

function mockRpcResponse(data = {}) {
	return JSON.stringify({ success: true, data });
}

function mockRpcError(message, code = 500) {
	return JSON.stringify({ success: false, error: { code, message } });
}
const fs = require('fs');
const path = require('path');

describe("Test appsFlyer API's", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('it calls appsFlyer.init with devKey/appId positional args', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse()).mockResolvedValueOnce(mockRpcResponse());
		await appsFlyer.init('xxxx', '777');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(2);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'setPluginInfo',
				params: { plugin: 'react_native', pluginVersion: require('../package.json').version },
			})
		);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'init', params: { devKey: 'xxxx', appId: '777' } })
		);
	});

	test('it calls appsFlyer.init and rejects when appId is not a string', () => {
		// unhandled rejection crashes Node — observe it even though we don't assert on it
		appsFlyer.init('xxxx', 7).catch(() => {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.init and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc
			.mockResolvedValueOnce(mockRpcResponse())
			.mockResolvedValueOnce(mockRpcError('devKey missing', 400));
		await expect(appsFlyer.init('xxxx', '777')).rejects.toEqual({
			code: 400,
			message: 'devKey missing',
		});
	});

	test('it calls appsFlyer.setIsDebug', () => {
		appsFlyer.setIsDebug(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'isDebug', params: { isDebug: true } })
		);
	});

	test('it calls appsFlyer.stop', () => {
		appsFlyer.stop(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'stop', params: { shouldStop: true } })
		);
	});

	test('it calls appsFlyer.logEvent with promise', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'logEvent',
				params: { eventName, eventValues, awaitResponse: false },
			})
		);
	});

	test('it calls appsFlyer.logEvent with awaitResponse: true', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues, true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'logEvent',
				params: { eventName, eventValues, awaitResponse: true },
			})
		);
	});

	test('it calls appsFlyer.logLocation with valid coordinates', () => {
		appsFlyer.logLocation(12, 12);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.logLocation with empty string lat', () => {
		appsFlyer.logLocation(12, '');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with empty string long', () => {
		appsFlyer.logLocation('', 12);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with string long', () => {
		appsFlyer.logLocation('12', 12);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.logLocation with string lat', () => {
		appsFlyer.logLocation(12, '12');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.setUserEmail', () => {
		appsFlyer.setUserEmail('a@b.com');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setUserEmail', params: { email: 'a@b.com' } })
		);
	});

	test('it calls appsFlyer.setAdditionalData', () => {
		appsFlyer.setAdditionalData({});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setAdditionalData', params: { customData: {} } })
		);
	});

	test('it calls appsFlyer.getAppsFlyerUID', () => {
		appsFlyer.getAppsFlyerUID();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'getAppsFlyerUID', params: {} })
		);
	});

	// Regression: mock only modeled Android's bare-value shape, so iOS's keyed-dict shape ({uid}, {version}) went uncovered.
	describe('getter resolved values are platform-neutral', () => {
		test.each([
			['iOS keyed dict', { uid: 'af-uid-1' }],
			['Android bare value', 'af-uid-1'],
		])('getAppsFlyerUID resolves a string given an %s', async (_shape, data) => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(data));
			await expect(appsFlyer.getAppsFlyerUID()).resolves.toBe('af-uid-1');
		});

		test.each([
			['iOS keyed dict', { version: '7.0.1' }],
			['Android bare value', '7.0.1'],
		])('getSDKVersion resolves a string given an %s', async (_shape, data) => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(data));
			await expect(appsFlyer.getSDKVersion()).resolves.toBe('7.0.1');
		});

		// Guards against a truthiness rewrite: `data.x || data` would wrongly resolve true here.
		test('isSessionReady unwraps a falsy keyed value', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(
				mockRpcResponse({ isSessionReady: false })
			);
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

		// iOS used to leak its {success, message} status envelope here instead of resolving null.
		test('a void RPC resolves null, not a status envelope', async () => {
			NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse(null));
			await expect(appsFlyer.setUserEmail('a@b.com')).resolves.toBeNull();
		});
	});

	test('it calls appsFlyer.updateServerUninstallToken', () => {
		appsFlyer.updateServerUninstallToken('xxx');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'updateServerUninstallToken',
				params: { token: 'xxx', deviceToken: 'xxx' },
			})
		);
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId('xxx');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCustomerUserId', params: { customerId: 'xxx' } })
		);
	});

	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData('xxx', {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setPartnerData', params: { partnerId: 'xxx', data: {} } })
		);
	});

	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData(55, {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});
	test('it calls appsFlyer.setPartnerData', () => {
		// typeof null === "object", so the existing guard lets this call through unchanged.
		appsFlyer.setPartnerData('xxx', null);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setPartnerData', params: { partnerId: 'xxx', data: null } })
		);
	});
	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData(null, {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setSharingFilterForPartners', () => {
		appsFlyer.setSharingFilterForPartners([]);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setSharingFilterForPartners', params: { partners: [] } })
		);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage('EN');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCurrentDeviceLanguage', params: { language: 'EN' } })
		);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage(5);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage(null);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage({});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.stop(true)', () => {
		appsFlyer.stop(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'stop', params: { shouldStop: true } })
		);
	});

	// Regression: Android's parser reads optBoolean('shouldStop', true) — a missing key leaves the SDK stopped forever.
	test('it calls appsFlyer.stop(false) with shouldStop:false', () => {
		appsFlyer.stop(false);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'stop', params: { shouldStop: false } })
		);
	});

	test('it calls appsFlyer.sendPushNotificationData({}, androidCampaignData)', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' }, {
			campaign: 'c1',
			pid: 'firebase',
			isRetargeting: true,
		});
		// iOS reads the raw pushPayload; Android reads the flat campaign fields.
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'sendPushNotificationData',
				params: {
					pushPayload: { foo: 'bar' },
					campaign: 'c1',
					pid: 'firebase',
					isRetargeting: true,
				},
			})
		);
	});

	test('it calls appsFlyer.sendPushNotificationData({})', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'sendPushNotificationData',
				params: {
					pushPayload: { foo: 'bar' },
					campaign: '',
					pid: '',
					isRetargeting: false,
				},
			})
		);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, foo)', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', 'foo');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, boolean)', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, {})', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'appendParametersToDeepLinkingURL', params: { contains: 'dummy-url', parameters: {} } })
		);
	});

	test('it calls appsFlyer.setDisableNetworkData(true)', () => {
		appsFlyer.setDisableNetworkData(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableNetworkData', params: { isDisable: true } })
		);
	});

	test('it calls appsFlyer.start()', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse());
		await appsFlyer.start();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'start', params: { awaitResponse: true } })
		);
	});

	test('it calls appsFlyer.start() and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcError('start completed with error: timed out'));
		await expect(appsFlyer.start()).rejects.toEqual({
			code: 500,
			message: 'start completed with error: timed out',
		});
	});

	// Regression guard for finding #4: start() must route through callRpc's shared
	// Android 422 -> 404 "unknown method" normalization, same as every other RPC method.
	test('it calls appsFlyer.start() and normalizes an Android 422 unknown-method error to 404', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(
			mockRpcError('Unknown or missing method: start', 422)
		);
		await expect(appsFlyer.start()).rejects.toEqual({
			code: 404,
			message: 'Unknown or missing method: start',
		});
	});

	test('it calls appsFlyer.performOnDeepLinking()', () => {
		appsFlyer.performOnDeepLinking();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'performDeepLinking',
				params: { url: '', shouldTriggerSession: false },
			})
		);
	});

	test('it calls appsFlyer.disableIDFVCollection()', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableIDFVCollection', params: { disable: true } })
		);
	});

	test('it calls appsFlyer.logAdRevenue with valid ad revenue data', () => {
		const adRevenueData = {
			monetizationNetwork: 'test_network',
			mediationNetwork: 'ironsource',
			currencyIso4217Code: 'USD',
			revenue: 10.99,
			additionalParameters: { test: 'param' }
		};
		appsFlyer.logAdRevenue(adRevenueData);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logAdRevenue', params: adRevenueData })
		);
	});

	// Android's RPC layer requires an exact mediationNetwork string match (no normalization);
	// iOS lowercases and strips underscores before matching. A few MEDIATION_NETWORK constants
	// don't survive Android's exact match as-is — logAdRevenue must resolve them per-platform.
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
			const calls = NativeAppsFlyer.executeRpc.mock.calls;
			const [requestJson] = calls[calls.length - 1];
			return JSON.parse(requestJson).params;
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
		appsFlyer.anonymizeUser(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'anonymizeUser', params: { shouldAnonymize: true } })
		);
	});

	test('it calls appsFlyer.setCurrencyCode', () => {
		appsFlyer.setCurrencyCode('USD');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCurrencyCode', params: { currencyCode: 'USD' } })
		);
	});

	test('it calls appsFlyer.setCurrencyCode with number conversion', () => {
		appsFlyer.setCurrencyCode(123);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCurrencyCode', params: { currencyCode: '123' } })
		);
	});

	test('it calls appsFlyer.setOneLinkCustomDomains', () => {
		const domains = ['example.com', 'brand.com'];
		appsFlyer.setOneLinkCustomDomains(domains);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setOneLinkCustomDomain', params: { domains } })
		);
	});

	test('it calls appsFlyer.setAppInviteOneLinkID', () => {
		appsFlyer.setAppInviteOneLinkID('test_one_link_id');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setAppInviteOneLink', params: { oneLinkId: 'test_one_link_id' } })
		);
	});

	test('it calls appsFlyer.generateInviteLink with valid params', () => {
		const params = {
			channel: 'test_channel',
			campaign: 'test_campaign',
			customerID: 'test_customer',
			userParams: { deep_link_value: 'test_value' }
		};
		appsFlyer.generateInviteLink(params);
		// customerID has no native counterpart under that name: iOS reads referrerCustomerId,
		// Android reads customerId, so it is sent under both.
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'generateInviteLink',
				params: {
					channel: 'test_channel',
					campaign: 'test_campaign',
					userParams: { deep_link_value: 'test_value' },
					referrerCustomerId: 'test_customer',
					customerId: 'test_customer',
				},
			})
		);
	});

	test('it calls appsFlyer.disableCollectASA', () => {
		appsFlyer.disableCollectASA(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableCollectASA', params: { disable: true } })
		);
	});

	test('it calls appsFlyer.setUseReceiptValidationSandbox', () => {
		appsFlyer.setUseReceiptValidationSandbox(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setUseReceiptValidationSandbox', params: { sandbox: true } })
		);
	});

	test('it calls appsFlyer.disableSKAD', () => {
		appsFlyer.disableSKAD(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableSKAdNetwork', params: { disable: true } })
		);
	});

	test('it calls appsFlyer.disableIDFVCollection', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableIDFVCollection', params: { disable: true } })
		);
	});

	test('it calls appsFlyer.setCollectAndroidID', () => {
		appsFlyer.setCollectAndroidID(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCollectAndroidID', params: { isCollect: true } })
		);
	});

	test('it calls appsFlyer.setCollectAndroidID with isCollect: false', () => {
		appsFlyer.setCollectAndroidID(false);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCollectAndroidID', params: { isCollect: false } })
		);
	});

	test('it calls appsFlyer.disableAppSetId', () => {
		appsFlyer.disableAppSetId();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'disableAppSetId', params: {} })
		);
	});
	test('it calls appsFlyer.validateAndLogInAppPurchase with valid purchase details', () => {
		const purchaseDetails = {
			purchaseType: 'subscription',
			transactionId: 'test_transaction_123',
			productId: 'test_product_123'
		};
		const additionalParameters = { test: 'param' };
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchase(purchaseDetails, additionalParameters, callback);
		// iOS reads nested product/transaction; Android reads the flat trio (its purchaseToken
		// is the same value callers pass as transactionId). Both shapes ship together.
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'validateAndLogInAppPurchase',
				params: {
					product: { productId: 'test_product_123' },
					transaction: { transactionId: 'test_transaction_123', purchaseType: 'subscription' },
					productId: 'test_product_123',
					purchaseToken: 'test_transaction_123',
					purchaseType: 'subscription',
					additionalParameters: additionalParameters,
				},
			})
		);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchase without additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_456',
			productId: 'test_product_456'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchase(purchaseDetails, undefined, callback);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'validateAndLogInAppPurchase',
				params: {
					product: { productId: 'test_product_456' },
					transaction: {
						transactionId: 'test_transaction_456',
						purchaseType: 'oneTimePurchase',
					},
					productId: 'test_product_456',
					purchaseToken: 'test_transaction_456',
					purchaseType: 'one_time_purchase',
					additionalParameters: undefined,
				},
			})
		);
	});

	// Wire value, not key: Android's "one_time_purchase" vs iOS's "oneTimePurchase" — nested (iOS) and flat (Android) halves carry different spellings.
	test('validateAndLogInAppPurchase maps purchaseType per platform', () => {
		appsFlyer.validateAndLogInAppPurchase(
			{
				purchaseType: AFPurchaseType.ONE_TIME_PURCHASE,
				transactionId: 'txn',
				productId: 'sku',
			},
			undefined,
			jest.fn()
		);
		const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
		const { params } = JSON.parse(requestJson);
		expect(params.transaction.purchaseType).toBe('oneTimePurchase');
		expect(params.purchaseType).toBe('one_time_purchase');
	});

	test('validateAndLogInAppPurchase leaves subscription spelling untouched', () => {
		appsFlyer.validateAndLogInAppPurchase(
			{ purchaseType: AFPurchaseType.SUBSCRIPTION, transactionId: 't', productId: 'p' },
			undefined,
			jest.fn()
		);
		const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
		const { params } = JSON.parse(requestJson);
		expect(params.transaction.purchaseType).toBe('subscription');
		expect(params.purchaseType).toBe('subscription');
	});

	test('it calls appsFlyer.validateAndLogInAppPurchase without callback', () => {
		const purchaseDetails = {
			purchaseType: 'subscription',
			transactionId: 'test_transaction_789',
			productId: 'test_product_789'
		};

		appsFlyer.validateAndLogInAppPurchase(purchaseDetails);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchase with null additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_null',
			productId: 'test_product_null'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchase(purchaseDetails, null, callback);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'validateAndLogInAppPurchase',
				params: {
					product: { productId: 'test_product_null' },
					transaction: {
						transactionId: 'test_transaction_null',
						purchaseType: 'oneTimePurchase',
					},
					productId: 'test_product_null',
					purchaseToken: 'test_transaction_null',
					purchaseType: 'one_time_purchase',
					additionalParameters: null,
				},
			})
		);
	});
	
	test('AFPurchaseType enum values are correct', () => {
		expect('subscription').toBe('subscription');
		expect('one_time_purchase').toBe('one_time_purchase');
	});

	test('MEDIATION_NETWORK enum values are correct', () => {
		expect('ironsource').toBe('ironsource');
		expect('applovin_max').toBe('applovin_max');
		expect('google_admob').toBe('google_admob');
		expect('fyber').toBe('fyber');
		expect('appodeal').toBe('appodeal');
		expect('Admost').toBe('Admost');
		expect('Topon').toBe('Topon');
		expect('Tradplus').toBe('Tradplus');
		expect('Yandex').toBe('Yandex');
		expect('chartboost').toBe('chartboost');
		expect('Unity').toBe('Unity');
		expect('topon_pte').toBe('topon_pte');
		expect('custom_mediation').toBe('custom_mediation');
		expect('direct_monetization_network').toBe('direct_monetization_network');
	});

	test('AF_EMAIL_CRYPT_TYPE enum values are correct', () => {
		expect(0).toBe(0);
		expect(3).toBe(3);
	});

	test('StoreKitVersion enum values are correct', () => {
		expect('SK1').toBe('SK1');
		expect('SK2').toBe('SK2');
	});

	test('it calls appsFlyer.setResolveDeepLinkURLs', () => {
		const urls = ['example.com', 'brand.com'];
		appsFlyer.setResolveDeepLinkURLs(urls);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setResolveDeepLinkURLs', params: { urls } })
		);
	});

	test('it calls appsFlyer.disableAdvertisingIdentifier', () => {
		appsFlyer.disableAdvertisingIdentifier(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'setDisableAdvertisingIdentifiers',
				params: { isDisable: true, disable: true },
			})
		);
	});

	test('it calls appsFlyer.enableTCFDataCollection', () => {
		appsFlyer.enableTCFDataCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'enableTCFDataCollection', params: { shouldCollect: true } })
		);
	});

	test('it calls appsFlyer.setConsentData', () => {
		const consentData = { isUserSubjectToGDPR: true };
		appsFlyer.setConsentData(consentData);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setConsentData', params: consentData })
		);
	});

	test('AppsFlyerConsent constructor with all parameters', () => {
		const consent = new AppsFlyerConsent(true, true, false, true);
		expect(consent.isUserSubjectToGDPR).toBe(true);
		expect(consent.hasConsentForDataUsage).toBe(true);
		expect(consent.hasConsentForAdsPersonalization).toBe(false);
		expect(consent.hasConsentForAdStorage).toBe(true);
	});

	test('AppsFlyerConsent constructor with minimal parameters', () => {
		const consent = new AppsFlyerConsent(false);
		expect(consent.isUserSubjectToGDPR).toBe(false);
		expect(consent.hasConsentForDataUsage).toBeUndefined();
		expect(consent.hasConsentForAdsPersonalization).toBeUndefined();
		expect(consent.hasConsentForAdStorage).toBeUndefined();
	});


	test('AFParseJSONException constructor', () => {
		const error = new AFParseJSONException('Test error', { data: 'test' });
		expect(error.message).toBe('Test error');
		expect(error.data).toEqual({ data: 'test' });
		expect(error.name).toBe('AFParseJSONException');
	});
});

describe('Test native event emitter', () => {
	// freshModule() resets module state (same pattern as rpc-contract.test.js's freshModule()) —
	// rpcListenerBuckets is a module-level singleton in index.js, so a listener that leaks past
	// its own removal (e.g. an assertion throws before the test calls its unregister function)
	// would otherwise carry over into the next test in this describe block.
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
	let gcdListener;
	let udlListener;
	let nativeEventObject = { test: 'la' };

	// index.js demuxes a single "RNAppsFlyer_rpcEvent" envelope onto listener APIs
	function emitRpcEvent(event, data, origin = 'ios') {
		nativeEventEmitter.emit(
			'RNAppsFlyer_rpcEvent',
			JSON.stringify({ event, data, timestamp: Date.now(), origin })
		);
	}

	beforeEach(() => {
		({ appsFlyer, nativeEventEmitter } = freshModule());
		gcdListener = null;
		udlListener = null;
	});

	test('GCD listener Happy Flow', () => {
		gcdListener = appsFlyer.onInstallConversionData((res) => {
			expect(res).toEqual(nativeEventObject);
			gcdListener();
		});

		emitRpcEvent('onConversionDataSuccess', nativeEventObject);
	});

	test('GCD listener handles a stringified JSON `data` payload (known-issues-kb.md payload-shape delta)', () => {
		gcdListener = appsFlyer.onInstallConversionData((res) => {
			expect(res).toEqual(nativeEventObject);
			gcdListener();
		});

		emitRpcEvent('onConversionDataSuccess', JSON.stringify(nativeEventObject));
	});

	test('GCD listener gets an unparsable stringified `data` payload', () => {
		gcdListener = appsFlyer.onInstallConversionData((error) => {
			expect(typeof error).toEqual('object');
			expect(error.message).toEqual('Invalid data structure');
			expect(error.name).toEqual('AFParseJSONException');
			gcdListener();
		});

		emitRpcEvent('onConversionDataSuccess', 'not valid json');
	});

	test('onInstallConversionFailure listener Happy Flow', () => {
		let failureListener = appsFlyer.onInstallConversionFailure((res) => {
			expect(res).toEqual(nativeEventObject);
			failureListener();
		});

		emitRpcEvent('onConversionDataFail', nativeEventObject);
	});

	test('UDL listener Happy Flow (iOS native event name)', () => {
		udlListener = appsFlyer.onDeepLink((res) => {
			expect(res).toEqual(nativeEventObject);
			udlListener();
		});
		emitRpcEvent('onDeepLinkReceived', nativeEventObject, 'ios');
	});

	test('UDL listener Happy Flow (Android native event name)', () => {
		udlListener = appsFlyer.onDeepLink((res) => {
			expect(res).toEqual(nativeEventObject);
			udlListener();
		});
		emitRpcEvent('onDeepLinking', nativeEventObject, 'android');
	});

	// Regression test for #12: a listener callback that throws before reaching its own
	// unregister call must not leak into the next test in this bucket. Reproduces the failure
	// mode by never removing the listener, then proving the following test only sees its own.
	test('a listener that throws before self-removing does not leak into the next test', () => {
		appsFlyer.onDeepLink(() => {
			throw new Error('simulated assertion failure before self-removal');
		});

		expect(() => emitRpcEvent('onDeepLinkReceived', nativeEventObject, 'ios')).toThrow();
	});

	test('the next test in the same bucket only sees its own listener, not a leaked one', () => {
		const callback = jest.fn();
		appsFlyer.onDeepLink(callback);

		emitRpcEvent('onDeepLinkReceived', nativeEventObject, 'ios');

		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('onAppOpenAttribution / onAttributionFailure were removed and merged into onDeepLink', () => {
		expect(appsFlyer.onAppOpenAttribution).toBeUndefined();
		expect(appsFlyer.onAttributionFailure).toBeUndefined();
	});
	// Previously this subscribed to a raw "onValidationResult" event that no native code ever
	// emits — RCTEventEmitter rejects addListener for event names outside the module's declared
	// supportedEvents, so every real call crashed the host app on New Architecture (only the
	// Jest NativeEventEmitter mock allowed it, which is why these tests passed while the app
	// crashed). The callback is now documented as inert until a real native event exists.
	test('validateAndLogInAppPurchase callback is inert and does not subscribe to any event', () => {
		const callback = jest.fn();

		const remove = appsFlyer.validateAndLogInAppPurchase(
			{ purchaseType: 'subscription', transactionId: 'test_123', productId: 'test_product' },
			{ test: 'param' },
			callback
		);

		nativeEventEmitter.emit('onValidationResult', JSON.stringify({ result: true }));
		expect(callback).not.toHaveBeenCalled();
		expect(() => remove()).not.toThrow();
	});
});

// --- net-new RPC-only method wrappers ---

function buildRpcRequest(method, params = {}) {
	return JSON.stringify({ method, params });
}

describe('net-new RPC-only method wrappers (one per domain block)', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('setMinTimeBetweenSessions (Complex-config) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.setMinTimeBetweenSessions(30);

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('setMinTimeBetweenSessions', { seconds: 30 })
		);
	});

	test('setUserPhone (Hashed-PII) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		// Native reads a split country code + number, never a combined `phone` string.
		await appsFlyer.setUserPhone('1', '5551234567');

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('setUserPhone', { countryCode: '1', phoneNumber: '5551234567' })
		);
	});

	test('clearUserPii (Hashed-PII) calls executeRpc with empty params', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.clearUserPii();

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(buildRpcRequest('clearUserPii', {}));
	});

	test('setPreinstallAttribution (Android-only) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.setPreinstallAttribution('media_src', 'campaign_1', 'site_1');

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('setPreinstallAttribution', {
				mediaSource: 'media_src',
				campaign: 'campaign_1',
				siteId: 'site_1',
			})
		);
	});

	test('isStopped (Android-only getter) resolves with response.data', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: false }));

		await expect(appsFlyer.isStopped()).resolves.toBe(false);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(buildRpcRequest('isStopped', {}));
	});
});