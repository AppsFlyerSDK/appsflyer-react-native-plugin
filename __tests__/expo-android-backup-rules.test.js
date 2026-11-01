jest.mock('@expo/config-plugins', () => ({
  withGradleProperties: jest.fn((config) => config),
  withAndroidManifest: jest.fn(async (config, action) => await action(config)),
  WarningAggregator: { addWarningAndroid: jest.fn() },
}));

const { WarningAggregator, withGradleProperties } = require('@expo/config-plugins');
const withAppsFlyerAndroid = require('../expo/withAppsFlyerAndroid');

const run = async (appAttrs, options = { preferAppsFlyerBackupRules: true }) => {
  const manifest = { $: {}, application: [{ $: { ...appAttrs } }] };
  await withAppsFlyerAndroid({ modResults: { manifest } }, options);
  return manifest.application[0].$;
};

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  WarningAggregator.addWarningAndroid.mockClear();
});
afterEach(() => jest.restoreAllMocks());

test('removes only the stale backup keys from tools:replace and keeps the rest', async () => {
  const attrs = await run({
    'android:dataExtractionRules': '@xml/rules',
    'android:fullBackupContent': '@xml/backup',
    'tools:replace': 'android:dataExtractionRules, android:allowBackup, android:fullBackupContent',
  });
  expect(attrs['android:dataExtractionRules']).toBeUndefined();
  expect(attrs['android:fullBackupContent']).toBeUndefined();
  expect(attrs['tools:replace']).toBe('android:allowBackup');
});

test('deletes tools:replace when only stale keys were listed', async () => {
  const attrs = await run({
    'android:dataExtractionRules': '@xml/rules',
    'tools:replace': 'android:dataExtractionRules',
  });
  expect(attrs['tools:replace']).toBeUndefined();
});

test('leaves tools:replace untouched when it lists no removed key', async () => {
  const attrs = await run({
    'android:dataExtractionRules': '@xml/rules',
    'tools:replace': 'android:allowBackup',
  });
  expect(attrs['tools:replace']).toBe('android:allowBackup');
});

test('does not touch tools:replace or backup attributes by default', async () => {
  const attrs = await run(
    { 'android:dataExtractionRules': '@xml/rules', 'tools:replace': 'android:dataExtractionRules' },
    { preferAppsFlyerBackupRules: false }
  );
  expect(attrs['android:dataExtractionRules']).toBe('@xml/rules');
  expect(attrs['tools:replace']).toBe('android:dataExtractionRules');
  expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
});

test('warns when flag is on but no backup attrs; leaves tools:replace alone', async () => {
  const attrs = await run({
    'tools:replace': 'android:allowBackup',
  });
  expect(attrs['tools:replace']).toBe('android:allowBackup');
  expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
    'withAppsFlyerAndroid',
    expect.stringContaining('preferAppsFlyerBackupRules')
  );
});

test('strips stale keys from tools:replace without spaces', async () => {
  const attrs = await run({
    'android:fullBackupContent': '@xml/backup',
    'tools:replace': 'android:fullBackupContent,android:allowBackup',
  });
  expect(attrs['android:fullBackupContent']).toBeUndefined();
  expect(attrs['tools:replace']).toBe('android:allowBackup');
});

test('second run is a no-op after attrs were already removed', async () => {
  const first = await run({
    'android:dataExtractionRules': '@xml/rules',
    'android:fullBackupContent': '@xml/backup',
    'tools:replace': 'android:dataExtractionRules, android:allowBackup, android:fullBackupContent',
  });
  expect(first['tools:replace']).toBe('android:allowBackup');
  WarningAggregator.addWarningAndroid.mockClear();

  const second = await run({ ...first });
  expect(second['tools:replace']).toBe('android:allowBackup');
  expect(second['android:dataExtractionRules']).toBeUndefined();
  expect(second['android:fullBackupContent']).toBeUndefined();
  expect(WarningAggregator.addWarningAndroid).toHaveBeenCalled();
});

const manifestConfig = () => ({
  modResults: { manifest: { $: {}, application: [{ $: {} }] } },
});

const withGradleProps = (props) => {
  withGradleProperties.mockImplementationOnce((config, action) => {
    action({ ...config, modResults: props });
    return config;
  });
};

test('adds the purchase connector gradle property when it is missing', async () => {
  const props = [];
  withGradleProps(props);
  await withAppsFlyerAndroid(manifestConfig(), { shouldUsePurchaseConnector: true });
  expect(props).toEqual([
    { type: 'property', key: 'appsflyer.enable_purchase_connector', value: 'true' },
  ]);
});

test('does not duplicate an existing purchase connector gradle property', async () => {
  const props = [{ type: 'property', key: 'appsflyer.enable_purchase_connector', value: 'true' }];
  withGradleProps(props);
  await withAppsFlyerAndroid(manifestConfig(), { shouldUsePurchaseConnector: true });
  expect(props).toHaveLength(1);
  expect(console.log).toHaveBeenCalledWith('[AppsFlyerPlugin] Flag already present, no changes made');
});

test('tolerates missing gradle properties when the purchase connector flag is requested', async () => {
  withGradleProps(null);
  await withAppsFlyerAndroid(manifestConfig(), { shouldUsePurchaseConnector: true });
  expect(console.log).not.toHaveBeenCalledWith('[AppsFlyerPlugin] Flag already present, no changes made');
});

test('warns and skips a manifest without an application', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const manifest = { $: {} };
  await withAppsFlyerAndroid({ modResults: { manifest } }, { preferAppsFlyerBackupRules: true });
  expect(console.warn).toHaveBeenCalledWith(
    '[AppsFlyerPlugin] Unexpected manifest structure; skipping modifications'
  );
  expect(manifest.application).toBeUndefined();
});

test('removes the present backup attr and strips the absent sibling key from tools:replace', async () => {
  const attrs = await run({
    'android:dataExtractionRules': '@xml/rules',
    'tools:replace': 'android:dataExtractionRules, android:allowBackup, android:fullBackupContent',
  });
  expect(attrs['android:dataExtractionRules']).toBeUndefined();
  expect(attrs['android:fullBackupContent']).toBeUndefined();
  expect(attrs['tools:replace']).toBe('android:allowBackup');
  expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
});

test('strips a stale backup key from tools:replace even when no backup attr is present', async () => {
  const attrs = await run({
    'tools:replace': 'android:fullBackupContent, android:allowBackup',
  });
  expect(attrs['tools:replace']).toBe('android:allowBackup');
  expect(WarningAggregator.addWarningAndroid).toHaveBeenCalled();
});

test('adds the xmlns:tools namespace when cleaning up backup attrs', async () => {
  const manifest = { $: {}, application: [{ $: { 'android:dataExtractionRules': '@xml/rules' } }] };
  await withAppsFlyerAndroid({ modResults: { manifest } }, { preferAppsFlyerBackupRules: true });
  expect(manifest.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
});
