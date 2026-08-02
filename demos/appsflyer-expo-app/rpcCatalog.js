// Test catalog for every public appsFlyer.* method in index.js, one entry per RPC-backed
// call. Mirrors RPCTestApp's MethodCatalog.swift (same groups, same sample params, same
// ordering rationale: setHost late so it doesn't redirect traffic before other calls run,
// clearUserPii last as PII teardown). PurchaseConnector is out of scope (bridge-patterns.md §7).
import appsFlyer, { AppsFlyerConsent, MEDIATION_NETWORK } from 'react-native-appsflyer';

export const DEV_KEY = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY ?? 'Us4xXxXxXxQed';
export const APP_ID = process.env.EXPO_PUBLIC_APPSFLYER_APP_ID ?? '7xXxXxXx1';

// Void/fire-and-forget setters (callRpcVoid under the hood) have nothing to await.
function fired() {
	return Promise.resolve('fired (fire-and-forget)');
}

// setHost permanently redirects the native SDK's traffic to a custom endpoint for the rest of
// the app process — there's no RPC to reset it. Running it more than once per install means
// every "Run Again" after the first would hit a now-nonexistent host and fail every
// network-dependent method for good. Guard so it only ever fires once per app launch.
let setHostHasRun = false;

export const RPC_CATALOG = [
	// isSessionReady is safe here (unlike in BOOTSTRAP) — by the time Run All is enabled,
	// registerSessionReadyListener has already fired its callback, so this is just a status read,
	// not a race against a still-in-flight registration.
	{ name: 'isSessionReady', group: 'Listener', platform: 'both', run: () => appsFlyer.isSessionReady() },
	// unregisterSessionReadyListener moved below start — see comment there: unregistering
	// here would reset the registration guard and force start to re-register (re-triggering
	// the buggy native call) instead of finding the session already marked as registered.

	// Config — simple setters
	{ name: 'setCustomerUserId', group: 'Config', platform: 'both', run: () => { appsFlyer.setCustomerUserId('test_user_123'); return fired(); } },
	{ name: 'setAdditionalData', group: 'Config', platform: 'both', run: () => { appsFlyer.setAdditionalData({ test_key: 'test_value' }); return fired(); } },
	{ name: 'setCurrencyCode', group: 'Config', platform: 'both', run: () => { appsFlyer.setCurrencyCode('USD'); return fired(); } },
	{ name: 'disableAdvertisingIdentifier', group: 'Config', platform: 'both', run: () => { appsFlyer.disableAdvertisingIdentifier(false); return fired(); } },
	{ name: 'disableSKAD', group: 'Config', platform: 'ios', run: () => { appsFlyer.disableSKAD(false); return fired(); } },
	{ name: 'setCurrentDeviceLanguage', group: 'Config', platform: 'ios', run: () => { appsFlyer.setCurrentDeviceLanguage('en'); return fired(); } },
	{ name: 'setAppInviteOneLinkID', group: 'Config', platform: 'both', run: () => { appsFlyer.setAppInviteOneLinkID('test_onelink_id'); return fired(); } },
	{ name: 'anonymizeUser', group: 'Config', platform: 'both', run: () => { appsFlyer.anonymizeUser(false); return fired(); } },
	{ name: 'disableCollectASA', group: 'Config', platform: 'ios', run: () => { appsFlyer.disableCollectASA(false); return fired(); } },
	{ name: 'setUseReceiptValidationSandbox', group: 'Config', platform: 'ios', run: () => { appsFlyer.setUseReceiptValidationSandbox(true); return fired(); } },
	{ name: 'disableIDFVCollection', group: 'Config', platform: 'ios', run: () => { appsFlyer.disableIDFVCollection(false); return fired(); } },
	{ name: 'setDisableNetworkData', group: 'Config', platform: 'android', run: () => { appsFlyer.setDisableNetworkData(false); return fired(); } },

	// Config — complex setters
	{ name: 'setResolveDeepLinkURLs', group: 'Config', platform: 'both', run: () => appsFlyer.setResolveDeepLinkURLs(['https://example.com']) },
	{ name: 'setOneLinkCustomDomains', group: 'Config', platform: 'both', run: () => appsFlyer.setOneLinkCustomDomains(['example.onelink.me']) },
	{ name: 'setMinTimeBetweenSessions', group: 'Config', platform: 'both', run: () => appsFlyer.setMinTimeBetweenSessions(5) },
	{ name: 'setDeepLinkTimeout', group: 'Config', platform: 'both', run: () => appsFlyer.setDeepLinkTimeout(3000) },
	{ name: 'setInstallId', group: 'Config', platform: 'both', run: () => appsFlyer.setInstallId('test-install-id-123') },
	{ name: 'setSharingFilterForPartners', group: 'Config', platform: 'both', run: () => { appsFlyer.setSharingFilterForPartners(['partner1']); return fired(); } },
	{ name: 'setPartnerData', group: 'Config', platform: 'both', run: () => { appsFlyer.setPartnerData('test_partner', { key: 'value' }); return fired(); } },

	// Consent
	{ name: 'setConsentData', group: 'Consent', platform: 'both', run: () => { appsFlyer.setConsentData(new AppsFlyerConsent(true, true, true, true)); return fired(); } },
	{ name: 'enableTCFDataCollection', group: 'Consent', platform: 'both', run: () => { appsFlyer.enableTCFDataCollection(true); return fired(); } },

	// Hashed PII — set before start so fields appear in session/in-app/VIAP/ARS payloads
	{ name: 'setUserEmail', group: 'HashedPII', platform: 'both', run: () => appsFlyer.setUserEmail('user@example.com') },
	{ name: 'setUserPhone', group: 'HashedPII', platform: 'both', run: () => appsFlyer.setUserPhone('1', '5551234567') },
	{ name: 'setUserFirstName', group: 'HashedPII', platform: 'both', run: () => appsFlyer.setUserFirstName('Alice') },
	{ name: 'setUserLastName', group: 'HashedPII', platform: 'both', run: () => appsFlyer.setUserLastName('Smith') },
	{ name: 'setUserFbLoginId', group: 'HashedPII', platform: 'both', run: () => appsFlyer.setUserFbLoginId(123456789) },

	// Observability
	{ name: 'getAppsFlyerUID', group: 'Observability', platform: 'both', run: () => appsFlyer.getAppsFlyerUID() },
	{ name: 'getSDKVersion', group: 'Observability', platform: 'both', run: () => appsFlyer.getSDKVersion() },

	// Deep Links
	{ name: 'appendParametersToDeepLinkingURL', group: 'DeepLink', platform: 'both', run: () => { appsFlyer.appendParametersToDeepLinkingURL('example.com', { key: 'value' }); return fired(); } },
	{ name: 'addPushNotificationDeepLinkPath', group: 'DeepLink', platform: 'both', run: () => appsFlyer.addPushNotificationDeepLinkPath(['data', 'deeplink']) },
	{ name: 'enableFacebookDeferredApplinks', group: 'DeepLink', platform: 'both', run: () => appsFlyer.enableFacebookDeferredApplinks(false) },
	{ name: 'setFacebookDeferredAppLink', group: 'DeepLink', platform: 'ios', run: () => appsFlyer.setFacebookDeferredAppLink({ url: 'https://example.com/deferred' }) },
	{ name: 'performOnDeepLinking', group: 'DeepLink', platform: 'android', run: () => { appsFlyer.performOnDeepLinking('https://example.com/open', false); return fired(); } },

	// Push
	{ name: 'sendPushNotificationData', group: 'Push', platform: 'both', run: () => { appsFlyer.sendPushNotificationData({ alert: 'test notification' }, { campaign: 'test_campaign', pid: 'test_pid', isRetargeting: false }); return fired(); } },
	{ name: 'updateServerUninstallToken', group: 'Push', platform: 'both', run: () => { appsFlyer.updateServerUninstallToken('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'); return fired(); } },

	// Location
	{ name: 'logLocation', group: 'Location', platform: 'both', run: () => { appsFlyer.logLocation(-122.4194, 37.7749); return fired(); } },

	// Purchases
	// Only dispatches the RPC — the `callback` param is currently inert (see index.js remarks
	// on validateAndLogInAppPurchase). A 401/500 here is an expected server response when the
	// app isn't registered for purchase validation, not a bridge failure.
	{ name: 'validateAndLogInAppPurchase', group: 'Purchase', platform: 'both', run: () => { appsFlyer.validateAndLogInAppPurchase({ productId: 'com.test.product', transactionId: 'TX456', purchaseType: 'subscription' }, {})(); return fired(); } },

	// Revenue
	{ name: 'logAdRevenue', group: 'Revenue', platform: 'both', run: () => { appsFlyer.logAdRevenue({ monetizationNetwork: 'test_network', mediationNetwork: MEDIATION_NETWORK.CUSTOM_MEDIATION, currencyIso4217Code: 'USD', revenue: 1.5 }); return fired(); } },

	// Cross Promotion
	{ name: 'logCrossPromotionImpression', group: 'CrossPromotion', platform: 'both', run: () => { appsFlyer.logCrossPromotionImpression('id123456', 'test_campaign'); return fired(); } },
	{ name: 'logCrossPromotionAndOpenStore', group: 'CrossPromotion', platform: 'both', run: () => { appsFlyer.logCrossPromotionAndOpenStore('id123456', 'test_campaign'); return fired(); } },

	// Share Invite
	{ name: 'generateInviteLink', group: 'ShareInvite', platform: 'both', run: () => appsFlyer.generateInviteLink({ channel: 'test_channel', campaign: 'test_campaign' }) },
	{ name: 'logInvite', group: 'ShareInvite', platform: 'both', run: () => { appsFlyer.logInvite('test_channel'); return fired(); } },

	// Android-only
	{ name: 'setCollectAndroidID', group: 'Android', platform: 'android', run: () => { appsFlyer.setCollectAndroidID(true); return fired(); } },
	{ name: 'getHostName', group: 'Android', platform: 'android', run: () => appsFlyer.getHostName() },
	{ name: 'getHostPrefix', group: 'Android', platform: 'android', run: () => appsFlyer.getHostPrefix() },
	{ name: 'getOutOfStore', group: 'Android', platform: 'android', run: () => appsFlyer.getOutOfStore() },
	{ name: 'getAttributionId', group: 'Android', platform: 'android', run: () => appsFlyer.getAttributionId() },
	{ name: 'isStopped', group: 'Android', platform: 'android', run: () => appsFlyer.isStopped() },
	{ name: 'isPreInstalledApp', group: 'Android', platform: 'android', run: () => appsFlyer.isPreInstalledApp() },
	{ name: 'setOutOfStore', group: 'Android', platform: 'android', run: () => appsFlyer.setOutOfStore('test_store') },
	{ name: 'setLogLevel', group: 'Android', platform: 'android', run: () => appsFlyer.setLogLevel('DEBUG') },
	{ name: 'setIsUpdate', group: 'Android', platform: 'android', run: () => appsFlyer.setIsUpdate(false) },
	{ name: 'setAppId', group: 'Android', platform: 'android', run: () => appsFlyer.setAppId('com.test.app') },
	{ name: 'setPreinstallAttribution', group: 'Android', platform: 'android', run: () => appsFlyer.setPreinstallAttribution('test_media_source', 'test_campaign', 'test_site') },
	{ name: 'logSession', group: 'Android', platform: 'android', run: () => appsFlyer.logSession() },
	{ name: 'onPause', group: 'Android', platform: 'android', run: () => appsFlyer.onPause() },
	{ name: 'disableAppSetId', group: 'Android', platform: 'android', run: () => { appsFlyer.disableAppSetId(); return fired(); } },

	// Lifecycle
	{ name: 'stop', group: 'Lifecycle', platform: 'both', run: () => { appsFlyer.stop(false); return fired(); } },

	// Safe to call directly: BOOTSTRAP's registerSessionReadyListener callback (App.js) already
	// fired before Run All was enabled, so the session is guaranteed ready by the time this runs —
	// no need to re-register or poll isSessionReady() here (see bridge-patterns.md §4 stall notes).
	{ name: 'start', group: 'Start', platform: 'both', run: () => appsFlyer.start() },
	{ name: 'unregisterSessionReadyListener', group: 'Listener', platform: 'both', run: () => { appsFlyer.unregisterSessionReadyListener(); return fired(); } },

	// Events
	{ name: 'logEvent', group: 'Event', platform: 'both', run: () => appsFlyer.logEvent('test_event', { key: 'value' }, true) },

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
			appsFlyer.setHost('events', 'appsflyer.com');
			return fired();
		},
	},

	// clearUserPii last — teardown after all payloads that need hashed PII have fired.
	{ name: 'clearUserPii', group: 'HashedPII', platform: 'both', run: () => appsFlyer.clearUserPii() },
];
