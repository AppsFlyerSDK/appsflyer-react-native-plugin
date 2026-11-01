const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

jest.mock('@expo/config-plugins', () => ({
  withAppDelegate: jest.fn((config, action) => action(config)),
  withDangerousMod: jest.fn((config) => config),
  WarningAggregator: { addWarningIOS: jest.fn() },
}));

const { WarningAggregator, withDangerousMod } = require('@expo/config-plugins');
const withAppsFlyerIos = require('../expo/withAppsFlyerIos');
const fixture = (sdk) => fs.readFileSync(path.join(__dirname, 'fixtures', 'app-delegates', `expo${sdk}.swift`), 'utf8');
const transform = (contents, language = 'swift') =>
  withAppsFlyerIos({ modResults: { language, contents } }).modResults.contents;
const occurrences = (source, text) => source.split(text).length - 1;

beforeEach(() => jest.clearAllMocks());

test('warns for unsupported AppDelegate language', () => {
  transform(fixture(57), 'kotlin');
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
    'withAppsFlyerAppDelegate',
    'kotlin AppDelegate file is not supported yet'
  );
});

test.each([54, 57, 58])('integrates once with the SDK %s AppDelegate', (sdk) => {
  const output = transform(fixture(sdk));
  expect(occurrences(output, 'import react_native_appsflyer')).toBe(1);
  for (const call of ['handleLaunchOptions(launchOptions)', 'handleOpen(url, options: options)', 'continueUserActivity(userActivity, restorationHandler: nil)']) {
    expect(occurrences(output, `AppsFlyerAttribution.shared.${call}`)).toBe(1);
  }
  expect(occurrences(output, 'open url: URL')).toBe(1);
  expect(occurrences(output, 'continue userActivity: NSUserActivity')).toBe(1);
  if (sdk === 58) {
    const classIdx = output.indexOf('class AppDelegate');
    const openIdx = output.indexOf('open url: URL');
    const launchIdx = output.indexOf('didFinishLaunchingWithOptions');
    expect(classIdx).toBeLessThan(openIdx);
    expect(openIdx).toBeLessThan(launchIdx);
  }
  expect(transform(output)).toBe(output);
  expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
});

test.each([54, 57])('preserves the SDK %s template apart from the attribution calls and import', (sdk) => {
  const original = fixture(sdk);
  const output = transform(original).replace('import react_native_appsflyer\n', '')
    .replace(/^    AppsFlyerAttribution\.shared\..*\n/gm, '');
  expect(output).toBe(original);
});

test('new scene handlers forward arguments and restoration handler to super', () => {
  const output = transform(fixture(58));
  expect(output).toContain('return super.application(app, open: url, options: options)');
  expect(output).toContain('return super.application(application, continue: userActivity, restorationHandler: restorationHandler)');
  expect(output).not.toContain('RCTLinkingManager.application');
});

test('retains custom handler bodies', () => {
  const input = fixture(57).replace('// Linking API', '// Linking API\n  // Custom integration')
    .replace('    let result = RCTLinkingManager', '    recordUserActivity(userActivity)\n    let result = RCTLinkingManager');
  const output = transform(input);
  expect(output).toContain('// Custom integration');
  expect(output).toContain('    recordUserActivity(userActivity)');
  expect(occurrences(output, 'open url: URL')).toBe(1);
});

test('does not create a duplicate for custom handler formatting it cannot instrument', () => {
  const input = fixture(57).replace('    open url: URL,', '    open   url: URL,');
  const output = transform(input);
  expect(output).toContain('    open   url: URL,');
  expect(output).not.toContain('    open url: URL,');
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalled();
});

test.each([
  {
    removed: 'openURL',
    start: '  // Linking API',
    end: '  // Universal Links',
    untouched: 'let result = RCTLinkingManager.application',
    added: 'return super.application(app, open: url, options: options)',
  },
  {
    removed: 'continueUserActivity',
    start: '  // Universal Links',
    end: '\n}\n\nclass ReactNativeDelegate',
    untouched: 'return super.application(app, open: url, options: options) || RCTLinkingManager',
    added: 'return super.application(application, continue: userActivity, restorationHandler: restorationHandler)',
  },
])('fills in only the missing $removed handler', ({ start, end, untouched, added }) => {
  const original = fixture(57);
  const output = transform(original.slice(0, original.indexOf(start)) + original.slice(original.indexOf(end)));
  expect(occurrences(output, 'open url: URL')).toBe(1);
  expect(occurrences(output, 'continue userActivity: NSUserActivity')).toBe(1);
  expect(output).toContain(untouched);
  expect(occurrences(output, added)).toBe(1);
  for (const call of ['handleLaunchOptions(launchOptions)', 'handleOpen(url, options: options)', 'continueUserActivity(userActivity, restorationHandler: nil)']) {
    expect(occurrences(output, `AppsFlyerAttribution.shared.${call}`)).toBe(1);
  }
  expect(transform(output)).toBe(output);
  expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
});

test('matches AppDelegate with spaced superclass colon', () => {
  const input = fixture(58).replace('AppDelegate: ExpoAppDelegate', 'AppDelegate : ExpoAppDelegate');
  const output = transform(input);
  expect(occurrences(output, 'open url: URL')).toBe(1);
  expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
});

const OBJC_DELEGATE = `#import "AppDelegate.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  return YES;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return YES;
}

@end
`;

test.each(['objc', 'objcpp'])('injects attribution calls into an %s AppDelegate once', (language) => {
  const output = transform(OBJC_DELEGATE, language);
  expect(output.startsWith('#import <react_native_appsflyer/react_native_appsflyer-Swift.h>\n')).toBe(true);
  expect(occurrences(output, '[[AppsFlyerAttribution shared] handleLaunchOptions:launchOptions];')).toBe(1);
  expect(occurrences(output, '[[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];')).toBe(1);
  expect(occurrences(output, '[[AppsFlyerAttribution shared] handleOpen:url options:options];')).toBe(1);
  expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
  WarningAggregator.addWarningIOS.mockClear();
  expect(transform(output, language)).toBe(output);
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(3);
});

test('warns when an objc AppDelegate has none of the hooks', () => {
  const output = transform('#import <UIKit/UIKit.h>\n', 'objc');
  expect(output.startsWith('#import <react_native_appsflyer/react_native_appsflyer-Swift.h>\n')).toBe(true);
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(3);
});

function podHeader(tag, newSrc) {
  const hash = crypto.createHash('sha1').update(newSrc).digest('hex');
  return `# @generated begin ${tag} - expo prebuild (DO NOT MODIFY) sync-${hash}`;
}

describe('Podfile flags', () => {
  const podfilePath = path.join('/app/ios', 'Podfile');
  let files;
  let action;

  beforeEach(() => {
    files = {};
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(fs, 'readFileSync').mockImplementation((file, encoding) => {
      if (files[file] != null) return files[file];
      return jest.requireActual('fs').readFileSync(file, encoding);
    });
    jest.spyOn(fs, 'writeFileSync').mockImplementation((file, contents) => {
      files[file] = contents;
    });
    withDangerousMod.mockImplementationOnce((config, mod) => {
      action = mod[1];
      return config;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const runPodfile = async (options) => {
    withAppsFlyerIos({ modResults: { language: 'swift', contents: 'class AppDelegate: ExpoAppDelegate {}' } }, options);
    await action({ modRequest: { platformProjectRoot: '/app/ios' } });
    return files[podfilePath];
  };

  test('writes strict mode and purchase connector flags', async () => {
    files[podfilePath] = 'use_expo_modules!\n';
    const written = await runPodfile({ shouldUseStrictMode: true, shouldUsePurchaseConnector: false });
    expect(written).toContain('$RNAppsFlyerStrictMode=true');
    expect(written).toContain('$AppsFlyerPurchaseConnector=false');
    expect(written).toContain('use_expo_modules!');
  });

  test('skips flags that are already assigned', async () => {
    const original = '$RNAppsFlyerStrictMode=false\n$AppsFlyerPurchaseConnector=true\nuse_expo_modules!\n';
    files[podfilePath] = original;
    const written = await runPodfile({ shouldUseStrictMode: true, shouldUsePurchaseConnector: false });
    expect(written).toBe(original);
    expect(console.log).toHaveBeenCalledWith('INFO: $RNAppsFlyerStrictMode already exists in Podfile, skipping auto-assignment.');
    expect(console.log).toHaveBeenCalledWith('INFO: $AppsFlyerPurchaseConnector already exists in Podfile, skipping auto-assignment.');
  });

  test('stops when the strict mode block is already generated without the flag', async () => {
    files[podfilePath] = `${podHeader('AppsFlyer Strict Mode', '$RNAppsFlyerStrictMode=false')}\nuse_expo_modules!\n`;
    await runPodfile({});
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cannot add AppsFlyer strict mode'));
  });

  test('stops when the purchase connector block is already generated without the flag', async () => {
    files[podfilePath] = [
      '$RNAppsFlyerStrictMode=false',
      podHeader('AppsFlyer Purchase Connector', '$AppsFlyerPurchaseConnector=true'),
      'use_expo_modules!',
    ].join('\n');
    await runPodfile({ shouldUsePurchaseConnector: true });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cannot add AppsFlyer Purchase Connector'));
  });
});

test.each([
  ['unsupported superclass', 'AppDelegate: ExpoAppDelegate', 'AppDelegate: CustomAppDelegate'],
  ['ExpoAppDelegateSubclass', 'AppDelegate: ExpoAppDelegate', 'AppDelegate: ExpoAppDelegateSubclass'],
  ['renamed class', 'class AppDelegate: ExpoAppDelegate', 'class MyAppDelegate: ExpoAppDelegate'],
])('does not invent handlers for %s', (_label, from, to) => {
  const input = fixture(58).replace(from, to);
  const output = transform(input);
  expect(output).not.toContain('open url: URL');
  expect(output).toContain('import react_native_appsflyer');
  expect(output).toContain('AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)');
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalled();
});
