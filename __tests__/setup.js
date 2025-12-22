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
			logAdRevenue: jest.fn(),
			anonymizeUser: jest.fn(),
			setCurrencyCode: jest.fn(),
			setOneLinkCustomDomains: jest.fn(),
			setAppInviteOneLinkID: jest.fn(),
			generateInviteLink: jest.fn(),
			disableCollectASA: jest.fn(),
			setUseReceiptValidationSandbox: jest.fn(),
			disableSKAD: jest.fn(),
			setCollectIMEI: jest.fn(),
			setCollectAndroidID: jest.fn(),
			disableAppSetId: jest.fn(),
			validateAndLogInAppPurchaseV2: jest.fn(),
			setResolveDeepLinkURLs: jest.fn(),
			performOnAppAttribution: jest.fn(),
			disableAdvertisingIdentifier: jest.fn(),
			enableTCFDataCollection: jest.fn(),
			setConsentData: jest.fn(),
			validateAndLogInAppPurchase: jest.fn(),
		},
	};
});
jest.mock('../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock NativeAppsFlyerRPC TurboModule to prevent crashes in tests that import index.js
jest.mock('../src/NativeAppsFlyerRPC', () => ({
  __esModule: true,
  default: {
    executeJson: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Mock Platform to prevent PlatformConstants TurboModule access
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));
