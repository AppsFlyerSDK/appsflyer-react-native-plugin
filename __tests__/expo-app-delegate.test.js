const fs = require('fs');
const path = require('path');

jest.mock('@expo/config-plugins', () => ({
  withAppDelegate: jest.fn((config, action) => action(config)),
  withDangerousMod: jest.fn((config) => config),
  WarningAggregator: { addWarningIOS: jest.fn() },
}));

const { WarningAggregator } = require('@expo/config-plugins');
const withAppsFlyerIos = require('../expo/withAppsFlyerIos');
const fixture = (sdk) => fs.readFileSync(path.join(__dirname, 'fixtures', 'app-delegates', `expo${sdk}.swift`), 'utf8');
const transform = (contents) => withAppsFlyerIos({ modResults: { language: 'swift', contents } }).modResults.contents;
const occurrences = (source, text) => source.split(text).length - 1;

beforeEach(() => jest.clearAllMocks());

test.each([54, 57, 58])('integrates once with the SDK %s AppDelegate', (sdk) => {
  const output = transform(fixture(sdk));
  for (const call of ['handleLaunchOptions(launchOptions)', 'handleOpen(url, options: options)', 'continueUserActivity(userActivity, restorationHandler: nil)']) {
    expect(occurrences(output, `AppsFlyerAttribution.shared.${call}`)).toBe(1);
  }
  expect(occurrences(output, 'open url: URL')).toBe(1);
  expect(occurrences(output, 'continue userActivity: NSUserActivity')).toBe(1);
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
  expect(transform(input)).toContain('    recordUserActivity(userActivity)');
  expect(occurrences(transform(input), 'open url: URL')).toBe(1);
});

test('does not create a duplicate for custom handler formatting it cannot instrument', () => {
  const input = fixture(57).replace('    open url: URL,', '    open   url: URL,');
  const output = transform(input);
  expect(output).toContain('    open   url: URL,');
  expect(output).not.toContain('    open url: URL,');
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalled();
});

test('fills in only the missing handler', () => {
  const original = fixture(57);
  const start = original.indexOf('  // Linking API');
  const end = original.indexOf('  // Universal Links');
  const output = transform(original.slice(0, start) + original.slice(end));
  expect(occurrences(output, 'open url: URL')).toBe(1);
  expect(occurrences(output, 'continue userActivity: NSUserActivity')).toBe(1);
  expect(output).toContain('let result = RCTLinkingManager.application');
  expect(transform(output)).toBe(output);
});

test('does not invent handlers for an unsupported superclass', () => {
  const input = fixture(58).replace('AppDelegate: ExpoAppDelegate', 'AppDelegate: CustomAppDelegate');
  const output = transform(input);
  expect(output).not.toContain('open url: URL');
  expect(WarningAggregator.addWarningIOS).toHaveBeenCalled();
});
