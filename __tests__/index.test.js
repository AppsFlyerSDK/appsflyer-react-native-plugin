import appsFlyer from '../index';
import { RNAppsFlyer } from '../node_modules/react-native/Libraries/BatchedBridge/NativeModules';
import { NativeEventEmitter } from 'react-native';

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
});
