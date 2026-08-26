// NativeEventEmitter: use RN's own manual mock — bare automocking breaks constructibility in RN 0.76+.
jest.mock('../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter', () =>
	require('../node_modules/react-native/Libraries/EventEmitter/__mocks__/NativeEventEmitter')
);

// TurboModule spec mock — every RPC call in index.js flows through executeRpc.
jest.mock('../src/NativeAppsFlyer', () => ({
	__esModule: true,
	default: {
		executeRpc: jest.fn(() =>
			Promise.resolve(JSON.stringify({ success: true, data: null }))
		),
		addListener: jest.fn(),
		removeListeners: jest.fn(),
	},
}));
