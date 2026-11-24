jest.mock('@expo/config-plugins', () => ({
  withAppDelegate: jest.fn((config) => config),
  withDangerousMod: jest.fn((config) => config),
  withPodfileProperties: jest.fn((config, action) => action(config)),
  WarningAggregator: { addWarningIOS: jest.fn() },
}));

const withAppsFlyerIos = require('../expo/withAppsFlyerIos');

const podfileProperties = (options, existing = {}) =>
  withAppsFlyerIos({ modResults: { ...existing } }, options).modResults;

test.each([
  [undefined, { 'appsflyer.purchaseConnector': 'false', 'appsflyer.strictMode': 'false' }],
  [{ shouldUsePurchaseConnector: true }, { 'appsflyer.purchaseConnector': 'true', 'appsflyer.strictMode': 'false' }],
  [{ shouldUseStrictMode: true }, { 'appsflyer.purchaseConnector': 'false', 'appsflyer.strictMode': 'true' }],
  [
    { shouldUsePurchaseConnector: true, shouldUseStrictMode: true },
    { 'appsflyer.purchaseConnector': 'true', 'appsflyer.strictMode': 'true' },
  ],
])('writes the iOS variant to Podfile.properties.json for options %p', (options, expected) => {
  expect(podfileProperties(options)).toEqual(expected);
});

test('keeps other Podfile properties and overrides a stale value', () => {
  const existing = { 'expo.jsEngine': 'hermes', 'appsflyer.strictMode': 'true' };
  expect(podfileProperties({}, existing)).toEqual({
    'expo.jsEngine': 'hermes',
    'appsflyer.purchaseConnector': 'false',
    'appsflyer.strictMode': 'false',
  });
});
