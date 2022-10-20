import { isJsxText } from 'typescript';

jest.mock('../node_modules/react-native/Libraries/BatchedBridge/NativeModules', () => {
	return {
		RNAppsFlyer: {
			initSdkWithPromise: jest.fn(),
			initSdkWithCallBack: jest.fn(),
			stop: jest.fn(),
			logEvent: jest.fn(),
			logEventWithPromise: jest.fn(),
			logLocation: jest.fn(),
			setUserEmails: jest.fn(),
			setAdditionalData: jest.fn(),
			getAppsFlyerUID: jest.fn(),
			updateServerUninstallToken: jest.fn(),
			setCustomerUserId: jest.fn(),
			setPartnerData: jest.fn(),
			setSharingFilterForPartners: jest.fn(),
			setCurrentDeviceLanguage: jest.fn(),
			sendPushNotificationData: jest.fn(),
			appendParametersToDeepLinkingURL: jest.fn(),
			setDisableNetworkData: jest.fn(),
			performOnDeepLinking: jest.fn(),
			startSdk: jest.fn(),
			disableIDFVCollection: jest.fn(),
		},
	};
});
jest.mock('../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter');
