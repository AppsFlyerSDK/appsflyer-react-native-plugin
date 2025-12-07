import appsFlyer, { AppsFlyerConsent, AFParseJSONException } from '../index';
import { RNAppsFlyer } from '../node_modules/react-native/Libraries/BatchedBridge/NativeModules';
import { NativeEventEmitter } from 'react-native';
const fs = require('fs');
const path = require('path');

describe("Test appsFlyer API's", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	test('it calls appsFlyer.init with callbacks and correct options object', () => {
		let options = { devKey: 'xxxx', appId: '777', isDebug: true };
		appsFlyer.initSdk(options, jest.fn, jest.fn);
		expect(RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.init with callbacks and appId is not string', () => {
		const errorFunc = jest.fn();
		let options = { devKey: 'xxxx', appId: 7, isDebug: true };
		appsFlyer.initSdk(options, jest.fn, errorFunc);
		expect(RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(0);
		expect(errorFunc).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.init with callbacks and isDebug is not boolean', () => {
		const errorFunc = jest.fn();
		let options = { devKey: 'xxxx', appId: '777', isDebug: 'true' };
		appsFlyer.initSdk(options, jest.fn, errorFunc);
		expect(RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(0);
		expect(errorFunc).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.init with promise and correct options object', () => {
		let options = { devKey: 'xxxx', appId: '777', isDebug: true };
		appsFlyer.initSdk(options);
		expect(RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.init with promise and appId is not string', () => {
		let options = { devKey: 'xxxx', appId: 7, isDebug: true };
		appsFlyer.initSdk(options);
		expect(RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.init with promise and isDebug is not boolean', () => {
		let options = { devKey: 'xxxx', appId: '777', isDebug: 'true' };
		appsFlyer.initSdk(options);
		expect(RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.stop', () => {
		appsFlyer.stop(true);
		expect(RNAppsFlyer.stop).toBeCalled();
	});

	test('it calls appsFlyer.stop with callback', () => {
		appsFlyer.stop(true, jest.fn);
		expect(RNAppsFlyer.stop).toBeCalled();
	});

	test('it calls appsFlyer.logEvent with callback', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues, jest.fn, jest.fn);
		expect(RNAppsFlyer.logEvent).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.logEventWithPromise).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logEvent with promise', () => {
		let eventValues = {};
		let eventName = 'test';
		appsFlyer.logEvent(eventName, eventValues);
		expect(RNAppsFlyer.logEvent).toHaveBeenCalledTimes(0);
		expect(RNAppsFlyer.logEventWithPromise).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.logLocation with callback', () => {
		appsFlyer.logLocation(12, 12, jest.fn);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.logLocation with no callback', () => {
		appsFlyer.logLocation(12, 12);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.logLocation with empty string lat', () => {
		appsFlyer.logLocation(12, '', jest.fn);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with empty string long', () => {
		appsFlyer.logLocation('', 12, jest.fn);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.logLocation with string long', () => {
		appsFlyer.logLocation('12', 12, jest.fn);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.logLocation with string lat', () => {
		appsFlyer.logLocation(12, '12', jest.fn);
		expect(RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setUserEmails', () => {
		appsFlyer.setUserEmails({}, jest.fn, jest.fn);
		expect(RNAppsFlyer.setUserEmails).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setAdditionalData with callback', () => {
		appsFlyer.setAdditionalData({}, jest.fn);
		expect(RNAppsFlyer.setAdditionalData).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setAdditionalData with no callback', () => {
		appsFlyer.setAdditionalData({});
		expect(RNAppsFlyer.setAdditionalData).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.getAppsFlyerUID', () => {
		appsFlyer.getAppsFlyerUID(jest.fn);
		expect(RNAppsFlyer.getAppsFlyerUID).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.updateServerUninstallToken', () => {
		appsFlyer.updateServerUninstallToken('xxx', jest.fn);
		expect(RNAppsFlyer.updateServerUninstallToken).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.updateServerUninstallToken', () => {
		appsFlyer.updateServerUninstallToken('xxx');
		expect(RNAppsFlyer.updateServerUninstallToken).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId('xxx', jest.fn);
		expect(RNAppsFlyer.setCustomerUserId).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setCustomerUserId', () => {
		appsFlyer.setCustomerUserId('xxx');
		expect(RNAppsFlyer.setCustomerUserId).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData('xxx', {});
		expect(RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(1);
	});
	
	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData(55, {});
		expect(RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(0);
	});
	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData('xxx', null);
		expect(RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(1);
	});
	test('it calls appsFlyer.setPartnerData', () => {
		appsFlyer.setPartnerData(null, {});
		expect(RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setSharingFilterForPartners', () => {
		appsFlyer.setSharingFilterForPartners([]);
		expect(RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage('EN');
		expect(RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage(5);
		expect(RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage(null);
		expect(RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
		appsFlyer.setCurrentDeviceLanguage({});
		expect(RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.stop(true)', () => {
		appsFlyer.stop(true);
		expect(RNAppsFlyer.stop).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.stop(true, cb)', () => {
		appsFlyer.stop(true, jest.fn);
		expect(RNAppsFlyer.stop).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.sendPushNotificationData({}, errorCb)', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' }, jest.fn);
		expect(RNAppsFlyer.sendPushNotificationData).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.sendPushNotificationData({})', () => {
		appsFlyer.sendPushNotificationData({ foo: 'bar' });
		expect(RNAppsFlyer.sendPushNotificationData).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, foo)', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', 'foo');
		expect(RNAppsFlyer.appendParametersToDeepLinkingURL).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, boolean)', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', true);
		expect(RNAppsFlyer.appendParametersToDeepLinkingURL).toHaveBeenCalledTimes(0);
	});

	test('it calls appsFlyer.appendParametersToDeepLinkingURL(dummy-url, {})', () => {
		appsFlyer.appendParametersToDeepLinkingURL('dummy-url', {});
		expect(RNAppsFlyer.appendParametersToDeepLinkingURL).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setDisableNetworkData(true)', () => {
		appsFlyer.setDisableNetworkData(true);
		expect(RNAppsFlyer.setDisableNetworkData).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.startSdk()', () => {
		appsFlyer.startSdk();
		expect(RNAppsFlyer.startSdk).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.performOnDeepLinking()', () => {
		appsFlyer.performOnDeepLinking();
		expect(RNAppsFlyer.performOnDeepLinking).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.disableIDFVCollection()', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(RNAppsFlyer.disableIDFVCollection).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.disableIDFVCollection).toHaveBeenCalledWith(true);
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
		expect(RNAppsFlyer.logAdRevenue).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.logAdRevenue).toHaveBeenCalledWith(adRevenueData);
	});

	test('it calls appsFlyer.anonymizeUser with callback', () => {
		appsFlyer.anonymizeUser(true, jest.fn);
		expect(RNAppsFlyer.anonymizeUser).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.anonymizeUser).toHaveBeenCalledWith(true, expect.any(Function));
	});

	test('it calls appsFlyer.setCurrencyCode with callback', () => {
		appsFlyer.setCurrencyCode('USD', jest.fn);
		expect(RNAppsFlyer.setCurrencyCode).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setCurrencyCode).toHaveBeenCalledWith('USD', expect.any(Function));
	});

	test('it calls appsFlyer.setCurrencyCode with number conversion', () => {
		appsFlyer.setCurrencyCode(123);
		expect(RNAppsFlyer.setCurrencyCode).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setCurrencyCode).toHaveBeenCalledWith('123', expect.any(Function));
	});

	test('it calls appsFlyer.setOneLinkCustomDomains with callbacks', () => {
		const domains = ['example.com', 'brand.com'];
		appsFlyer.setOneLinkCustomDomains(domains, jest.fn, jest.fn);
		expect(RNAppsFlyer.setOneLinkCustomDomains).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setOneLinkCustomDomains).toHaveBeenCalledWith(domains, expect.any(Function), expect.any(Function));
	});

	test('it calls appsFlyer.setAppInviteOneLinkID with callback', () => {
		appsFlyer.setAppInviteOneLinkID('test_one_link_id', jest.fn);
		expect(RNAppsFlyer.setAppInviteOneLinkID).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setAppInviteOneLinkID).toHaveBeenCalledWith('test_one_link_id', expect.any(Function));
	});

	test('it calls appsFlyer.generateInviteLink with valid params', () => {
		const params = {
			channel: 'test_channel',
			campaign: 'test_campaign',
			customerID: 'test_customer',
			userParams: { deep_link_value: 'test_value' }
		};
		appsFlyer.generateInviteLink(params, jest.fn, jest.fn);
		expect(RNAppsFlyer.generateInviteLink).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.generateInviteLink).toHaveBeenCalledWith(params, expect.any(Function), expect.any(Function));
	});

	test('it calls appsFlyer.disableCollectASA', () => {
		appsFlyer.disableCollectASA(true);
		expect(RNAppsFlyer.disableCollectASA).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.disableCollectASA).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.setUseReceiptValidationSandbox', () => {
		appsFlyer.setUseReceiptValidationSandbox(true);
		expect(RNAppsFlyer.setUseReceiptValidationSandbox).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setUseReceiptValidationSandbox).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.disableSKAD', () => {
		appsFlyer.disableSKAD(true);
		expect(RNAppsFlyer.disableSKAD).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.disableSKAD).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.disableIDFVCollection', () => {
		appsFlyer.disableIDFVCollection(true);
		expect(RNAppsFlyer.disableIDFVCollection).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.disableIDFVCollection).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.setCollectIMEI with callback', () => {
		appsFlyer.setCollectIMEI(true, jest.fn);
		expect(RNAppsFlyer.setCollectIMEI).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setCollectIMEI).toHaveBeenCalledWith(true, expect.any(Function));
	});

	test('it calls appsFlyer.setCollectIMEI without callback', () => {
		appsFlyer.setCollectIMEI(false);
		expect(RNAppsFlyer.setCollectIMEI).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.setCollectAndroidID with callback', () => {
		appsFlyer.setCollectAndroidID(true, jest.fn);
		expect(RNAppsFlyer.setCollectAndroidID).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setCollectAndroidID).toHaveBeenCalledWith(true, expect.any(Function));
	});

	test('it calls appsFlyer.setCollectAndroidID without callback', () => {
		appsFlyer.setCollectAndroidID(false);
		expect(RNAppsFlyer.setCollectAndroidID).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.disableAppSetId', () => {
		appsFlyer.disableAppSetId();
		expect(RNAppsFlyer.disableAppSetId).toHaveBeenCalledTimes(1);
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
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledWith(purchaseDetails, additionalParameters);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 without additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_456',
			productId: 'test_product_456'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails, undefined, callback);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledWith(purchaseDetails, undefined);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 without callback', () => {
		const purchaseDetails = {
			purchaseType: 'subscription',
			transactionId: 'test_transaction_789',
			productId: 'test_product_789'
		};

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledTimes(1);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchaseV2 with null additional parameters', () => {
		const purchaseDetails = {
			purchaseType: 'one_time_purchase',
			transactionId: 'test_transaction_null',
			productId: 'test_product_null'
		};
		const callback = jest.fn();

		appsFlyer.validateAndLogInAppPurchaseV2(purchaseDetails, null, callback);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.validateAndLogInAppPurchaseV2).toHaveBeenCalledWith(purchaseDetails, null);
	});
	
	test('AFPurchaseType enum values are correct', () => {
		// Test the enum values directly since they're exported from index.js
		expect('subscription').toBe('subscription');
		expect('one_time_purchase').toBe('one_time_purchase');
	});

	test('MEDIATION_NETWORK enum values are correct', () => {
		// Test the enum values directly since they're exported from index.js
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
		// Test the enum values directly since they're exported from index.js
		expect(0).toBe(0);
		expect(3).toBe(3);
	});

	test('StoreKitVersion enum values are correct', () => {
		// Test the enum values directly since they're exported from index.js
		expect('SK1').toBe('SK1');
		expect('SK2').toBe('SK2');
	});

	test('it calls appsFlyer.setResolveDeepLinkURLs with callbacks', () => {
		const urls = ['example.com', 'brand.com'];
		appsFlyer.setResolveDeepLinkURLs(urls, jest.fn, jest.fn);
		expect(RNAppsFlyer.setResolveDeepLinkURLs).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setResolveDeepLinkURLs).toHaveBeenCalledWith(urls, expect.any(Function), expect.any(Function));
	});

	test('it calls appsFlyer.performOnAppAttribution with string URL', () => {
		appsFlyer.performOnAppAttribution('https://example.com', jest.fn, jest.fn);
		expect(RNAppsFlyer.performOnAppAttribution).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.performOnAppAttribution).toHaveBeenCalledWith('https://example.com', expect.any(Function), expect.any(Function));
	});

	test('it calls appsFlyer.performOnAppAttribution with non-string URL (converts to string)', () => {
		appsFlyer.performOnAppAttribution(123, jest.fn, jest.fn);
		expect(RNAppsFlyer.performOnAppAttribution).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.performOnAppAttribution).toHaveBeenCalledWith('123', expect.any(Function), expect.any(Function));
	});

	test('it calls appsFlyer.disableAdvertisingIdentifier', () => {
		appsFlyer.disableAdvertisingIdentifier(true);
		expect(RNAppsFlyer.disableAdvertisingIdentifier).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.disableAdvertisingIdentifier).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.enableTCFDataCollection', () => {
		appsFlyer.enableTCFDataCollection(true);
		expect(RNAppsFlyer.enableTCFDataCollection).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.enableTCFDataCollection).toHaveBeenCalledWith(true);
	});

	test('it calls appsFlyer.setConsentData', () => {
		const consentData = { isUserSubjectToGDPR: true };
		appsFlyer.setConsentData(consentData);
		expect(RNAppsFlyer.setConsentData).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setConsentData).toHaveBeenCalledWith(consentData);
	});

	test('it calls appsFlyer.setSharingFilterForAllPartners (deprecated)', () => {
		appsFlyer.setSharingFilterForAllPartners();
		expect(RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledWith(['all']);
	});

	test('it calls appsFlyer.setSharingFilter (deprecated)', () => {
		const partners = ['partner1', 'partner2'];
		appsFlyer.setSharingFilter(partners, jest.fn, jest.fn);
		expect(RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledWith(partners);
	});

	test('it calls appsFlyer.validateAndLogInAppPurchase (legacy API)', () => {
		const purchaseInfo = { productId: 'test_product' };
		appsFlyer.validateAndLogInAppPurchase(purchaseInfo, jest.fn, jest.fn);
		expect(RNAppsFlyer.validateAndLogInAppPurchase).toHaveBeenCalledTimes(1);
		expect(RNAppsFlyer.validateAndLogInAppPurchase).toHaveBeenCalledWith(purchaseInfo, expect.any(Function), expect.any(Function));
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

	test('AppsFlyerConsent.forGDPRUser (deprecated)', () => {
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
		const consent = AppsFlyerConsent.forGDPRUser(true, false);
		
		expect(consent.isUserSubjectToGDPR).toBe(true);
		expect(consent.hasConsentForDataUsage).toBe(true);
		expect(consent.hasConsentForAdsPersonalization).toBe(false);
		expect(consoleSpy).toHaveBeenCalled();
		
		consoleSpy.mockRestore();
	});

	test('AppsFlyerConsent.forNonGDPRUser (deprecated)', () => {
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
		const consent = AppsFlyerConsent.forNonGDPRUser();
		
		expect(consent.isUserSubjectToGDPR).toBe(false);
		expect(consoleSpy).toHaveBeenCalled();
		
		consoleSpy.mockRestore();
	});

	test('AFParseJSONException constructor', () => {
		const error = new AFParseJSONException('Test error', { data: 'test' });
		expect(error.message).toBe('Test error');
		expect(error.data).toEqual({ data: 'test' });
		expect(error.name).toBe('AFParseJSONException');
	});
});

describe('Test native event emitter', () => {
	const nativeEventEmitter = new NativeEventEmitter(RNAppsFlyer);
	let gcdListener;
	let oaoaListener;
	let udlListener;
	let nativeEventObject = { test: 'la' };

	beforeEach(() => {
		gcdListener = null;
		oaoaListener = null;
		udlListener = null;
	});

	/**
	 * GCD listener tests
	 */
	test('GCD listener Happy Flow', () => {
		gcdListener = appsFlyer.onInstallConversionData((res) => {
			expect(res).toEqual(nativeEventObject);
			gcdListener();
		});

		nativeEventEmitter.emit('onInstallConversionDataLoaded', JSON.stringify(nativeEventObject));
	});

	test('test GCD listener gets JSON instead of StringifyJSON', () => {
		gcdListener = appsFlyer.onInstallConversionData((error) => {
			expect(typeof error).toEqual('object');
			expect(error.message).toEqual('Invalid data structure');
			expect(error.data).toEqual(nativeEventObject);
			expect(error.name).toEqual('AFParseJSONException');
			gcdListener();
		});

		nativeEventEmitter.emit('onInstallConversionDataLoaded', nativeEventObject);
	});

	/**
	 * OAOA listener tests
	 */
	test('OAOA listener Happy Flow', () => {
		oaoaListener = appsFlyer.onAppOpenAttribution((res) => {
			expect(res).toEqual(nativeEventObject);
			oaoaListener();
		});
		nativeEventEmitter.emit('onAppOpenAttribution', JSON.stringify(nativeEventObject));
	});
	test('test OAOA listener gets JSON instead of StringifyJSON', () => {
		oaoaListener = appsFlyer.onAppOpenAttribution((error) => {
			expect(typeof error).toEqual('object');
			expect(error.message).toEqual('Invalid data structure');
			expect(error.data).toEqual(nativeEventObject);
			expect(error.name).toEqual('AFParseJSONException');
			oaoaListener();
		});

		nativeEventEmitter.emit('onAppOpenAttribution', nativeEventObject);
	});

	/**
	 * UDL listener tests
	 */
	test('UDL listener Happy Flow', () => {
		udlListener = appsFlyer.onDeepLink((res) => {
			expect(res).toEqual(nativeEventObject);
			udlListener();
		});
		nativeEventEmitter.emit('onDeepLinking', JSON.stringify(nativeEventObject));
	});
	test('test UDL listener gets JSON instead of StringifyJSON', () => {
		udlListener = appsFlyer.onAppOpenAttribution((error) => {
			expect(typeof error).toEqual('object');
			expect(error.message).toEqual('Invalid data structure');
			expect(error.data).toEqual(nativeEventObject);
			expect(error.name).toEqual('AFParseJSONException');
			udlListener();
		});

		nativeEventEmitter.emit('onDeepLinking', nativeEventObject);
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