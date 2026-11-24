const fs = require('fs');
const os = require('os');
const path = require('path');

let mockPodfileMod;
jest.mock('@expo/config-plugins', () => ({
  withAppDelegate: jest.fn((config) => config),
  withDangerousMod: jest.fn((config, [, action]) => {
    mockPodfileMod = action;
    return config;
  }),
  withPodfileProperties: jest.fn((config) => config),
  WarningAggregator: { addWarningIOS: jest.fn() },
}));

const withAppsFlyerIos = require('../expo/withAppsFlyerIos');

let iosDir;
beforeEach(() => {
  iosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'af-expo-'));
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  fs.rmSync(iosDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

function runPodfileMod(options) {
  withAppsFlyerIos({}, options);
  const config = { modRequest: { platformProjectRoot: iosDir } };
  return { config, result: mockPodfileMod(config) };
}

test('skips the Podfile edit when the app has no Podfile', async () => {
  const { config, result } = runPodfileMod({ shouldUseStrictMode: true });
  await expect(result).resolves.toBe(config);
  expect(fs.readdirSync(iosDir)).toEqual([]);
});

test('rethrows a Podfile read error other than a missing file', async () => {
  const podfile = path.join(iosDir, 'Podfile');
  fs.writeFileSync(podfile, "target 'app' do\n  use_expo_modules!\nend\n");
  const readFileSync = fs.readFileSync;
  jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...rest) => {
    if (file === podfile) {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    }
    return readFileSync(file, ...rest);
  });
  await expect(runPodfileMod({}).result).rejects.toMatchObject({ code: 'EACCES' });
});

test('still writes both variant flags into an existing Podfile', async () => {
  const podfile = path.join(iosDir, 'Podfile');
  fs.writeFileSync(podfile, "target 'app' do\n  use_expo_modules!\nend\n");
  await runPodfileMod({ shouldUsePurchaseConnector: true }).result;
  const contents = fs.readFileSync(podfile, 'utf8');
  expect(contents).toContain('$RNAppsFlyerStrictMode=false');
  expect(contents).toContain('$AppsFlyerPurchaseConnector=true');
});
