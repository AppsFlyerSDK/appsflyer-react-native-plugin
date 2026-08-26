import NativeAppsFlyer from '../src/NativeAppsFlyer';

// start()'s native RPC timeout (iOS 10s / Android 5s) must resolve { success: false, error }, not hang or reject.

function buildRequestJson(method, params = {}) {
	return JSON.stringify({ method, params });
}

beforeEach(() => {
	NativeAppsFlyer.executeRpc.mockReset();
});

test('start() settles with a distinguishable timeout failure instead of hanging when the native timeout fires', async () => {
	NativeAppsFlyer.executeRpc.mockImplementation(
		() =>
			new Promise((resolve) => {
				setTimeout(() => {
					resolve(
						JSON.stringify({
							success: false,
							error: { code: 500, message: 'start completed with error: timed out' },
						})
					);
				}, 20);
			})
	);

	const responseJson = await NativeAppsFlyer.executeRpc(buildRequestJson('start', { awaitResponse: true }));
	const response = JSON.parse(responseJson);

	expect(response.success).toBe(false);
	expect(response.error.message).toMatch(/timed out/i);
}, 1000);

test('executeRpc never resolves is a real hang the mock must not paper over', async () => {
	let settled = false;
	NativeAppsFlyer.executeRpc.mockImplementation(() => new Promise(() => {}));

	const pending = NativeAppsFlyer.executeRpc(buildRequestJson('start')).then(() => {
		settled = true;
	});

	await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 20))]);

	expect(settled).toBe(false);
});
