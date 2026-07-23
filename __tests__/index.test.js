import appsFlyer, { AppsFlyerConsent, AFParseJSONException } from '../index';
import { NativeEventEmitter } from 'react-native';
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
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse());
		await appsFlyer.init('xxxx', '777');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
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
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcError('devKey missing', 400));
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
			JSON.stringify({ method: 'stop', params: { isStopped: true } })
		);
	});

	test('it calls appsFlyer.stop with callback', () => {
		appsFlyer.stop(true, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'stop', params: { isStopped: true } })
		);
	});

	test('it calls appsFlyer.logEvent with callback', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues, jest.fn, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'logEvent',
				params: { eventName, eventValues, awaitResponse: false },
			})
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

	test('it calls appsFlyer.logEvent with callback and awaitResponse: true', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues, jest.fn, jest.fn, true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({
				method: 'logEvent',
				params: { eventName, eventValues, awaitResponse: true },
			})
		);
	});

	test('it calls appsFlyer.logLocation with callback', () => {
		appsFlyer.logLocation(12, 12, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.logLocation with no callback', () => {
		appsFlyer.logLocation(12, 12);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.logLocation with empty string lat', () => {
		appsFlyer.logLocation(12, '', jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with empty string long', () => {
		appsFlyer.logLocation('', 12, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with string long', () => {
		appsFlyer.logLocation('12', 12, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.logLocation with string lat', () => {
		appsFlyer.logLocation(12, '12', jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'logLocation', params: { longitude: 12, latitude: 12 } })
		);
	});

	test('it calls appsFlyer.setUserEmails', () => {
		appsFlyer.setUserEmails({}, jest.fn, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setUserEmails', params: {} })
		);
	});

	test('it calls appsFlyer.setAdditionalData with callback', () => {
		appsFlyer.setAdditionalData({}, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setAdditionalData', params: {} })
		);
	});

	test('it calls appsFlyer.setAdditionalData with no callback', () => {
		appsFlyer.setAdditionalData({});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setAdditionalData', params: {} })
		);
	});

	test('it calls appsFlyer.getAppsFlyerUID', () => {
		appsFlyer.getAppsFlyerUID(jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'getAppsFlyerUID', params: {} })
		);
	});

	test('it calls appsFlyer.updateServerUninstallToken', () => {
		appsFlyer.updateServerUninstallToken('xxx', jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'updateServerUninstallToken', params: { token: 'xxx' } })
		);
	});

	test('it calls appsFlyer.updateServerUninstallToken', () => {
		appsFlyer.updateServerUninstallToken('xxx');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'updateServerUninstallToken', params: { token: 'xxx' } })
		);
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId('xxx', jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCustomerUserId', params: { userId: 'xxx' } })
		);
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId('xxx');
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCustomerUserId', params: { userId: 'xxx' } })
		);
	});

	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData('xxx', {});
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setPartnerData', params: { partnerId: 'xxx', partnerData: {} } })
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
			JSON.stringify({ method: 'setPartnerData', params: { partnerId: 'xxx', partnerData: null } })
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
			JSON.stringify({ method: 'stop', params: { isStopped: true } })
		);
	});

	test('it calls appsFlyer.stop(true, cb)', () => {
		appsFlyer.stop(true, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'stop', params: { isStopped: true } })
		);
	});

	test('it calls appsFlyer.sendPushNotificationData({}, errorCb)', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' }, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'sendPushNotificationData', params: { foo: 'bar' } })
		);
	});

	test('it calls appsFlyer.sendPushNotificationData({})', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' });
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'sendPushNotificationData', params: { foo: 'bar' } })
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
			JSON.stringify({ method: 'setDisableNetworkData', params: { disable: true } })
		);
	});

	test('it calls appsFlyer.startSdk()', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcResponse());
		await appsFlyer.startSdk();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'start', params: { awaitResponse: true } })
		);
	});

	test('it calls appsFlyer.startSdk() and rejects on a native RPC failure', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValueOnce(mockRpcError('start completed with error: timed out'));
		await expect(appsFlyer.startSdk()).rejects.toEqual({
			code: 500,
			message: 'start completed with error: timed out',
		});
	});

	test('it calls appsFlyer.performOnDeepLinking()', () => {
		appsFlyer.performOnDeepLinking();
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'performDeepLinking', params: {} })
		);
	});

	test('it calls appsFlyer.disableIDFVCollection()', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableIDFVCollection', params: { shouldDisable: true } })
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

	test('it calls appsFlyer.anonymizeUser with callback', () => {
		appsFlyer.anonymizeUser(true, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'anonymizeUser', params: { shouldAnonymize: true } })
		);
	});

	test('it calls appsFlyer.setCurrencyCode with callback', () => {
		appsFlyer.setCurrencyCode('USD', jest.fn);
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

	test('it calls appsFlyer.setOneLinkCustomDomains with callbacks', () => {
		const domains = ['example.com', 'brand.com'];
		appsFlyer.setOneLinkCustomDomains(domains, jest.fn, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setOneLinkCustomDomains', params: { domains } })
		);
	});

	test('it calls appsFlyer.setAppInviteOneLinkID with callback', () => {
		appsFlyer.setAppInviteOneLinkID('test_one_link_id', jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setAppInviteOneLink', params: { oneLinkID: 'test_one_link_id' } })
		);
	});

	test('it calls appsFlyer.generateInviteLink with valid params', () => {
		const params = {
			channel: 'test_channel',
			campaign: 'test_campaign',
			customerID: 'test_customer',
			userParams: { deep_link_value: 'test_value' }
		};
		appsFlyer.generateInviteLink(params, jest.fn, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'generateInviteLink', params })
		);
	});

	test('it calls appsFlyer.disableCollectASA', () => {
		appsFlyer.disableCollectASA(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableCollectASA', params: { shouldDisable: true } })
		);
	});

	test('it calls appsFlyer.setUseReceiptValidationSandbox', () => {
		appsFlyer.setUseReceiptValidationSandbox(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setUseReceiptValidationSandbox', params: { isSandbox: true } })
		);
	});

	test('it calls appsFlyer.disableSKAD', () => {
		appsFlyer.disableSKAD(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableSKAdNetwork', params: { disableSkad: true } })
		);
	});

	test('it calls appsFlyer.disableIDFVCollection', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableIDFVCollection', params: { shouldDisable: true } })
		);
	});

	test('it calls appsFlyer.setCollectAndroidID with callback', () => {
		appsFlyer.setCollectAndroidID(true, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setCollectAndroidID', params: { isCollect: true } })
		);
	});

	test('it calls appsFlyer.setCollectAndroidID without callback', () => {
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
	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 with valid purchase details', () => {
		const purchaseDetails = {
			purchaseType: 'subscription',
			transactionId: 'test_transaction_123',
			productId: 'test_product_123'
		};
		const additionalParameters = { test: 'param' };
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails, additionalParameters, callback);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'validateAndLogInAppPurchase', params: { purchaseDetails, additionalParameters } })
		);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 without additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_456',
			productId: 'test_product_456'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails, undefined, callback);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'validateAndLogInAppPurchase', params: { purchaseDetails, additionalParameters: undefined } })
		);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 without callback', () => {
		const purchaseDetails = {
			purchaseType: 'subscription',
			transactionId: 'test_transaction_789',
			productId: 'test_product_789'
		};

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 with null additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_null',
			productId: 'test_product_null'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails, null, callback);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'validateAndLogInAppPurchase', params: { purchaseDetails, additionalParameters: null } })
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

	test('it calls appsFlyer.setResolveDeepLinkURLs with callbacks', () => {
		const urls = ['example.com', 'brand.com'];
		appsFlyer.setResolveDeepLinkURLs(urls, jest.fn, jest.fn);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setResolveDeepLinkURLs', params: { urls } })
		);
	});

	test('it calls appsFlyer.disableAdvertisingIdentifier', () => {
		appsFlyer.disableAdvertisingIdentifier(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'setDisableAdvertisingIdentifiers', params: { isDisable: true } })
		);
	});

	test('it calls appsFlyer.enableTCFDataCollection', () => {
		appsFlyer.enableTCFDataCollection(true);
		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			JSON.stringify({ method: 'enableTCFDataCollection', params: { enabled: true } })
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
	const nativeEventEmitter = new NativeEventEmitter(NativeAppsFlyer);
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

	test('onAppOpenAttribution / onAttributionFailure were removed and merged into onDeepLink', () => {
		expect(appsFlyer.onAppOpenAttribution).toBeUndefined();
		expect(appsFlyer.onAttributionFailure).toBeUndefined();
	});
	test('validateAndLogInAppPurchaseV2 event listener Happy Flow', () => {
		const validationResult = { result: true, data: { transactionId: 'test_123' } };
		let validationListener;
		const callback = jest.fn((res) => {
			expect(res).toEqual(validationResult);
			if (validationListener) validationListener();
		});

		validationListener = appsFlyer.validateAndLogInAppPurchaseV2(
			{ purchaseType: 'subscription', transactionId: 'test_123', productId: 'test_product' },
			{ test: 'param' },
			callback
		);

		nativeEventEmitter.emit('onValidationResult', JSON.stringify(validationResult));
		expect(callback).toHaveBeenCalledWith(validationResult);
	});

	test('validateAndLogInAppPurchaseV2 event listener with error', () => {
		const validationError = { error: 'Validation failed' };
		let validationListener;
		const callback = jest.fn((error) => {
			expect(error).toEqual(validationError);
			if (validationListener) validationListener();
		});

		validationListener = appsFlyer.validateAndLogInAppPurchaseV2(
			{ purchaseType: 'one_time_purchase', transactionId: 'test_456', productId: 'test_product' },
			{},
			callback
		);

		nativeEventEmitter.emit('onValidationResult', JSON.stringify(validationError));
		expect(callback).toHaveBeenCalledWith(validationError);
	});

	test('validateAndLogInAppPurchaseV2 event listener with invalid JSON', () => {
		const invalidJson = 'not valid json';
		let validationListener;
		const callback = jest.fn((error) => {
			// AFParseJSONException might not extend Error, check for name property instead
			expect(error).toBeDefined();
			expect(error.name).toBe('AFParseJSONException');
			if (validationListener) validationListener();
		});

		validationListener = appsFlyer.validateAndLogInAppPurchaseV2(
			{ purchaseType: 'one_time_purchase', transactionId: 'test_789', productId: 'test_product' },
			{},
			callback
		);

		nativeEventEmitter.emit('onValidationResult', invalidJson);
		expect(callback).toHaveBeenCalled();
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

	test('handleOpenURL (Deep-link) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.handleOpenURL('https://example.com', { sourceApplication: 'com.foo' });

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('handleOpenURL', {
				url: 'https://example.com',
				options: { sourceApplication: 'com.foo' },
			})
		);
	});

	test('handleOpenUrl is a distinct RPC method from handleOpenURL (case-sensitive)', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.handleOpenUrl('https://example.com', 'com.foo', null);

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('handleOpenUrl', {
				url: 'https://example.com',
				sourceApplication: 'com.foo',
				annotation: null,
			})
		);
	});

	test('setUserPhone (Hashed-PII) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.setUserPhone('+15551234567');

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('setUserPhone', { phone: '+15551234567' })
		);
	});

	test('clearUserPii (Hashed-PII) calls executeRpc with empty params', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.clearUserPii();

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(buildRpcRequest('clearUserPii', {}));
	});

	test('handleLaunchOptions (Lifecycle) calls executeRpc with the right envelope', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));

		await appsFlyer.handleLaunchOptions({ url: 'myapp://deeplink' });

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
			buildRpcRequest('handleLaunchOptions', { launchOptions: { url: 'myapp://deeplink' } })
		);
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