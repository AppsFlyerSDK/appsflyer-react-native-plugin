const { NativeEventEmitter } = require('react-native');
const { RNTransport } = require('../src/rn-transport');

afterEach(() => {
  new NativeEventEmitter().removeAllListeners('RNAppsFlyer_rpcEvent');
  jest.restoreAllMocks();
});

test('ignores a malformed RPC event and stops delivering after remove', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const listener = jest.fn();
  const handle = new RNTransport().subscribe(listener);
  const emitter = new NativeEventEmitter();
  const event = { event: 'onDeepLinking', data: { campaign: 'spring' }, timestamp: 1 };

  emitter.emit('RNAppsFlyer_rpcEvent', '{');
  expect(listener).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith(
    'AppsFlyer: failed to parse native RPC event envelope',
    expect.any(SyntaxError)
  );

  emitter.emit('RNAppsFlyer_rpcEvent', event);
  expect(listener).toHaveBeenCalledWith(event);

  handle.remove();
  emitter.emit('RNAppsFlyer_rpcEvent', { event: 'onDeepLinking', data: {}, timestamp: 2 });
  expect(listener).toHaveBeenCalledTimes(1);
});
