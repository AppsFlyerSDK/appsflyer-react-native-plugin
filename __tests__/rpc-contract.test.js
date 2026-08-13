import NativeAppsFlyer from '../src/NativeAppsFlyer';

// Contract tests for the generic executeRpc round-trip: exercise the TurboModule spec mock
// directly to prove the normalized { success, data } / { success, error } response shape
// both platforms' native normalization logic promises.

function buildRequestJson(method, params = {}) {
	return JSON.stringify({ method, params });
}

beforeEach(() => {
	NativeAppsFlyer.executeRpc.mockReset();
});

describe('executeRpc — normalized success shape', () => {
	test('resolves with { success: true, data } when the native RPC call succeeds', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({ success: true, data: { message: 'Success' } })
		);

		const responseJson = await NativeAppsFlyer.executeRpc(buildRequestJson('getAppsFlyerUID'));
		const response = JSON.parse(responseJson);

		expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(buildRequestJson('getAppsFlyerUID'));
		expect(response).toEqual({ success: true, data: { message: 'Success' } });
	});
});

describe('executeRpc — normalized error shape', () => {
	test('resolves (does not reject) with { success: false, error } on a protocol-level failure', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({ success: false, error: { code: 404, message: 'Unknown method' } })
		);

		const responseJson = await NativeAppsFlyer.executeRpc(buildRequestJson('notARealMethod'));
		const response = JSON.parse(responseJson);

		expect(response.success).toBe(false);
		expect(response.error).toEqual({ code: 404, message: 'Unknown method' });
	});

	test('resolves with { success: false, error } on an SDK-level failure (e.g. start before init)', async () => {
		NativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({ success: false, error: { code: 500, message: 'start completed with error' } })
		);

		const responseJson = await NativeAppsFlyer.executeRpc(buildRequestJson('start', { awaitResponse: true }));
		const response = JSON.parse(responseJson);

		expect(response.success).toBe(false);
		expect(response.error.code).toBe(500);
	});
});

describe('executeRpc — transport-only failure', () => {
	test('rejects only when the call never reaches the native RPC dispatcher at all', async () => {
		NativeAppsFlyer.executeRpc.mockRejectedValue(new Error('transport failure'));

		await expect(NativeAppsFlyer.executeRpc(buildRequestJson('init'))).rejects.toThrow('transport failure');
	});
});

// freshModule() resets module state — listener-registration flags are module-level singletons,
// so each test needs a clean instance to avoid flag bleed-over between tests.
function freshModule() {
	jest.resetModules();
	const { NativeEventEmitter } = require('react-native');
	const appsFlyer = require('../index').default;
	const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
	return {
		appsFlyer,
		nativeAppsFlyer: freshNativeAppsFlyer,
		nativeEventEmitter: new NativeEventEmitter(freshNativeAppsFlyer),
	};
}

function rpcMethodCalls(nativeAppsFlyer, methodName) {
	return nativeAppsFlyer.executeRpc.mock.calls.filter(
		([requestJson]) => JSON.parse(requestJson).method === methodName
	);
}

describe('RPC event channel pass-through fidelity', () => {
	test('firing the same native event twice in immediate succession invokes the JS listener exactly twice', async () => {
		const { appsFlyer, nativeEventEmitter } = freshModule();
		const callback = jest.fn();
		await appsFlyer.registerDeepLinkListener({ onDeepLinking: callback });

		const payload = { campaign: 'test_campaign', deep_link_value: 'abc', media_source: 'test', link: 'https://x' };
		const emit = () =>
			nativeEventEmitter.emit(
				'RNAppsFlyer_rpcEvent',
				JSON.stringify({ event: 'onDeepLinkReceived', data: payload, timestamp: Date.now(), origin: 'ios' })
			);
		emit();
		emit();

		// js-core-plugin's registerDeepLinkListener always normalizes this channel's payload as a
		// deep-link result, defaulting a missing `status` to 'NOT_FOUND' -- see compatibility.test.js.
		const normalized = { ...payload, status: 'NOT_FOUND' };
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, normalized);
		expect(callback).toHaveBeenNthCalledWith(2, normalized);
	});
});

// Unlike the old hand-rolled index.ts (which used a onceRegistrar to dedupe the RPC dispatch
// across repeated register*Listener attaches), @appsflyer-sdk/js-core-plugin's registerConversionListener/
// registerDeepLinkListener dispatch their RPC unconditionally on every call — only the native
// event-channel *subscription* (ensureEventsSubscribed) is guarded once per SDK instance. There is
// no per-listener remove() function returned anymore either; unregister*Listener() is the only
// teardown path. Flagged as a real behavior change from the old repo, not fixed here (test-only pass).
describe('Listener registration RPC dispatch', () => {
	test('registerConversionListener dispatches its RPC on every attach (no dedup, unlike the old onceRegistrar)', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();

		await appsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(1);

		await appsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(2);
	});

	test('registerDeepLinkListener calls executeRpc with the real iOS wire method name ("registerDeeplinkListener") on every attach', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();

		await appsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(1);

		await appsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(2);
	});
});

describe('isSessionReady (net-new)', () => {
	// Regression guard for finding #5: isSessionReady is a pure read-only status query — it must
	// not register the session-ready listener as a side effect (that's registerSessionReadyListener's job).
	// @appsflyer-sdk/js-core-plugin does no getter-response unwrapping (the old repo's unwrapKeyed
	// handled iOS's {isSessionReady: true} keyed-dict shape vs. Android's bare boolean) --
	// isSessionReady() now resolves whatever native sends back, as-is.
	test('resolves a boolean without triggering registerSessionReadyListener', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockImplementation((requestJson) => {
			const { method } = JSON.parse(requestJson);
			if (method === 'isSessionReady') {
				return Promise.resolve(JSON.stringify({ success: true, data: true }));
			}
			return Promise.resolve(JSON.stringify({ success: true, data: null }));
		});

		expect(await appsFlyer.isSessionReady()).toBe(true);
		await appsFlyer.isSessionReady();

		expect(rpcMethodCalls(nativeAppsFlyer, 'registerSessionReadyListener')).toHaveLength(0);
	});

	test('rejects with the normalized {code,message} error when the RPC call fails', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockImplementation((requestJson) => {
			const { method } = JSON.parse(requestJson);
			if (method === 'isSessionReady') {
				return Promise.resolve(JSON.stringify({ success: false, error: { code: 500, message: 'boom' } }));
			}
			return Promise.resolve(JSON.stringify({ success: true, data: null }));
		});

		await expect(appsFlyer.isSessionReady()).rejects.toEqual({ code: 500, message: 'boom' });
	});
});

// Per Docs/plans/js-core-rpc-integration.md's Decisions Log, the old repo's iOS 422 -> 404
// "unknown method" remap (unwrapRpcResponse) is deliberately NOT carried into RNTransport --
// @appsflyer-sdk/js-core-plugin's raw AppsFlyerError passes through unmodified. A 422 stays a 422
// regardless of message content now; this is an accepted, documented breaking behavior change,
// not a regression to fix here.
describe('error normalization — the iOS 422->404 remap was deliberately dropped', () => {
	test('an "Unknown or missing method" 422 is no longer remapped to 404', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Unknown or missing method: nonExistentMethod' },
			})
		);

		await expect(appsFlyer.setInstallId({ installId: 'install-1' })).rejects.toEqual({
			code: 422,
			message: 'Unknown or missing method: nonExistentMethod',
		});
	});

	test('a genuine 422 (malformed params) passes through unchanged, same as before', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Invalid parameter: devKey is required' },
			})
		);

		await expect(appsFlyer.setInstallId({ installId: 'install-1' })).rejects.toEqual({
			code: 422,
			message: 'Invalid parameter: devKey is required',
		});
	});
});

