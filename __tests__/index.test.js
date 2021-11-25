import appsFlyer from '../index';
import { NativeModules } from 'react-native';
import { RNAppsFlyer } from '../node_modules/react-native/Libraries/BatchedBridge/NativeModules';

afterEach(() => {
	jest.clearAllMocks();
});

test('it calls appsFlyer.init with callbacks and correct options object', () => {
	let options = { devKey: 'xxxx', appId: '777', isDebug: true };
	appsFlyer.initSdk(options, jest.fn, jest.fn);
	expect(NativeModules.RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.init with callbacks and appId is not string', () => {
	const errorFunc = jest.fn();
	let options = { devKey: 'xxxx', appId: 7, isDebug: true };
	appsFlyer.initSdk(options, jest.fn, errorFunc);
	expect(NativeModules.RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(0);
	expect(errorFunc).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.init with callbacks and isDebug is not boolean', () => {
	const errorFunc = jest.fn();
	let options = { devKey: 'xxxx', appId: '777', isDebug: 'true' };
	appsFlyer.initSdk(options, jest.fn, errorFunc);
	expect(NativeModules.RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalledTimes(0);
	expect(errorFunc).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.init with promise and correct options object', () => {
	let options = { devKey: 'xxxx', appId: '777', isDebug: true };
	appsFlyer.initSdk(options);
	expect(NativeModules.RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.init with promise and appId is not string', () => {
	let options = { devKey: 'xxxx', appId: 7, isDebug: true };
	appsFlyer.initSdk(options);
	expect(NativeModules.RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.init with promise and isDebug is not boolean', () => {
	let options = { devKey: 'xxxx', appId: '777', isDebug: 'true' };
	appsFlyer.initSdk(options);
	expect(NativeModules.RNAppsFlyer.initSdkWithPromise).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.stop', () => {
	appsFlyer.stop(true);
	expect(NativeModules.RNAppsFlyer.stop).toBeCalled();
});

test('it calls appsFlyer.stop with callback', () => {
	appsFlyer.stop(true, jest.fn);
	expect(NativeModules.RNAppsFlyer.stop).toBeCalled();
});

test('it calls appsFlyer.logEvent with callback', () => {
	let eventValues = {};
	let eventName = 'test';
	appsFlyer.logEvent(eventName, eventValues, jest.fn, jest.fn);
	expect(NativeModules.RNAppsFlyer.logEvent).toHaveBeenCalledTimes(1);
	expect(NativeModules.RNAppsFlyer.logEventWithPromise).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.logEvent with promise', () => {
	let eventValues = {};
	let eventName = 'test';
	appsFlyer.logEvent(eventName, eventValues);
	expect(NativeModules.RNAppsFlyer.logEvent).toHaveBeenCalledTimes(0);
	expect(NativeModules.RNAppsFlyer.logEventWithPromise).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.logLocation with callback', () => {
	appsFlyer.logLocation(12, 12, jest.fn);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.logLocation with no callback', () => {
	appsFlyer.logLocation(12, 12);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.logLocation with empty string lat', () => {
	appsFlyer.logLocation(12, '', jest.fn);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.logLocation with empty string long', () => {
	appsFlyer.logLocation('', 12, jest.fn);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.logLocation with string long', () => {
	appsFlyer.logLocation('12', 12, jest.fn);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.logLocation with string lat', () => {
	appsFlyer.logLocation(12, '12', jest.fn);
	expect(NativeModules.RNAppsFlyer.logLocation).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setUserEmails', () => {
	appsFlyer.setUserEmails({}, jest.fn, jest.fn);
	expect(NativeModules.RNAppsFlyer.setUserEmails).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setAdditionalData with callback', () => {
	appsFlyer.setAdditionalData({}, jest.fn);
	expect(NativeModules.RNAppsFlyer.setAdditionalData).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setAdditionalData with no callback', () => {
	appsFlyer.setAdditionalData({});
	expect(NativeModules.RNAppsFlyer.setAdditionalData).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.getAppsFlyerUID', () => {
	appsFlyer.getAppsFlyerUID(jest.fn);
	expect(NativeModules.RNAppsFlyer.getAppsFlyerUID).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.updateServerUninstallToken', () => {
	appsFlyer.updateServerUninstallToken('xxx', jest.fn);
	expect(NativeModules.RNAppsFlyer.updateServerUninstallToken).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.updateServerUninstallToken', () => {
	appsFlyer.updateServerUninstallToken('xxx');
	expect(NativeModules.RNAppsFlyer.updateServerUninstallToken).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setCustomerUserId', () => {
	appsFlyer.setCustomerUserId('xxx', jest.fn);
	expect(NativeModules.RNAppsFlyer.setCustomerUserId).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setCustomerUserId', () => {
	appsFlyer.setCustomerUserId('xxx');
	expect(NativeModules.RNAppsFlyer.setCustomerUserId).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setPartnerData', () => {
	appsFlyer.setPartnerData('xxx', {});
	expect(NativeModules.RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setPartnerData', () => {
	appsFlyer.setPartnerData(55, {});
	expect(NativeModules.RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(0);
});
test('it calls appsFlyer.setPartnerData', () => {
	appsFlyer.setPartnerData('xxx', null);
	expect(NativeModules.RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(1);
});
test('it calls appsFlyer.setPartnerData', () => {
	appsFlyer.setPartnerData(null, {});
	expect(NativeModules.RNAppsFlyer.setPartnerData).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.setSharingFilterForPartners', () => {
	appsFlyer.setSharingFilterForPartners([]);
	expect(NativeModules.RNAppsFlyer.setSharingFilterForPartners).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
	appsFlyer.setCurrentDeviceLanguage('EN');
	expect(NativeModules.RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(1);
});

test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
	appsFlyer.setCurrentDeviceLanguage(5);
	expect(NativeModules.RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
	appsFlyer.setCurrentDeviceLanguage(null);
	expect(NativeModules.RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
});

test('it calls appsFlyer.setCurrentDeviceLanguage', () => {
	appsFlyer.setCurrentDeviceLanguage({});
	expect(NativeModules.RNAppsFlyer.setCurrentDeviceLanguage).toHaveBeenCalledTimes(0);
});
