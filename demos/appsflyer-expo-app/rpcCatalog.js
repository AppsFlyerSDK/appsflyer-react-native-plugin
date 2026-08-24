import AppsFlyer, { MEDIATION_NETWORK } from 'react-native-appsflyer';

export const DEV_KEY = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY ?? 'Us4xXxXxXxQed';
export const APP_ID = process.env.EXPO_PUBLIC_APPSFLYER_APP_ID ?? '7xXxXxXx1';

let setHostHasRun = false;

export const RPC_CATALOG = [
	{ name: 'isSessionReady', group: 'Listener', platform: 'both', run: () => AppsFlyer.isSessionReady() },

	// Config — simple setters
	{ name: 'setCustomerUserId', group: 'Config', platform: 'both', run: () => AppsFlyer.setCustomerUserId({ customerId: 'test_user_123' }) },
	{ name: 'setAdditionalData', group: 'Config', platform: 'both', run: () => AppsFlyer.setAdditionalData({ customData: { test_key: 'test_value' } }) },
	{ name: 'setCurrencyCode', group: 'Config', platform: 'both', run: () => AppsFlyer.setCurrencyCode({ currencyCode: 'USD' }) },
	{ name: 'setDisableAdvertisingIdentifiers', group: 'Config', platform: 'both', run: () => AppsFlyer.setDisableAdvertisingIdentifiers({ disable: false }) },
	{ name: 'setDisableSKAdNetwork', group: 'Config', platform: 'ios', run: () => AppsFlyer.setDisableSKAdNetwork({ disable: false }) },
	{ name: 'setCurrentDeviceLanguage', group: 'Config', platform: 'ios', run: () => AppsFlyer.setCurrentDeviceLanguage({ language: 'en' }) },
	{ name: 'setAppInviteOneLink', group: 'Config', platform: 'both', run: () => AppsFlyer.setAppInviteOneLink({ oneLinkId: 'test_onelink_id' }) },
	{ name: 'anonymizeUser', group: 'Config', platform: 'both', run: () => AppsFlyer.anonymizeUser({ shouldAnonymize: false }) },
	{ name: 'setDisableCollectASA', group: 'Config', platform: 'ios', run: () => AppsFlyer.setDisableCollectASA({ disable: false }) },
	{ name: 'setDisableAppleAdsAttribution', group: 'Config', platform: 'ios', run: () => AppsFlyer.setDisableAppleAdsAttribution({ disable: false }) },
	{ name: 'setUseReceiptValidationSandbox', group: 'Config', platform: 'ios', run: () => AppsFlyer.setUseReceiptValidationSandbox({ sandbox: true }) },
	{ name: 'setUseUninstallSandbox', group: 'Config', platform: 'ios', run: () => AppsFlyer.setUseUninstallSandbox({ sandbox: true }) },
	{ name: 'setShouldCollectDeviceName', group: 'Config', platform: 'ios', run: () => AppsFlyer.setShouldCollectDeviceName({ collect: true }) },
	{ name: 'setDisableIDFVCollection', group: 'Config', platform: 'ios', run: () => AppsFlyer.setDisableIDFVCollection({ disable: false }) },
	{ name: 'setDisableNetworkData', group: 'Config', platform: 'android', run: () => AppsFlyer.setDisableNetworkData({ isDisable: false }) },

	// Config — complex setters
	{ name: 'setResolveDeepLinkURLs', group: 'Config', platform: 'both', run: () => AppsFlyer.setResolveDeepLinkURLs({ urls: ['https://example.com'] }) },
	{ name: 'setOneLinkCustomDomain', group: 'Config', platform: 'both', run: () => AppsFlyer.setOneLinkCustomDomain({ domains: ['example.onelink.me'] }) },
	{ name: 'setMinTimeBetweenSessions', group: 'Config', platform: 'both', run: () => AppsFlyer.setMinTimeBetweenSessions({ seconds: 5 }) },
	{ name: 'setDeepLinkTimeout', group: 'Config', platform: 'both', run: () => AppsFlyer.setDeepLinkTimeout({ timeout: 3000 }) },
	{ name: 'setInstallId', group: 'Config', platform: 'both', run: () => AppsFlyer.setInstallId({ installId: 'test-install-id-123' }) },
	{ name: 'setSharingFilterForPartners', group: 'Config', platform: 'both', run: () => AppsFlyer.setSharingFilterForPartners({ partners: ['partner1'] }) },
	{ name: 'setPartnerData', group: 'Config', platform: 'both', run: () => AppsFlyer.setPartnerData({ partnerId: 'test_partner', data: { key: 'value' } }) },

	// AppsFlyerConsent convenience class no longer exists post js-core-migration — build the plain SetConsentDataParams object directly (matches example/src/App.tsx).
	{ name: 'setConsentData', group: 'Consent', platform: 'both', run: () => AppsFlyer.setConsentData({ isUserSubjectToGDPR: true, hasConsentForDataUsage: true, hasConsentForAdsPersonalization: true, hasConsentForAdStorage: true }) },
	{ name: 'enableTCFDataCollection', group: 'Consent', platform: 'both', run: () => AppsFlyer.enableTCFDataCollection({ shouldCollect: true }) },

	// Hashed PII — set before start so fields appear in session/in-app/VIAP/ARS payloads
	{ name: 'setUserEmail', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.setUserEmail({ email: 'user@example.com' }) },
	{ name: 'setUserPhone', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.setUserPhone({ countryCode: '1', phoneNumber: '5551234567' }) },
	{ name: 'setUserFirstName', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.setUserFirstName({ firstName: 'Alice' }) },
	{ name: 'setUserLastName', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.setUserLastName({ lastName: 'Smith' }) },
	{ name: 'setUserFbLoginId', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.setUserFbLoginId({ fbLoginId: 123456789 }) },

	// Observability
	{ name: 'getAppsFlyerUID', group: 'Observability', platform: 'both', run: () => AppsFlyer.getAppsFlyerUID() },
	{ name: 'getSdkVersion', group: 'Observability', platform: 'both', run: () => AppsFlyer.getSdkVersion() },

	// Deep Links
	{ name: 'appendParametersToDeepLinkingURL', group: 'DeepLink', platform: 'both', run: () => AppsFlyer.appendParametersToDeepLinkingURL({ contains: 'example.com', parameters: { key: 'value' } }) },
	{ name: 'addPushNotificationDeepLinkPath', group: 'DeepLink', platform: 'both', run: () => AppsFlyer.addPushNotificationDeepLinkPath({ deepLinkPath: ['data', 'deeplink'] }) },
	{ name: 'enableFacebookDeferredApplinks', group: 'DeepLink', platform: 'both', run: () => AppsFlyer.enableFacebookDeferredApplinks({ isEnabled: false }) },
	{ name: 'setFacebookDeferredAppLink', group: 'DeepLink', platform: 'ios', run: () => AppsFlyer.setFacebookDeferredAppLink({ url: 'https://example.com/deferred' }) },
	{ name: 'performDeepLinking', group: 'DeepLink', platform: 'android', run: () => AppsFlyer.performDeepLinking({ url: 'https://example.com/open', shouldTriggerSession: false }) },

	// sendPushNotificationData is android-only, handlePushNotification is ios-only, per rpc-map.js — the .d.ts surface doesn't encode the split.
	{ name: 'sendPushNotificationData', group: 'Push', platform: 'android', run: () => AppsFlyer.sendPushNotificationData({ campaign: 'test_campaign', pid: 'test_pid', isRetargeting: false }) },
	{ name: 'handlePushNotification', group: 'Push', platform: 'ios', run: () => AppsFlyer.handlePushNotification({ pushPayload: { campaign: 'test_campaign' } }) },
	{ name: 'updateServerUninstallToken', group: 'Push', platform: 'both', run: () => AppsFlyer.updateServerUninstallToken({ token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' }) },

	// Location
	{ name: 'logLocation', group: 'Location', platform: 'both', run: () => AppsFlyer.logLocation({ latitude: 37.7749, longitude: -122.4194 }) },

	// params.purchase is a platform-specific oneOf (iOS: transactionId, Android: purchaseToken) — a shared 'both' entry 422s on the other platform.
	{ name: 'validateAndLogInAppPurchase', group: 'Purchase', platform: 'ios', run: () => AppsFlyer.validateAndLogInAppPurchase({ purchase: { productId: 'com.test.product', transactionId: 'TX456', purchaseType: 'subscription' } }) },
	{ name: 'validateAndLogInAppPurchase', group: 'Purchase', platform: 'android', run: () => AppsFlyer.validateAndLogInAppPurchase({ purchase: { productId: 'com.test.product', purchaseToken: 'test-purchase-token', purchaseType: 'subscription' } }) },

	// Revenue
	{ name: 'logAdRevenue', group: 'Revenue', platform: 'both', run: () => AppsFlyer.logAdRevenue({ monetizationNetwork: 'test_network', mediationNetwork: MEDIATION_NETWORK.CUSTOM_MEDIATION, currencyIso4217Code: 'USD', revenue: 1.5 }) },

	// Cross Promotion
	{ name: 'logCrossPromoteImpression', group: 'CrossPromotion', platform: 'both', run: () => AppsFlyer.logCrossPromoteImpression({ appId: 'id123456', campaign: 'test_campaign' }) },
	{ name: 'logAndOpenStore', group: 'CrossPromotion', platform: 'both', run: () => AppsFlyer.logAndOpenStore({ promotedAppId: 'id123456', campaign: 'test_campaign' }) },

	// Share Invite
	{ name: 'generateInviteLink', group: 'ShareInvite', platform: 'both', run: () => AppsFlyer.generateInviteLink({ parameters: { channel: 'test_channel', campaign: 'test_campaign' } }) },
	{ name: 'logInvite', group: 'ShareInvite', platform: 'both', run: () => AppsFlyer.logInvite({ channel: 'test_channel' }) },

	// Android-only
	{ name: 'setCollectAndroidID', group: 'Android', platform: 'android', run: () => AppsFlyer.setCollectAndroidID({ isCollect: true }) },
	{ name: 'getHostName', group: 'Android', platform: 'android', run: () => AppsFlyer.getHostName() },
	{ name: 'getHostPrefix', group: 'Android', platform: 'android', run: () => AppsFlyer.getHostPrefix() },
	{ name: 'getOutOfStore', group: 'Android', platform: 'android', run: () => AppsFlyer.getOutOfStore() },
	{ name: 'getAttributionId', group: 'Android', platform: 'android', run: () => AppsFlyer.getAttributionId() },
	{ name: 'isStopped', group: 'Android', platform: 'android', run: () => AppsFlyer.isStopped() },
	{ name: 'isPreInstalledApp', group: 'Android', platform: 'android', run: () => AppsFlyer.isPreInstalledApp() },
	{ name: 'setOutOfStore', group: 'Android', platform: 'android', run: () => AppsFlyer.setOutOfStore({ sourceName: 'test_store' }) },
	{ name: 'setLogLevel', group: 'Android', platform: 'android', run: () => AppsFlyer.setLogLevel({ logLevel: 'debug' }) },
	{ name: 'setIsUpdate', group: 'Android', platform: 'android', run: () => AppsFlyer.setIsUpdate({ isUpdate: false }) },
	{ name: 'setAppId', group: 'Android', platform: 'android', run: () => AppsFlyer.setAppId({ appId: 'com.test.app' }) },
	{ name: 'setPreinstallAttribution', group: 'Android', platform: 'android', run: () => AppsFlyer.setPreinstallAttribution({ mediaSource: 'test_media_source', campaign: 'test_campaign', siteId: 'test_site' }) },
	{ name: 'logSession', group: 'Android', platform: 'android', run: () => AppsFlyer.logSession() },
	{ name: 'disableAppSetId', group: 'Android', platform: 'android', run: () => AppsFlyer.disableAppSetId() },

	// Lifecycle
	{ name: 'stop', group: 'Lifecycle', platform: 'both', run: () => AppsFlyer.stop({ shouldStop: false }) },

	// start() already ran automatically from App.js's bootstrap by the time Run All is pressable — this entry is just RPC coverage, not the real startup path.
	{ name: 'start', group: 'Start', platform: 'both', run: () => AppsFlyer.start() },
	{ name: 'unregisterSessionReadyListener', group: 'Listener', platform: 'both', run: () => AppsFlyer.unregisterSessionReadyListener() },
	{ name: 'unregisterConversionListener', group: 'Listener', platform: 'android', run: () => AppsFlyer.unregisterConversionListener() },
	{ name: 'unregisterDeeplinkListener', group: 'Listener', platform: 'android', run: () => AppsFlyer.unregisterDeeplinkListener() },

	{ name: 'logEvent', group: 'Event', platform: 'both', run: () => AppsFlyer.logEvent({ eventName: 'test_event', eventValues: { key: 'value' }, awaitResponse: true }) },

	// Config — setHost last: redirects SDK traffic to a custom endpoint. Only fires once per
	// app launch (see setHostHasRun above) — every run after the first reports itself skipped.
	{
		name: 'setHost',
		group: 'Config',
		platform: 'both',
		run: () => {
			if (setHostHasRun) {
				return Promise.resolve('skipped — already ran this app session (setHost has no reset RPC)');
			}
			setHostHasRun = true;
			return AppsFlyer.setHost({ hostPrefixName: 'events', hostName: 'AppsFlyer.com' });
		},
	},

	// clearUserPii last — teardown after all payloads that need hashed PII have fired.
	{ name: 'clearUserPii', group: 'HashedPII', platform: 'both', run: () => AppsFlyer.clearUserPii() },
];
