import NativeAppsFlyer from '../src/NativeAppsFlyer';

// Exercises the TurboModule spec mock directly to prove the normalized { success, data } / { success, error } response shape both platforms promise.

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

// Resets module state — listener-registration flags are module-level singletons, so each test needs a clean instance.
function freshModule() {
	jest.resetModules();
	const { NativeEventEmitter } = require('react-native');
	const AppsFlyer = require('../index').default;
	const freshNativeAppsFlyer = require('../src/NativeAppsFlyer').default;
	return {
		AppsFlyer,
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
		const { AppsFlyer, nativeEventEmitter } = freshModule();
		const callback = jest.fn();
		await AppsFlyer.registerDeepLinkListener({ onDeepLinking: callback });

		const payload = { campaign: 'test_campaign', deep_link_value: 'abc', media_source: 'test', link: 'https://x' };
		const emit = () =>
			nativeEventEmitter.emit(
				'RNAppsFlyer_rpcEvent',
				JSON.stringify({ event: 'onDeepLinkReceived', data: payload, timestamp: Date.now(), origin: 'ios' })
			);
		emit();
		emit();

		// js-core-plugin normalizes this channel's payload, defaulting a missing `status` to 'NOT_FOUND' — see known-issues-kb.md.
		const normalized = { ...payload, status: 'NOT_FOUND' };
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, normalized);
		expect(callback).toHaveBeenNthCalledWith(2, normalized);
	});
});

// js-core-plugin dispatches register*Listener RPCs unconditionally on every attach (no dedup, unlike the old onceRegistrar); unregister*Listener() is the only teardown path.
describe('Listener registration RPC dispatch', () => {
	test('registerConversionListener dispatches its RPC on every attach (no dedup, unlike the old onceRegistrar)', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();

		await AppsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(1);

		await AppsFlyer.registerConversionListener({ onConversionDataSuccess: jest.fn(), onConversionDataFail: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerConversionListener')).toHaveLength(2);
	});

	test('registerDeepLinkListener calls executeRpc with the real iOS wire method name ("registerDeeplinkListener") on every attach', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();

		await AppsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(1);

		await AppsFlyer.registerDeepLinkListener({ onDeepLinking: jest.fn() });
		expect(rpcMethodCalls(nativeAppsFlyer, 'registerDeeplinkListener')).toHaveLength(2);
	});
});

describe('isSessionReady (net-new)', () => {
	// Regression guard for finding #5: isSessionReady is a pure read-only status query and must not register the session-ready listener as a side effect.
	test('resolves a boolean without triggering registerSessionReadyListener', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockImplementation((requestJson) => {
			const { method } = JSON.parse(requestJson);
			if (method === 'isSessionReady') {
				return Promise.resolve(JSON.stringify({ success: true, data: true }));
			}
			return Promise.resolve(JSON.stringify({ success: true, data: null }));
		});

		expect(await AppsFlyer.isSessionReady()).toBe(true);
		await AppsFlyer.isSessionReady();

		expect(rpcMethodCalls(nativeAppsFlyer, 'registerSessionReadyListener')).toHaveLength(0);
	});

	test('rejects with the normalized {code,message} error when the RPC call fails', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockImplementation((requestJson) => {
			const { method } = JSON.parse(requestJson);
			if (method === 'isSessionReady') {
				return Promise.resolve(JSON.stringify({ success: false, error: { code: 500, message: 'boom' } }));
			}
			return Promise.resolve(JSON.stringify({ success: true, data: null }));
		});

		await expect(AppsFlyer.isSessionReady()).rejects.toEqual({ code: 500, message: 'boom' });
	});
});

// Per Docs/plans/js-core-rpc-integration.md's Decisions Log, the old iOS 422->404 "unknown method" remap is deliberately not carried into RNTransport; a 422 now stays a 422.
describe('error normalization — the iOS 422->404 remap was deliberately dropped', () => {
	test('an "Unknown or missing method" 422 is no longer remapped to 404', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Unknown or missing method: nonExistentMethod' },
			})
		);

		await expect(AppsFlyer.setInstallId({ installId: 'install-1' })).rejects.toEqual({
			code: 422,
			message: 'Unknown or missing method: nonExistentMethod',
		});
	});

	test('a genuine 422 (malformed params) passes through unchanged, same as before', async () => {
		const { AppsFlyer, nativeAppsFlyer } = freshModule();
		nativeAppsFlyer.executeRpc.mockResolvedValue(
			JSON.stringify({
				success: false,
				error: { code: 422, message: 'Invalid parameter: devKey is required' },
			})
		);

		await expect(AppsFlyer.setInstallId({ installId: 'install-1' })).rejects.toEqual({
			code: 422,
			message: 'Invalid parameter: devKey is required',
		});
	});
});

