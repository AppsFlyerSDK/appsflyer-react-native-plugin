// Asserts every dispatched RPC request against the params native actually reads (fixtures generated from native source by scripts/generate-*-rpc-contract.js, committed so CI needs no native checkout) — catches both a missing required param and an extra param native silently drops. `method` on each captured request is already the resolved wire name (js-core-plugin's rpc-resolver.ts), so it's looked up directly in the fixture; each platform under test gets its own fresh module instance since RNTransport.platform is fixed at construction.

const iosContract = require('./fixtures/ios-rpc-contract.json');
const androidContract = require('./fixtures/android-rpc-contract.json');

const IOS = 'ios';
const ANDROID = 'android';
const BOTH = [IOS, ANDROID];

function freshAppsFlyerForPlatform(platform) {
	jest.resetModules();
	const { Platform: FreshPlatform } = require('react-native');
	FreshPlatform.OS = platform;
	return {
		AppsFlyer: require('../index').default,
		NativeAppsFlyer: require('../src/NativeAppsFlyer').default,
	};
}

// `platforms` reflects intent (this repo's @platform JSDoc markers, cross-checked against rpc-map.js) — a method missing where it claims support is a defect this test should surface.
const CALL_SITES = [
	{ api: 'init', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.init({ devKey: 'devkey', appId: '123456789' }) },
	{ api: 'enableDebug', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.enableDebug({ enabled: true }) },
	{ api: 'start', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.start() },
	{ api: 'logEvent', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.logEvent({ eventName: 'af_purchase', eventValues: { af_revenue: 1 } }) },
	{
		api: 'logAdRevenue',
		platforms: BOTH,
		invoke: (AppsFlyer) =>
			AppsFlyer.logAdRevenue({
				monetizationNetwork: 'admob',
				currencyIso4217Code: 'USD',
				revenue: 1.5,
				mediationNetwork: 'google_admob',
			}),
	},
	{ api: 'logLocation', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.logLocation({ longitude: 1.5, latitude: 2.5 }) },
	{ api: 'setUserEmail', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setUserEmail({ email: 'a@b.com' }) },
	{ api: 'setAdditionalData', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setAdditionalData({ customData: { tenant: 'qa' } }) },
	{ api: 'getAppsFlyerUID', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.getAppsFlyerUID() },
	{ api: 'getSdkVersion', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.getSdkVersion() },
	{
		api: 'updateServerUninstallToken',
		platforms: BOTH,
		// iOS reads deviceToken (via registerUninstall); Android reads token — the resolver picks the right key per platform now.
		invoke: (AppsFlyer) => AppsFlyer.updateServerUninstallToken({ token: 'token-abc' }),
	},
	{ api: 'setCustomerUserId', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setCustomerUserId({ customerId: 'uid-1' }) },
	{ api: 'stop', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.stop({ shouldStop: true }) },
	{ api: 'setAppInviteOneLink', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setAppInviteOneLink({ oneLinkId: 'abc1' }) },
	{
		api: 'generateInviteLink',
		platforms: BOTH,
		invoke: (AppsFlyer) =>
			AppsFlyer.generateInviteLink({
				parameters: { channel: 'sms', campaign: 'c1', referrerCustomerId: 'cust-1', baseDeepLink: 'https://example.com' },
			}),
	},
	{ api: 'logInvite', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.logInvite({ channel: 'sms', eventParameters: { k: 'v' } }) },
	{
		api: 'logCrossPromoteImpression',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.logCrossPromoteImpression({ appId: '123', campaign: 'c1', userParams: { k: 'v' } }),
	},
	{
		api: 'logAndOpenStore',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.logAndOpenStore({ promotedAppId: '123', campaign: 'c1', userParams: { k: 'v' } }),
	},
	{ api: 'setCurrencyCode', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setCurrencyCode({ currencyCode: 'USD' }) },
	{ api: 'isSessionReady', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.isSessionReady() },
	{
		api: 'unregisterSessionReadyListener',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.unregisterSessionReadyListener(),
	},
	{
		api: 'validateAndLogInAppPurchase',
		platforms: BOTH,
		// Android reads flat purchaseToken/productId/purchaseType; iOS reads transactionId instead of purchaseToken — genuinely different shapes per platform.
		invoke: (AppsFlyer, platform) =>
			AppsFlyer.validateAndLogInAppPurchase({
				purchase:
					platform === ANDROID
						? { purchaseType: 'oneTimePurchase', productId: 'sku', purchaseToken: 'txn' }
						: { purchaseType: 'oneTimePurchase', productId: 'sku', transactionId: 'txn' },
				additionalParameters: { extra: '1' },
			}),
	},
	{ api: 'anonymizeUser', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.anonymizeUser({ shouldAnonymize: true }) },
	{ api: 'setOneLinkCustomDomain', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setOneLinkCustomDomain({ domains: ['d.com'] }) },
	{ api: 'setResolveDeepLinkURLs', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setResolveDeepLinkURLs({ urls: ['u.com'] }) },
	{
		api: 'setDisableAdvertisingIdentifiers',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.setDisableAdvertisingIdentifiers({ disable: true }),
	},
	{ api: 'setHost', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setHost({ hostPrefixName: 'pre', hostName: 'host.com' }) },
	{
		api: 'addPushNotificationDeepLinkPath',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.addPushNotificationDeepLinkPath({ deepLinkPath: ['af', 'link'] }),
	},
	{
		api: 'setSharingFilterForPartners',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.setSharingFilterForPartners({ partners: ['p1'] }),
	},
	{ api: 'setPartnerData', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setPartnerData({ partnerId: 'p1', data: { k: 'v' } }) },
	{
		api: 'appendParametersToDeepLinkingURL',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.appendParametersToDeepLinkingURL({ contains: 'example.com', parameters: { k: 'v' } }),
	},
	{ api: 'enableTCFDataCollection', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.enableTCFDataCollection({ shouldCollect: true }) },
	{
		api: 'setConsentData',
		platforms: BOTH,
		invoke: (AppsFlyer) =>
			AppsFlyer.setConsentData({
				isUserSubjectToGDPR: true,
				hasConsentForDataUsage: true,
				hasConsentForAdsPersonalization: true,
				hasConsentForAdStorage: true,
			}),
	},
	{ api: 'setMinTimeBetweenSessions', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setMinTimeBetweenSessions({ seconds: 5 }) },
	{ api: 'setInstallId', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setInstallId({ installId: 'install-1' }) },
	{ api: 'setDeepLinkTimeout', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setDeepLinkTimeout({ timeout: 3000 }) },
	{
		api: 'enableFacebookDeferredApplinks',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.enableFacebookDeferredApplinks({ isEnabled: true }),
	},
	{ api: 'setUserPhone', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setUserPhone({ countryCode: '1', phoneNumber: '5551234567' }) },
	{ api: 'setUserFirstName', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setUserFirstName({ firstName: 'Ada' }) },
	{ api: 'setUserLastName', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setUserLastName({ lastName: 'Lovelace' }) },
	{ api: 'setUserFbLoginId', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.setUserFbLoginId({ fbLoginId: '12345' }) },
	{ api: 'clearUserPii', platforms: BOTH, invoke: (AppsFlyer) => AppsFlyer.clearUserPii() },
	{
		api: 'sendPushNotificationData',
		// Android-only — iOS's equivalent is the separate handlePushNotification call site below (rpc-map.js: sendPushNotificationData.ios is null).
		platforms: [ANDROID],
		invoke: (AppsFlyer) => AppsFlyer.sendPushNotificationData({ campaign: 'c1', pid: 'firebase', isRetargeting: true }),
	},
	{
		api: 'handlePushNotification',
		// iOS-only (rpc-map.js: handlePushNotification.android is null).
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.handlePushNotification({ pushPayload: { af: { c: 'x' } } }),
	},
	{
		api: 'registerConversionListener',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() }),
	},
	{
		api: 'unregisterConversionListener',
		// iOS has no unregisterConversionListener RPC at all (rpc-map.js: ios is null; confirmed against native source registering no such method).
		platforms: [ANDROID],
		invoke: (AppsFlyer) => AppsFlyer.unregisterConversionListener(),
	},
	{
		api: 'registerDeepLinkListener',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() }),
	},
	{
		api: 'registerSessionReadyListener',
		platforms: BOTH,
		invoke: (AppsFlyer) => AppsFlyer.registerSessionReadyListener(jest.fn()),
	},

	// iOS-only surface
	{ api: 'setDisableIDFVCollection', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.setDisableIDFVCollection({ disable: true }) },
	{ api: 'setDisableCollectASA', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.setDisableCollectASA({ disable: true }) },
	{
		api: 'setDisableAppleAdsAttribution',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.setDisableAppleAdsAttribution({ disable: true }),
	},
	{
		api: 'setUseReceiptValidationSandbox',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.setUseReceiptValidationSandbox({ sandbox: true }),
	},
	{
		api: 'setUseUninstallSandbox',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.setUseUninstallSandbox({ sandbox: true }),
	},
	{ api: 'setDisableSKAdNetwork', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.setDisableSKAdNetwork({ disable: true }) },
	{ api: 'setCurrentDeviceLanguage', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.setCurrentDeviceLanguage({ language: 'en' }) },
	{
		api: 'setShouldCollectDeviceName',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.setShouldCollectDeviceName({ collect: true }),
	},
	{
		api: 'setFacebookDeferredAppLink',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.setFacebookDeferredAppLink({ url: 'https://a.com' }),
	},
	{
		api: 'continueUserActivity',
		platforms: [IOS],
		invoke: (AppsFlyer) => AppsFlyer.continueUserActivity({ url: 'https://a.com' }),
	},
	{ api: 'handleOpenURL', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.handleOpenURL({ url: 'app://x' }) },
	{ api: 'handleOpenUrl', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.handleOpenUrl({ url: 'app://x' }) },
	// Schema marks `launchOptions` optional, but iOS's native parser requires it — a genuine schema/native mismatch this test exists to catch (not fixed here).
	{ api: 'handleLaunchOptions', platforms: [IOS], invoke: (AppsFlyer) => AppsFlyer.handleLaunchOptions({ launchOptions: {} }) },

	// Android-only surface
	{ api: 'setCollectAndroidID', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setCollectAndroidID({ isCollect: true }) },
	{ api: 'setDisableNetworkData', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setDisableNetworkData({ isDisable: true }) },
	{
		api: 'unregisterDeeplinkListener',
		platforms: [ANDROID],
		invoke: (AppsFlyer) => AppsFlyer.unregisterDeeplinkListener(),
	},
	{ api: 'disableAppSetId', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.disableAppSetId() },
	{ api: 'getHostName', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.getHostName() },
	{ api: 'getHostPrefix', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.getHostPrefix() },
	{ api: 'getOutOfStore', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.getOutOfStore() },
	{ api: 'getAttributionId', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.getAttributionId() },
	{ api: 'isStopped', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.isStopped() },
	{ api: 'isPreInstalledApp', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.isPreInstalledApp() },
	{ api: 'setOutOfStore', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setOutOfStore({ sourceName: 'store' }) },
	{ api: 'setLogLevel', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setLogLevel({ logLevel: 'debug' }) },
	{ api: 'setIsUpdate', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setIsUpdate({ isUpdate: true }) },
	{ api: 'setAppId', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.setAppId({ appId: 'com.app' }) },
	{
		api: 'setPreinstallAttribution',
		platforms: [ANDROID],
		invoke: (AppsFlyer) => AppsFlyer.setPreinstallAttribution({ mediaSource: 'ms', campaign: 'camp', siteId: 'site' }),
	},
	{ api: 'logSession', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.logSession() },
	{ api: 'onPause', platforms: [ANDROID], invoke: (AppsFlyer) => AppsFlyer.onPause() },

	// Same wire method both platforms (iOS renamed to match Android in AppsFlyerRPC 7.0.13), but Android keeps shouldTriggerSession while iOS doesn't take it.
	{
		api: 'performDeepLinking',
		platforms: BOTH,
		invoke: (AppsFlyer, platform) =>
			platform === ANDROID
				? AppsFlyer.performDeepLinking({ url: 'https://a.com', shouldTriggerSession: true })
				: AppsFlyer.performDeepLinking({ url: 'https://a.com' }),
	},
];

const PLATFORM_CONTRACTS = { [IOS]: iosContract, [ANDROID]: androidContract };

// Nested requirements are recorded as dotted paths (e.g. "product.productId").
function hasPath(params, dottedKey) {
	return (
		dottedKey.split('.').reduce((node, segment) => {
			if (node === null || typeof node !== 'object') {
				return undefined;
			}
			return node[segment];
		}, params) !== undefined
	);
}

describe('RPC wire contract', () => {
	describe.each(CALL_SITES)('$api', ({ platforms, invoke }) => {
		test.each(platforms)('satisfies the %s contract', (platform) => {
			const { AppsFlyer, NativeAppsFlyer: nativeAppsFlyer } = freshAppsFlyerForPlatform(platform);
			nativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
			jest.spyOn(console, 'warn').mockImplementation(() => {});
			jest.spyOn(console, 'error').mockImplementation(() => {});

			invoke(AppsFlyer, platform);

			const requests = nativeAppsFlyer.executeRpc.mock.calls.map(([json]) => JSON.parse(json));
			expect(requests.length).toBeGreaterThan(0);

			const contract = PLATFORM_CONTRACTS[platform];
			const problems = [];

			for (const { method, params = {} } of requests) {
				const spec = contract.methods[method];

				if (!spec) {
					problems.push(`method "${method}" is not implemented on ${platform}`);
					continue;
				}

				const known = Object.keys(spec.params || {});

				for (const key of known.filter((k) => spec.params[k].required)) {
					if (!hasPath(params, key)) {
						problems.push(
							`"${method}" requires param "${key}" on ${platform}, but the plugin sent ` +
								`${JSON.stringify(Object.keys(params))}`
						);
					}
				}

				// Top-level only — nested paths validated through their parent key.
				const topLevelKnown = new Set(known.map((key) => key.split('.')[0]));
				for (const key of Object.keys(params)) {
					if (!topLevelKnown.has(key)) {
						problems.push(
							`"${method}" is sent param "${key}", which ${platform} never reads ` +
								`(it reads ${JSON.stringify([...topLevelKnown])}) — silently dropped`
						);
					}
				}
			}

			jest.restoreAllMocks();
			expect(problems).toEqual([]);
		});
	});

	// Coverage gap: no automated check that CALL_SITES stays in sync with js-core-plugin's RpcMethodName union — follow-up, not fixed here.

	// Regression guard for finding #6: Number(fbLoginId) would round an 18-digit Facebook ID; asserts on raw wire text since re-parsing would reintroduce it.
	test('setUserFbLoginId does not lose precision on an 18-digit ID', () => {
		const { AppsFlyer, NativeAppsFlyer: nativeAppsFlyer } = freshAppsFlyerForPlatform('ios');
		nativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
		const eighteenDigitId = '100003456789012345';
		AppsFlyer.setUserFbLoginId({ fbLoginId: eighteenDigitId });
		const [requestJson] = nativeAppsFlyer.executeRpc.mock.calls[0];
		expect(requestJson).toBe(`{"method":"setUserFbLoginId","params":{"fbLoginId":"${eighteenDigitId}"}}`);
	});
});
