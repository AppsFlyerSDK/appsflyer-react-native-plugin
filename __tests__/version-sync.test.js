// Regression guard: CLAUDE.md documents 3 version literals that must stay in sync
// (package.json is the source of truth; podspec derives from it at pod-install time,
// so it's not a 4th literal — see release-versioning.md §1).
const fs = require('fs');
const path = require('path');

const packageVersion = require('../package.json').version;
const unsuffixedVersion = (packageVersion.match(/^(\d+\.\d+\.\d+)/) || [])[1];

function expectNativeVersion(actual) {
	expect([packageVersion, unsuffixedVersion]).toContain(actual);
}

test('ios/RNAppsFlyer.h kAppsFlyerPluginVersion matches package.json version or unsuffixed X.Y.Z', () => {
	const iosFile = fs.readFileSync(path.join(__dirname, '..', 'ios', 'RNAppsFlyer.h'), 'utf8');
	const match = iosFile.match(/kAppsFlyerPluginVersion\s*=\s*@"([^"]+)"/);
	expect(match).not.toBeNull();
	expectNativeVersion(match[1]);
});

test('RNAppsFlyerConstants.kt PLUGIN_VERSION matches package.json version or unsuffixed X.Y.Z', () => {
	const androidFile = fs.readFileSync(
		path.join(__dirname, '..', 'android', 'src', 'main', 'java', 'com', 'appsflyer', 'reactnative', 'RNAppsFlyerConstants.kt'),
		'utf8'
	);
	const match = androidFile.match(/PLUGIN_VERSION\s*=\s*"([^"]+)"/);
	expect(match).not.toBeNull();
	expectNativeVersion(match[1]);
});
