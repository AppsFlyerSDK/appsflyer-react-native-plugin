/**
 * Wire-contract test: asserts every dispatched RPC request against the params the native RPC
 * layers actually read (fixtures generated from native source by scripts/generate-*-rpc-contract.js,
 * committed so CI needs no native checkout). index.test.js only asserts the plugin against
 * itself; this catches both a missing required param (hard error, mainly iOS) and an extra
 * param native never reads (silent default via Android's opt* accessors).
 *
 * Unlike the pre-migration version of this file, there is no method-name alias table anymore --
 * @appsflyer-sdk/js-core-plugin's rpc-resolver.ts already resolves each call to the real wire method
 * name (e.g. "initialize", not "init") before it ever reaches NativeAppsFlyer.executeRpc, so the
 * `method` field on every captured request IS the name to look up directly in the fixture.
 * There is also no "capture once, reuse for both platforms" step anymore -- RNTransport.platform
 * is fixed per SDK instance at construction, so each platform under test gets its own fresh
 * module instance and its own dispatched requests.
 */

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
		appsFlyer: require('../index').default,
		NativeAppsFlyer: require('../src/NativeAppsFlyer').default,
	};
}

// `platforms` reflects intent (this repo's own @platform JSDoc markers, cross-checked against
// node_modules/@appsflyer-sdk/js-core-plugin/dist/generated/rpc-map.js) -- a method missing where it
// claims support is a defect this test should surface.
const CALL_SITES = [
	{ api: 'init', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.init({ devKey: 'devkey', appId: '123456789' }) },
	{ api: 'enableDebug', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.enableDebug({ enabled: true }) },
	{ api: 'start', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.start() },
	{ api: 'logEvent', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.logEvent({ eventName: 'af_purchase', eventValues: { af_revenue: 1 } }) },
	{
		api: 'logAdRevenue',
		platforms: BOTH,
		invoke: (appsFlyer) =>
			appsFlyer.logAdRevenue({
				monetizationNetwork: 'admob',
				currencyIso4217Code: 'USD',
				revenue: 1.5,
				mediationNetwork: 'google_admob',
			}),
	},
	{ api: 'logLocation', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.logLocation({ longitude: 1.5, latitude: 2.5 }) },
	{ api: 'setUserEmail', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setUserEmail({ email: 'a@b.com' }) },
	{ api: 'setAdditionalData', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setAdditionalData({ customData: { tenant: 'qa' } }) },
	{ api: 'getAppsFlyerUID', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.getAppsFlyerUID() },
	{ api: 'getSdkVersion', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.getSdkVersion() },
	{
		api: 'updateServerUninstallToken',
		platforms: BOTH,
		// iOS reads deviceToken (via registerUninstall); Android reads token — the resolver picks
		// the right key per platform now, no more sending both.
		invoke: (appsFlyer) => appsFlyer.updateServerUninstallToken({ token: 'token-abc' }),
	},
	{ api: 'setCustomerUserId', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setCustomerUserId({ customerId: 'uid-1' }) },
	{ api: 'stop', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.stop({ shouldStop: true }) },
	{ api: 'setAppInviteOneLink', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setAppInviteOneLink({ oneLinkId: 'abc1' }) },
	{
		api: 'generateInviteLink',
		platforms: BOTH,
		invoke: (appsFlyer) =>
			appsFlyer.generateInviteLink({
				parameters: { channel: 'sms', campaign: 'c1', referrerCustomerId: 'cust-1', baseDeepLink: 'https://example.com' },
			}),
	},
	{ api: 'logInvite', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.logInvite({ channel: 'sms', eventParameters: { k: 'v' } }) },
	{
		api: 'logCrossPromoteImpression',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.logCrossPromoteImpression({ appId: '123', campaign: 'c1', userParams: { k: 'v' } }),
	},
	{
		api: 'logAndOpenStore',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.logAndOpenStore({ promotedAppId: '123', campaign: 'c1', userParams: { k: 'v' } }),
	},
	{ api: 'setCurrencyCode', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setCurrencyCode({ currencyCode: 'USD' }) },
	{ api: 'isSessionReady', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.isSessionReady() },
	{
		api: 'unregisterSessionReadyListener',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.unregisterSessionReadyListener(),
	},
	{
		api: 'validateAndLogInAppPurchase',
		platforms: BOTH,
		// Android reads the flat purchaseToken/productId/purchaseType trio; iOS reads nested
		// product/transaction with transactionId instead of purchaseToken — genuinely different
		// shapes per platform now (no more sending a merged both-platform payload).
		invoke: (appsFlyer, platform) =>
			appsFlyer.validateAndLogInAppPurchase({
				purchase:
					platform === ANDROID
						? { purchaseType: 'oneTimePurchase', productId: 'sku', purchaseToken: 'txn' }
						: { purchaseType: 'oneTimePurchase', productId: 'sku', transactionId: 'txn' },
				additionalParameters: { extra: '1' },
			}),
	},
	{ api: 'anonymizeUser', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.anonymizeUser({ shouldAnonymize: true }) },
	{ api: 'setOneLinkCustomDomain', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setOneLinkCustomDomain({ domains: ['d.com'] }) },
	{ api: 'setResolveDeepLinkURLs', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setResolveDeepLinkURLs({ urls: ['u.com'] }) },
	{
		api: 'setDisableAdvertisingIdentifiers',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.setDisableAdvertisingIdentifiers({ disable: true }),
	},
	{ api: 'setHost', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setHost({ hostPrefixName: 'pre', hostName: 'host.com' }) },
	{
		api: 'addPushNotificationDeepLinkPath',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.addPushNotificationDeepLinkPath({ deepLinkPath: ['af', 'link'] }),
	},
	{
		api: 'setSharingFilterForPartners',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.setSharingFilterForPartners({ partners: ['p1'] }),
	},
	{ api: 'setPartnerData', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setPartnerData({ partnerId: 'p1', data: { k: 'v' } }) },
	{
		api: 'appendParametersToDeepLinkingURL',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.appendParametersToDeepLinkingURL({ contains: 'example.com', parameters: { k: 'v' } }),
	},
	{ api: 'enableTCFDataCollection', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.enableTCFDataCollection({ shouldCollect: true }) },
	{
		api: 'setConsentData',
		platforms: BOTH,
		invoke: (appsFlyer) =>
			appsFlyer.setConsentData({
				isUserSubjectToGDPR: true,
				hasConsentForDataUsage: true,
				hasConsentForAdsPersonalization: true,
				hasConsentForAdStorage: true,
			}),
	},
	{ api: 'setMinTimeBetweenSessions', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setMinTimeBetweenSessions({ seconds: 5 }) },
	{ api: 'setInstallId', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setInstallId({ installId: 'install-1' }) },
	{ api: 'setDeepLinkTimeout', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setDeepLinkTimeout({ timeout: 3000 }) },
	{
		api: 'enableFacebookDeferredApplinks',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.enableFacebookDeferredApplinks({ isEnabled: true }),
	},
	{ api: 'setUserPhone', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setUserPhone({ countryCode: '1', phoneNumber: '5551234567' }) },
	{ api: 'setUserFirstName', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setUserFirstName({ firstName: 'Ada' }) },
	{ api: 'setUserLastName', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setUserLastName({ lastName: 'Lovelace' }) },
	{ api: 'setUserFbLoginId', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.setUserFbLoginId({ fbLoginId: '12345' }) },
	{ api: 'clearUserPii', platforms: BOTH, invoke: (appsFlyer) => appsFlyer.clearUserPii() },
	{
		api: 'sendPushNotificationData',
		// Android-only now — iOS's equivalent is the separate handlePushNotification call site below
		// (see rpc-map.js: sendPushNotificationData.ios is null).
		platforms: [ANDROID],
		invoke: (appsFlyer) => appsFlyer.sendPushNotificationData({ campaign: 'c1', pid: 'firebase', isRetargeting: true }),
	},
	{
		api: 'handlePushNotification',
		// iOS-only (rpc-map.js: handlePushNotification.android is null).
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.handlePushNotification({ pushPayload: { af: { c: 'x' } } }),
	},
	{
		api: 'registerConversionListener',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() }),
	},
	{
		api: 'unregisterConversionListener',
		// iOS has no unregisterConversionListener RPC at all (rpc-map.js: ios is null; confirmed
		// against AFRPCTypedRequests.swift/AFRPCParser.swift registering no such method).
		platforms: [ANDROID],
		invoke: (appsFlyer) => appsFlyer.unregisterConversionListener(),
	},
	{
		api: 'registerDeepLinkListener',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() }),
	},
	{
		api: 'registerSessionReadyListener',
		platforms: BOTH,
		invoke: (appsFlyer) => appsFlyer.registerSessionReadyListener(jest.fn()),
	},

	// iOS-only surface
	{ api: 'setDisableIDFVCollection', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.setDisableIDFVCollection({ disable: true }) },
	{ api: 'setDisableCollectASA', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.setDisableCollectASA({ disable: true }) },
	{
		api: 'setDisableAppleAdsAttribution',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.setDisableAppleAdsAttribution({ disable: true }),
	},
	{
		api: 'setUseReceiptValidationSandbox',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.setUseReceiptValidationSandbox({ sandbox: true }),
	},
	{
		api: 'setUseUninstallSandbox',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.setUseUninstallSandbox({ sandbox: true }),
	},
	{ api: 'setDisableSKAdNetwork', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.setDisableSKAdNetwork({ disable: true }) },
	{ api: 'setCurrentDeviceLanguage', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.setCurrentDeviceLanguage({ language: 'en' }) },
	{
		api: 'setShouldCollectDeviceName',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.setShouldCollectDeviceName({ collect: true }),
	},
	{
		api: 'setFacebookDeferredAppLink',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.setFacebookDeferredAppLink({ url: 'https://a.com' }),
	},
	{
		api: 'continueUserActivity',
		platforms: [IOS],
		invoke: (appsFlyer) => appsFlyer.continueUserActivity({ url: 'https://a.com' }),
	},
	{ api: 'handleOpenURL', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.handleOpenURL({ url: 'app://x' }) },
	{ api: 'handleOpenUrl', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.handleOpenUrl({ url: 'app://x' }) },
	// NOTE: core's schema marks `launchOptions` optional (HandleLaunchOptionsParams.launchOptions?),
	// but iOS's real native parser (AFRPCHandleLaunchOptionsRequest, per the fixture) requires it --
	// a genuine schema/native mismatch this wire-contract test exists to catch. Passing an object
	// here reflects what a caller must actually do; the schema itself is out of scope to fix in
	// this test-only pass (flagged as a finding, not silently worked around).
	{ api: 'handleLaunchOptions', platforms: [IOS], invoke: (appsFlyer) => appsFlyer.handleLaunchOptions({ launchOptions: {} }) },

	// Android-only surface
	{ api: 'setCollectAndroidID', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setCollectAndroidID({ isCollect: true }) },
	{ api: 'setDisableNetworkData', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setDisableNetworkData({ isDisable: true }) },
	{
		api: 'unregisterDeeplinkListener',
		platforms: [ANDROID],
		invoke: (appsFlyer) => appsFlyer.unregisterDeeplinkListener(),
	},
	{ api: 'disableAppSetId', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.disableAppSetId() },
	{ api: 'getHostName', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.getHostName() },
	{ api: 'getHostPrefix', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.getHostPrefix() },
	{ api: 'getOutOfStore', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.getOutOfStore() },
	{ api: 'getAttributionId', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.getAttributionId() },
	{ api: 'isStopped', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.isStopped() },
	{ api: 'isPreInstalledApp', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.isPreInstalledApp() },
	{ api: 'setOutOfStore', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setOutOfStore({ sourceName: 'store' }) },
	{ api: 'setLogLevel', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setLogLevel({ logLevel: 'debug' }) },
	{ api: 'setIsUpdate', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setIsUpdate({ isUpdate: true }) },
	{ api: 'setAppId', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.setAppId({ appId: 'com.app' }) },
	{
		api: 'setPreinstallAttribution',
		platforms: [ANDROID],
		invoke: (appsFlyer) => appsFlyer.setPreinstallAttribution({ mediaSource: 'ms', campaign: 'camp', siteId: 'site' }),
	},
	{ api: 'logSession', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.logSession() },
	{ api: 'onPause', platforms: [ANDROID], invoke: (appsFlyer) => appsFlyer.onPause() },

	// Both platforms, but a genuinely different wire method + params per platform
	// (Android keeps shouldTriggerSession; iOS's performOnAppAttributionWithURL doesn't take it).
	{
		api: 'performDeepLinking',
		platforms: BOTH,
		invoke: (appsFlyer, platform) =>
			platform === ANDROID
				? appsFlyer.performDeepLinking({ url: 'https://a.com', shouldTriggerSession: true })
				: appsFlyer.performDeepLinking({ url: 'https://a.com' }),
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
			const { appsFlyer, NativeAppsFlyer: nativeAppsFlyer } = freshAppsFlyerForPlatform(platform);
			nativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
			jest.spyOn(console, 'warn').mockImplementation(() => {});
			jest.spyOn(console, 'error').mockImplementation(() => {});

			invoke(appsFlyer, platform);

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

				// Top-level only — nested paths are validated through their parent key.
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

	// The pre-migration static source-scan coverage guard (grepping index.ts for callRpc/
	// callRpcVoid/onceRegistrar call sites) no longer applies -- RPC dispatch now lives entirely
	// inside @appsflyer-sdk/js-core-plugin's compiled AppsFlyerSDK, not in this repo's own source text.
	// Re-establishing an equivalent coverage check (e.g. diffing CALL_SITES against
	// node_modules/@appsflyer-sdk/js-core-plugin/dist/generated/methods.js's RpcMethodName union) is a
	// real gap worth tracking as a follow-up, not fixed in this test-only pass.

	// Regression guard for finding #6: an 18-digit Facebook ID must reach native at full precision.
	// Number(fbLoginId) would round "100003456789012345" to ...012350 before serialization, and
	// JSON.parse-ing the wire text back into a JS Number for inspection would silently reintroduce
	// the same rounding — so this asserts on the raw wire *text*, not a re-parsed object.
	test('setUserFbLoginId does not lose precision on an 18-digit ID', () => {
		const { appsFlyer, NativeAppsFlyer: nativeAppsFlyer } = freshAppsFlyerForPlatform('ios');
		nativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
		const eighteenDigitId = '100003456789012345';
		appsFlyer.setUserFbLoginId({ fbLoginId: eighteenDigitId });
		const [requestJson] = nativeAppsFlyer.executeRpc.mock.calls[0];
		expect(requestJson).toBe(`{"method":"setUserFbLoginId","params":{"fbLoginId":${eighteenDigitId}}}`);
	});
});
