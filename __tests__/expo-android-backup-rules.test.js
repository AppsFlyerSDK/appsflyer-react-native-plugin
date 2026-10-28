jest.mock('@expo/config-plugins', () => ({
  withGradleProperties: jest.fn((config) => config),
  withAndroidManifest: jest.fn((config, action) => action(config)),
}));

const withAppsFlyerAndroid = require('../expo/withAppsFlyerAndroid');

const run = (appAttrs, options = { preferAppsFlyerBackupRules: true }) => {
  const manifest = { $: {}, application: [{ $: { ...appAttrs } }] };
  withAppsFlyerAndroid({ modResults: { manifest } }, options);
  return manifest.application[0].$;
};

beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

test('removes only the stale backup keys from tools:replace and keeps the rest', () => {
  const attrs = run({
    'android:dataExtractionRules': '@xml/rules',
    'android:fullBackupContent': '@xml/backup',
    'tools:replace': 'android:dataExtractionRules, android:allowBackup, android:fullBackupContent',
  });
  expect(attrs['android:dataExtractionRules']).toBeUndefined();
  expect(attrs['android:fullBackupContent']).toBeUndefined();
  expect(attrs['tools:replace']).toBe('android:allowBackup');
});

test('deletes tools:replace when only stale keys were listed', () => {
  const attrs = run({
    'android:dataExtractionRules': '@xml/rules',
    'tools:replace': 'android:dataExtractionRules',
  });
  expect(attrs['tools:replace']).toBeUndefined();
});

test('leaves tools:replace untouched when it lists no removed key', () => {
  const attrs = run({
    'android:dataExtractionRules': '@xml/rules',
    'tools:replace': 'android:allowBackup',
  });
  expect(attrs['tools:replace']).toBe('android:allowBackup');
});

test('does not touch tools:replace or backup attributes by default', () => {
  const attrs = run(
    { 'android:dataExtractionRules': '@xml/rules', 'tools:replace': 'android:dataExtractionRules' },
    { preferAppsFlyerBackupRules: false }
  );
  expect(attrs['android:dataExtractionRules']).toBe('@xml/rules');
  expect(attrs['tools:replace']).toBe('android:dataExtractionRules');
});
