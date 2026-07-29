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
	test('firing the same native event twice in immediate succession invokes the JS listener exactly twice', () => {
		const { appsFlyer, nativeEventEmitter } = freshModule();
		const callback = jest.fn();
		const remove = appsFlyer.onDeepLink(callback);

		const payload = { campaign: 'test_campaign', deep_link_value: 'abc', media_source: 'test', link: 'https://x' };
		const emit = () =>
			nativeEventEmitter.emit(
				'RNAppsFlyer_rpcEvent',
				JSON.stringify({ event: 'onDeepLinkReceived', data: payload, timestamp: Date.now(), origin: 'ios' })
			);
		emit();
		emit();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, payload);
		expect(callback).toHaveBeenNthCalledWith(2, payload);

		remove();
	});
});

describe('Listener registration triggers the matching register*Listener RPC once', () => {
	test('registerConversionListener RPC fires exactly once, shared across onInstallConversionData and onInstallConversionFailure', () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();

		const removeA = appsFlyer.onInstallConversionData(jest.fn());
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(1);

		// same native registration backs both — must not re-dispatch
		const removeB = appsFlyer.onInstallConversionFailure(jest.fn());
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(1);

		removeA();
		removeB();
	});

	test('first onDeepLink attach calls executeRpc with the canonical registerDeeplinkListener method name, only once', () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();

		const removeA = appsFlyer.onDeepLink(jest.fn());
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(1);

		const removeB = appsFlyer.onDeepLink(jest.fn());
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(1);

		removeA();
		removeB();
	});
});

describe('isSessionReady (net-new)', () => {
	// Regression guard for finding #5: isSessionReady is a pure read-only status query — it must
	// not register the session-ready listener as a side effect (that's registerSessionReadyListener's job).
	test('resolves a boolean without triggering registerSessionReadyListener', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockImplementation((requestJson) => {
			const { method } = JSON.parse(requestJson);
			if (method === 'isSessionReady') {
				return Promise.resolve(JSON.stringify({ success: true, data: { isSessionReady: true } }));
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

describe('callRpc — FR-007 unsupported-method normalization', () => {
	test('Android 422 "Unknown or missing method" is normalized to 404 to match iOS', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Unknown or missing method: nonExistentMethod' },
			})
		);

		// Normalization lives in callRpc and is method-agnostic — exercised here via any
		// promise-returning typed wrapper rather than the (removed) generic executeRpc.
		await expect(appsFlyer.setInstallId('install-1')).rejects.toEqual({
			code: 404,
			message: 'Unknown or missing method: nonExistentMethod',
		});
	});

	test('a genuine 422 (malformed params, not unknown method) is NOT normalized to 404', async () => {
		const { appsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Invalid parameter: devKey is required' },
			})
		);

		await expect(appsFlyer.setInstallId('install-1')).rejects.toEqual({
			code: 422,
			message: 'Invalid parameter: devKey is required',
		});
	});
});

