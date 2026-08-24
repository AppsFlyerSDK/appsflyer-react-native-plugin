// Regression guard (FR-009): runs scripts/bump-native-deps.sh against real podspec/build.gradle copies so a future restructure that breaks its sed patterns fails CI instead of silently no-op'ing a release.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'bump-native-deps.sh');
const REAL_PODSPEC = path.join(__dirname, '..', 'react-native-appsflyer.podspec');
const REAL_BUILD_GRADLE = path.join(__dirname, '..', 'android', 'build.gradle');

function makeTempCopies() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-native-deps-test-'));
	const podspec = path.join(dir, 'react-native-appsflyer.podspec');
	const buildGradle = path.join(dir, 'build.gradle');
	fs.copyFileSync(REAL_PODSPEC, podspec);
	fs.copyFileSync(REAL_BUILD_GRADLE, buildGradle);
	return { dir, podspec, buildGradle };
}

function runScript(args) {
	return execFileSync(SCRIPT, args, { encoding: 'utf8' });
}

describe('scripts/bump-native-deps.sh', () => {
	const tempDirs = [];

	afterEach(() => {
		while (tempDirs.length) {
			fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
		}
	});

	function trackedTempCopies() {
		const copies = makeTempCopies();
		tempDirs.push(copies.dir);
		return copies;
	}

	test('bumps AppsFlyerRPC, AppsFlyerRPC/Strict, af-android-sdk, and af-android-plugin-bridge independently, leaving purchase-connector untouched', () => {
		const { podspec, buildGradle } = trackedTempCopies();
		const purchaseConnectorBefore = fs
			.readFileSync(buildGradle, 'utf8')
			.match(/purchase-connector:[^']*/)[0];

		runScript([
			'--podspec', podspec,
			'--build-gradle', buildGradle,
			'--ios-sdk-version', '9.9.9',
			'--android-sdk-version', '8.8.8',
			'--android-plugin-bridge-version', '9.9.9',
		]);

		const podspecAfter = fs.readFileSync(podspec, 'utf8');
		const buildGradleAfter = fs.readFileSync(buildGradle, 'utf8');

		expect(podspecAfter).toMatch(/s\.dependency 'AppsFlyerRPC', '9\.9\.9'/);
		expect(podspecAfter).toMatch(/s\.dependency 'AppsFlyerRPC\/Strict', '9\.9\.9'/);
		// af-android-plugin-bridge is pinned outside the BOM (see build.gradle's own comment) —
		// different values here must land on two different lines, not collide on one.
		expect(buildGradleAfter).toMatch(/platform\('com\.appsflyer:af-android-sdk-bom:8\.8\.8'\)/);
		expect(buildGradleAfter).toMatch(/com\.appsflyer:af-android-plugin-bridge:9\.9\.9'/);
		expect(buildGradleAfter).toContain(purchaseConnectorBefore);
	});

	test('leaves a dependency untouched when its flag is omitted, but still bumps the requested one', () => {
		const { podspec, buildGradle } = trackedTempCopies();
		const buildGradleBefore = fs.readFileSync(buildGradle, 'utf8');

		runScript(['--podspec', podspec, '--build-gradle', buildGradle, '--ios-sdk-version', '9.9.9']);

		expect(fs.readFileSync(buildGradle, 'utf8')).toBe(buildGradleBefore);
		expect(fs.readFileSync(podspec, 'utf8')).toMatch(/s\.dependency 'AppsFlyerRPC', '9\.9\.9'/);
	});

	test('leaves the podspec untouched when it has no PurchaseConnector dependency at all', () => {
		const { podspec, buildGradle } = trackedTempCopies();
		// Strip every PurchaseConnector reference (block comment, log line, and dependency line) so
		// the script's `grep -q "PurchaseConnector"` guard actually takes its false branch.
		const podspecBefore = fs
			.readFileSync(podspec, 'utf8')
			.replace(/\n {2}# AppsFlyerPurchaseConnector\n {2}if defined\?\(\$AppsFlyerPurchaseConnector\)[^\n]*\n[^\n]*\n[^\n]*\n {2}end\n/, '\n');
		expect(podspecBefore).not.toContain('PurchaseConnector');
		fs.writeFileSync(podspec, podspecBefore);

		runScript([
			'--podspec', podspec,
			'--build-gradle', buildGradle,
			'--pc-version', '9.9.9',
		]);

		expect(fs.readFileSync(podspec, 'utf8')).toBe(podspecBefore);
	});

	test('exits non-zero with an ::error:: message when a requested pattern does not match its target file', () => {
		const { podspec, buildGradle } = trackedTempCopies();
		const buildGradleBefore = fs
			.readFileSync(buildGradle, 'utf8')
			.replace('af-android-sdk-bom:', 'af-android-sdk-bom-renamed:');
		fs.writeFileSync(buildGradle, buildGradleBefore);

		try {
			runScript([
				'--podspec', podspec,
				'--build-gradle', buildGradle,
				'--android-sdk-version', '9.9.9',
			]);
			throw new Error('expected script to exit non-zero');
		} catch (err) {
			const output = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
			expect(output).toMatch(/::error::af-android-sdk: pattern not found/);
		}

		expect(fs.readFileSync(buildGradle, 'utf8')).toBe(buildGradleBefore);
	});
});
