/**
 * Wire-contract test: asserts every index.js RPC call site against the params the native RPC
 * layers actually read (fixtures generated from native source by scripts/generate-*-rpc-contract.js,
 * committed so CI needs no native checkout). index.test.js only asserts the plugin against
 * itself, which is why 27 wire mismatches shipped green — this catches both a missing required
 * param (hard error, mainly iOS) and an extra param native never reads (silent default via
 * Android's opt* accessors, since nothing there is ever required).
 */

import appsFlyer, { AppsFlyerConsent } from '../index';
import NativeAppsFlyer from '../src/NativeAppsFlyer';

const fs = require('fs');
const path = require('path');

const iosContract = require('./fixtures/ios-rpc-contract.json');
const androidContract = require('./fixtures/android-rpc-contract.json');

// Mirrors RNAppsFlyerImpl.swift `canonicalToIOSMethod` — native rewrites the method string only, never params.
const IOS_METHOD_ALIASES = {
	init: 'initialize',
	sendPushNotificationData: 'handlePushNotification',
	updateServerUninstallToken: 'registerUninstall',
};

// Mirrors RNAppsFlyerModule.kt `CANONICAL_TO_ANDROID_METHOD`.
const ANDROID_METHOD_ALIASES = {
	registerDeeplinkListener: 'subscribeForDeepLink',
};

const IOS = 'ios';
const ANDROID = 'android';
const BOTH = [IOS, ANDROID];

// `platforms` reflects intent (index.d.ts @platform markers), not current behaviour — a method missing where it claims support is a defect the test should surface.
const CALL_SITES = [
	{
		api: 'init',
		platforms: BOTH,
		// appId is iOS-only; passed unconditionally because Android's InitRequest ignores extra fields.
		crossPlatformParams: ['appId'],
		invoke: () => appsFlyer.init('devkey', '123456789'),
	},
	{ api: 'setIsDebug', platforms: BOTH, invoke: () => appsFlyer.enableDebug(true) },
	{ api: 'start', platforms: BOTH, invoke: () => appsFlyer.start() },
	{ api: 'logEvent', platforms: BOTH, invoke: () => appsFlyer.logEvent('af_purchase', { af_revenue: 1 }) },
	{
		api: 'logAdRevenue',
		platforms: BOTH,
		invoke: () =>
			appsFlyer.logAdRevenue({
				monetizationNetwork: 'admob',
				currencyIso4217Code: 'USD',
				revenue: 1.5,
				mediationNetwork: 'google_admob',
			}),
	},
	{ api: 'logLocation', platforms: BOTH, invoke: () => appsFlyer.logLocation(1.5, 2.5) },
	{ api: 'setUserEmail', platforms: BOTH, invoke: () => appsFlyer.setUserEmail('a@b.com') },
	{ api: 'setAdditionalData', platforms: BOTH, invoke: () => appsFlyer.setAdditionalData({ tenant: 'qa' }) },
	{ api: 'getAppsFlyerUID', platforms: BOTH, invoke: () => appsFlyer.getAppsFlyerUID() },
	{ api: 'getSDKVersion', platforms: BOTH, invoke: () => appsFlyer.getSdkVersion() },
	{
		api: 'updateServerUninstallToken',
		platforms: BOTH,
		// iOS reads `deviceToken` (via registerUninstall), Android reads `token`.
		crossPlatformParams: ['token', 'deviceToken'],
		invoke: () => appsFlyer.updateServerUninstallToken('token-abc'),
	},
	{ api: 'setCustomerUserId', platforms: BOTH, invoke: () => appsFlyer.setCustomerUserId('uid-1') },
	{ api: 'stop', platforms: BOTH, invoke: () => appsFlyer.stop(true) },
	{ api: 'setAppInviteOneLinkID', platforms: BOTH, invoke: () => appsFlyer.setAppInviteOneLink('abc1') },
	{
		api: 'generateInviteLink',
		platforms: BOTH,
		invoke: () =>
			appsFlyer.generateInviteLink({
				channel: 'sms',
				campaign: 'c1',
				customerID: 'cust-1',
				baseDeeplink: 'https://example.com',
			}),
		// iOS reads `referrerCustomerId`, Android reads `customerId`.
		crossPlatformParams: ['referrerCustomerId', 'customerId', 'awaitResponse'],
	},
	{ api: 'logInvite', platforms: BOTH, invoke: () => appsFlyer.logInvite('sms', { k: 'v' }) },
	{
		api: 'logCrossPromotionImpression',
		platforms: BOTH,
		invoke: () => appsFlyer.logCrossPromoteImpression('123', 'c1', { k: 'v' }),
	},
	{
		api: 'logCrossPromotionAndOpenStore',
		platforms: BOTH,
		invoke: () => appsFlyer.logAndOpenStore('123', 'c1', { k: 'v' }),
	},
	{ api: 'setCurrencyCode', platforms: BOTH, invoke: () => appsFlyer.setCurrencyCode('USD') },
	{ api: 'isSessionReady', platforms: BOTH, invoke: () => appsFlyer.isSessionReady() },
	{
		api: 'unregisterSessionReadyListener',
		platforms: BOTH,
		invoke: () => appsFlyer.unregisterSessionReadyListener(),
	},
	{
		api: 'validateAndLogInAppPurchase',
		platforms: BOTH,
		invoke: () =>
			appsFlyer.validateAndLogInAppPurchase(
				{ productId: 'sku', transactionId: 'txn', purchaseType: 'oneTimePurchase' },
				{ extra: '1' },
				jest.fn()
			),
		// iOS reads nested product/transaction, Android reads the flat trio.
		crossPlatformParams: [
			'product',
			'transaction',
			'productId',
			'purchaseToken',
			'purchaseType',
			'awaitResponse',
		],
	},
	{ api: 'anonymizeUser', platforms: BOTH, invoke: () => appsFlyer.anonymizeUser(true) },
	{ api: 'setOneLinkCustomDomains', platforms: BOTH, invoke: () => appsFlyer.setOneLinkCustomDomain(['d.com']) },
	{ api: 'setResolveDeepLinkURLs', platforms: BOTH, invoke: () => appsFlyer.setResolveDeepLinkURLs(['u.com']) },
	{
		api: 'disableAdvertisingIdentifier',
		platforms: BOTH,
		// iOS reads `disable`, Android reads `isDisable`.
		crossPlatformParams: ['disable', 'isDisable'],
		invoke: () => appsFlyer.setDisableAdvertisingIdentifiers(true),
	},
	{ api: 'setHost', platforms: BOTH, invoke: () => appsFlyer.setHost('pre', 'host.com') },
	{
		api: 'addPushNotificationDeepLinkPath',
		platforms: BOTH,
		invoke: () => appsFlyer.addPushNotificationDeepLinkPath(['af', 'link']),
	},
	{
		api: 'setSharingFilterForPartners',
		platforms: BOTH,
		invoke: () => appsFlyer.setSharingFilterForPartners(['p1']),
	},
	{ api: 'setPartnerData', platforms: BOTH, invoke: () => appsFlyer.setPartnerData('p1', { k: 'v' }) },
	{
		api: 'appendParametersToDeepLinkingURL',
		platforms: BOTH,
		invoke: () => appsFlyer.appendParametersToDeepLinkingURL('example.com', { k: 'v' }),
	},
	{ api: 'enableTCFDataCollection', platforms: BOTH, invoke: () => appsFlyer.enableTCFDataCollection(true) },
	{
		api: 'setConsentData',
		platforms: BOTH,
		invoke: () =>
			appsFlyer.setConsentData(new AppsFlyerConsent(true, true, true, true)),
	},
	{
		api: 'setMinTimeBetweenSessions',
		platforms: BOTH,
		invoke: () => appsFlyer.setMinTimeBetweenSessions(5),
	},
	{ api: 'setInstallId', platforms: BOTH, invoke: () => appsFlyer.setInstallId('install-1') },
	{ api: 'setDeepLinkTimeout', platforms: BOTH, invoke: () => appsFlyer.setDeepLinkTimeout(3000) },
	{
		api: 'enableFacebookDeferredApplinks',
		platforms: BOTH,
		invoke: () => appsFlyer.enableFacebookDeferredApplinks(true),
	},
	{ api: 'setUserPhone', platforms: BOTH, invoke: () => appsFlyer.setUserPhone('1', '5551234567') },
	{ api: 'setUserFirstName', platforms: BOTH, invoke: () => appsFlyer.setUserFirstName('Ada') },
	{ api: 'setUserLastName', platforms: BOTH, invoke: () => appsFlyer.setUserLastName('Lovelace') },
	{ api: 'setUserFbLoginId', platforms: BOTH, invoke: () => appsFlyer.setUserFbLoginId('12345') },
	{ api: 'clearUserPii', platforms: BOTH, invoke: () => appsFlyer.clearUserPii() },
	{
		api: 'sendPushNotificationData',
		platforms: BOTH,
		// iOS takes the raw payload; Android takes pre-extracted campaign fields.
		crossPlatformParams: [
			'pushPayload',
			'campaign',
			'pid',
			'isRetargeting',
			'additionalParameters',
		],
		invoke: () =>
			appsFlyer.sendPushNotificationData({ af: { c: 'x' } }, null, {
				campaign: 'c1',
				pid: 'firebase',
				isRetargeting: true,
			}),
	},
	{
		api: 'registerConversionListener',
		platforms: BOTH,
		invoke: () => appsFlyer.registerConversionListener(jest.fn(), jest.fn()),
	},
	{
		api: 'unregisterConversionListener',
		// Android-only RPC per the Alignment Matrix; iOS has no unregisterConversionListener.
		platforms: [ANDROID],
		invoke: () => appsFlyer.unregisterConversionListener(),
	},
	{ api: 'registerDeepLinkListener', platforms: BOTH, invoke: () => appsFlyer.registerDeepLinkListener(jest.fn()) },
	{
		api: 'registerSessionReadyListener',
		platforms: BOTH,
		invoke: () => appsFlyer.registerSessionReadyListener(jest.fn()),
	},

	// iOS-only surface
	{ api: 'disableIDFVCollection', platforms: [IOS], invoke: () => appsFlyer.setDisableIDFVCollection(true) },
	{ api: 'disableCollectASA', platforms: [IOS], invoke: () => appsFlyer.setDisableCollectASA(true) },
	{
		api: 'setUseReceiptValidationSandbox',
		platforms: [IOS],
		invoke: () => appsFlyer.setUseReceiptValidationSandbox(true),
	},
	{
		api: 'setUseUninstallSandbox',
		platforms: [IOS],
		invoke: () => appsFlyer.setUseUninstallSandbox(true),
	},
	{ api: 'disableSKAD', platforms: [IOS], invoke: () => appsFlyer.setDisableSKAdNetwork(true) },
	{ api: 'setCurrentDeviceLanguage', platforms: [IOS], invoke: () => appsFlyer.setCurrentDeviceLanguage('en') },
	{
		api: 'setShouldCollectDeviceName',
		platforms: [IOS],
		invoke: () => appsFlyer.setShouldCollectDeviceName(true),
	},
	{
		api: 'setFacebookDeferredAppLink',
		platforms: [IOS],
		invoke: () => appsFlyer.setFacebookDeferredAppLink({ url: 'https://a.com' }),
	},

	// Android-only surface
	{ api: 'setCollectAndroidID', platforms: [ANDROID], invoke: () => appsFlyer.setCollectAndroidID(true) },
	{ api: 'setDisableNetworkData', platforms: [ANDROID], invoke: () => appsFlyer.setDisableNetworkData(true) },
	{
		api: 'performOnDeepLinking',
		platforms: [ANDROID],
		invoke: () => appsFlyer.performDeepLinking('https://a.com', true),
	},
	{
		api: 'unregisterForDeepLink',
		platforms: [ANDROID],
		invoke: () => appsFlyer.unregisterForDeepLink(),
	},
	{ api: 'disableAppSetId', platforms: [ANDROID], invoke: () => appsFlyer.disableAppSetId() },
	{ api: 'getHostName', platforms: [ANDROID], invoke: () => appsFlyer.getHostName() },
	{ api: 'getHostPrefix', platforms: [ANDROID], invoke: () => appsFlyer.getHostPrefix() },
	{ api: 'getOutOfStore', platforms: [ANDROID], invoke: () => appsFlyer.getOutOfStore() },
	{ api: 'getAttributionId', platforms: [ANDROID], invoke: () => appsFlyer.getAttributionId() },
	{ api: 'isStopped', platforms: [ANDROID], invoke: () => appsFlyer.isStopped() },
	{ api: 'isPreInstalledApp', platforms: [ANDROID], invoke: () => appsFlyer.isPreInstalledApp() },
	{ api: 'setOutOfStore', platforms: [ANDROID], invoke: () => appsFlyer.setOutOfStore('store') },
	{ api: 'setLogLevel', platforms: [ANDROID], invoke: () => appsFlyer.setLogLevel(4) },
	{ api: 'setIsUpdate', platforms: [ANDROID], invoke: () => appsFlyer.setIsUpdate(true) },
	{ api: 'setAppId', platforms: [ANDROID], invoke: () => appsFlyer.setAppId('com.app') },
	{
		api: 'setPreinstallAttribution',
		platforms: [ANDROID],
		invoke: () => appsFlyer.setPreinstallAttribution('ms', 'camp', 'site'),
	},
	{ api: 'logSession', platforms: [ANDROID], invoke: () => appsFlyer.logSession() },
];

const PLATFORMS = {
	[IOS]: { contract: iosContract, aliases: IOS_METHOD_ALIASES },
	[ANDROID]: { contract: androidContract, aliases: ANDROID_METHOD_ALIASES },
};

// Nested requirements are recorded as dotted paths (e.g. "product.productId").
function hasPath(params, dottedKey) {
	return dottedKey.split('.').reduce((node, segment) => {
		if (node === null || typeof node !== 'object') {
			return undefined;
		}
		return node[segment];
	}, params) !== undefined;
}

// Every method name any CALL_SITES entry actually dispatched — drives the coverage test below.
const exercisedMethods = new Set();

function requestsFrom(invoke) {
	NativeAppsFlyer.executeRpc.mockClear();
	// callRpcVoid swallows rejections into console.warn; the mock resolves, so nothing throws.
	invoke();
	const requests = NativeAppsFlyer.executeRpc.mock.calls.map(([json]) => JSON.parse(json));
	requests.forEach(({ method }) => exercisedMethods.add(method));
	return requests;
}

// Static scan of index.js for every RPC method it can dispatch (direct calls + onceRegistrar listeners).
function dispatchedMethodsInSource() {
	const source = fs.readFileSync(path.join(__dirname, '..', 'index.ts'), 'utf8');
	const found = new Set();
	const patterns = [
		/(?:callRpc|callRpcVoid|callRpcWithCallback|dispatchRpc)\(\s*"([^"]+)"/g,
		/onceRegistrar\(\s*"([^"]+)"/g,
		// setUserFbLoginId bypasses callRpc/dispatchRpc and builds its request JSON inline (see
		// index.js's precision-loss comment) — matches the literal `"method":"..."` it sends.
		/"method"\s*:\s*"([^"]+)"/g,
	];
	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			found.add(match[1]);
		}
	}
	return found;
}

describe('RPC wire contract', () => {
	beforeEach(() => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({ success: true, data: null })
		);
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe.each(CALL_SITES)('$api', ({ api, platforms, invoke, crossPlatformParams = [] }) => {
		// Capture once and reuse: index.js emits identical JSON per OS, and onceRegistrar listeners only fire on first attach.
		let captured = null;
		const capture = () => {
			if (captured === null) {
				captured = requestsFrom(invoke);
			}
			return captured;
		};

		test.each(platforms)('satisfies the %s contract', (platform) => {
			const { contract, aliases } = PLATFORMS[platform];
			// Keys deliberately sent for the *other* platform (declared per call site so a stray typo still fails).
			const allowedElsewhere = new Set(crossPlatformParams);
			const requests = capture();
			// Collect every violation instead of failing on the first — one API can be wrong in several ways at once.
			const problems = [];

			expect(requests.length).toBeGreaterThan(0);

			for (const { method, params = {} } of requests) {
				const nativeMethod = aliases[method] || method;
				const spec = contract.methods[nativeMethod];

				if (!spec) {
					problems.push(
						`method "${method}"${
							nativeMethod === method ? '' : ` (aliased to "${nativeMethod}")`
						} is not implemented on ${platform}`
					);
					continue;
				}

				const known = Object.keys(spec.params || {});

				for (const key of known.filter((k) => spec.params[k].required)) {
					if (!hasPath(params, key)) {
						problems.push(
							`"${nativeMethod}" requires param "${key}" on ${platform}, but the plugin sent ` +
								`${JSON.stringify(Object.keys(params))}`
						);
					}
				}

				// Top-level only — nested paths are validated through their parent key.
				const topLevelKnown = new Set(known.map((key) => key.split('.')[0]));
				for (const key of Object.keys(params)) {
					if (!topLevelKnown.has(key) && !allowedElsewhere.has(key)) {
						problems.push(
							`"${nativeMethod}" is sent param "${key}", which ${platform} never reads ` +
								`(it reads ${JSON.stringify([...topLevelKnown])}) — silently dropped`
						);
					}
				}
			}

			expect({ [api]: problems }).toEqual({ [api]: [] });
		});
	});

	// Declared after describe.each so it runs once `exercisedMethods` is populated — without it, a new RPC call missing a CALL_SITES entry goes silently unvalidated.
	test('every RPC method index.js can dispatch is exercised by a call site', () => {
		const uncovered = [...dispatchedMethodsInSource()]
			.filter((method) => !exercisedMethods.has(method))
			.sort();
		expect(uncovered).toEqual([]);
	});

	// Regression guard for finding #6: an 18-digit Facebook ID must reach native at full precision.
	// Number(fbLoginId) would round "100003456789012345" to ...012350 before serialization, and
	// JSON.parse-ing the wire text back into a JS Number for inspection would silently reintroduce
	// the same rounding — so this asserts on the raw wire *text*, not a re-parsed object.
	test('setUserFbLoginId does not lose precision on an 18-digit ID', () => {
		const eighteenDigitId = '100003456789012345';
		NativeAppsFlyer.executeRpc.mockClear();
		appsFlyer.setUserFbLoginId(eighteenDigitId);
		const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
		expect(requestJson).toBe(
			`{"method":"setUserFbLoginId","params":{"fbLoginId":${eighteenDigitId}}}`
		);
	});

	test('the iOS alias table matches RNAppsFlyerImpl.swift', () => {
		// Guards against the fixture drifting from the native remap it mirrors.
		for (const target of Object.values(IOS_METHOD_ALIASES)) {
			expect(iosContract.methods[target]).toBeDefined();
		}
		for (const target of Object.values(ANDROID_METHOD_ALIASES)) {
			expect(androidContract.methods[target]).toBeDefined();
		}
	});
});
