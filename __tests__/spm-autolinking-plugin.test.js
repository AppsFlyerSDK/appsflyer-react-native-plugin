const fs = require('fs');
const os = require('os');
const path = require('path');

const libRoot = path.join(__dirname, '..');
const libIos = path.join(libRoot, 'ios');
const plugin = require('../spm/autolinking-plugin');

const REACT = {
	packageRef: { name: 'ReactNative', path: '/abs/rn/xcframeworks', relPath: '../../../../xcframeworks' },
	products: [
		{ name: 'ReactHeaders', package: 'ReactNative' },
		{ name: 'ReactNativeHeaders', package: 'ReactNative' },
		{ name: 'ReactNativeDependenciesHeaders', package: 'ReactNative' },
		{ name: 'ReactAppHeaders', package: 'React-GeneratedCode' },
	],
};

let tmp;
beforeEach(() => {
	tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-spm-'));
});
afterEach(() => {
	fs.rmSync(tmp, { recursive: true, force: true });
});

function makeContext({ pkg = {}, props, react = REACT, appDir = 'ios' } = {}) {
	const projectRoot = path.join(tmp, 'app');
	const appRoot = path.join(projectRoot, appDir);
	const outputDir = path.join(appRoot, 'build', 'generated', 'autolinking');
	fs.mkdirSync(outputDir, { recursive: true });
	fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({ name: 'app', ...pkg }));
	if (props !== undefined) {
		fs.writeFileSync(path.join(appRoot, 'Podfile.properties.json'), JSON.stringify(props));
	}
	return {
		appRoot,
		projectRoot,
		reactNativeRoot: path.join(projectRoot, 'node_modules', 'react-native'),
		autolinking: {},
		outputDir,
		react,
	};
}

const packageDir = (ctx) => path.join(ctx.outputDir, 'react-native-appsflyer');
const readManifest = (ctx) => fs.readFileSync(path.join(packageDir(ctx), 'Package.swift'), 'utf8');

function generate(options) {
	const ctx = makeContext(options);
	const result = plugin(ctx);
	return { ctx, result, manifest: readManifest(ctx) };
}

const settings = (values) => ({ 'react-native-appsflyer': values });

function podspecVersion(dependency) {
	const podspec = fs.readFileSync(path.join(libRoot, 'react-native-appsflyer.podspec'), 'utf8');
	const escaped = dependency.replace(/[/]/g, '\\/');
	const match = podspec.match(new RegExp(`s\\.dependency\\s+'${escaped}',\\s*'([^']+)'`));
	expect(match).not.toBeNull();
	return match[1];
}

describe('settings', () => {
	test('default to the regular SDK without PurchaseConnector', () => {
		const { manifest } = generate();
		expect(manifest).toContain('.package(url: "https://github.com/AppsFlyerSDK/appsflyer-apple-rpc.git", exact: "7.0.41")');
		expect(manifest).toContain('.product(name: "AppsFlyerRPC", package: "appsflyer-apple-rpc")');
		expect(manifest).toContain('.package(url: "https://github.com/AppsFlyerSDK/AppsFlyerFramework.git", exact: "7.0.4")');
		expect(manifest).toContain('.product(name: "AppsFlyerLib", package: "AppsFlyerFramework")');
		expect(manifest).not.toContain('purchase-connector');
		expect(manifest).not.toContain('Strict');
		expect(manifest).not.toContain('AFSDK_NO_IDFA');
	});

	test('purchaseConnector from package.json adds PurchaseConnector and the SDK package it pins', () => {
		const { manifest } = generate({ pkg: settings({ purchaseConnector: true }) });
		expect(manifest).toContain(
			'.package(url: "https://github.com/AppsFlyerSDK/appsflyer-apple-purchase-connector.git", exact: "7.0.4")'
		);
		expect(manifest).toContain('.product(name: "PurchaseConnector", package: "appsflyer-apple-purchase-connector")');
		expect(manifest).toContain('.package(url: "https://github.com/AppsFlyerSDK/AppsFlyerFramework-Static.git", exact: "7.0.4")');
		expect(manifest).toContain('.product(name: "AppsFlyerLib-Static", package: "AppsFlyerFramework-Static")');
		expect(manifest).not.toContain('AppsFlyerFramework.git');
		expect(manifest).toContain('.product(name: "AppsFlyerRPC", package: "appsflyer-apple-rpc")');
	});

	test('strictMode from package.json switches to the strict SDK and defines AFSDK_NO_IDFA', () => {
		const { manifest } = generate({ pkg: settings({ strictMode: true }) });
		expect(manifest).toContain('.product(name: "AppsFlyerRPCStrict", package: "appsflyer-apple-rpc")');
		expect(manifest).toContain('.package(url: "https://github.com/AppsFlyerSDK/AppsFlyerFramework-Strict.git", exact: "7.0.4")');
		expect(manifest).toContain('.product(name: "AppsFlyerLib-Strict", package: "AppsFlyerFramework-Strict")');
		expect(manifest).not.toContain('AppsFlyerFramework.git');
		expect(manifest).not.toContain('"AppsFlyerRPC", package');
		expect(manifest.match(/\.define\("AFSDK_NO_IDFA", to: "1"\)/g)).toHaveLength(2);
	});

	test('fall back to Podfile.properties.json string values', () => {
		const { manifest } = generate({ props: { 'appsflyer.strictMode': 'true', 'appsflyer.purchaseConnector': 'false' } });
		expect(manifest).toContain('AppsFlyerLib-Strict');
		expect(manifest).not.toContain('PurchaseConnector');
	});

	test('package.json wins over Podfile.properties.json, key by key', () => {
		const { manifest } = generate({
			pkg: settings({ strictMode: false }),
			props: { 'appsflyer.strictMode': 'true', 'appsflyer.purchaseConnector': 'true' },
		});
		expect(manifest).not.toContain('Strict');
		expect(manifest).toContain('.product(name: "PurchaseConnector", package: "appsflyer-apple-purchase-connector")');
	});

	test('a non-boolean package.json value throws, naming the key and the file', () => {
		const ctx = makeContext({ pkg: settings({ strictMode: 'yes' }) });
		expect(() => plugin(ctx)).toThrow(/strictMode/);
		expect(() => plugin(ctx)).toThrow(path.join(ctx.projectRoot, 'package.json'));
	});

	test('a non-object react-native-appsflyer section throws, naming the file', () => {
		const ctx = makeContext({ pkg: { 'react-native-appsflyer': true } });
		expect(() => plugin(ctx)).toThrow(path.join(ctx.projectRoot, 'package.json'));
	});

	test('a Podfile.properties.json value other than "true"/"false" throws, naming the key and the file', () => {
		const ctx = makeContext({ props: { 'appsflyer.purchaseConnector': true } });
		expect(() => plugin(ctx)).toThrow(/appsflyer\.purchaseConnector/);
		expect(() => plugin(ctx)).toThrow(path.join(ctx.appRoot, 'Podfile.properties.json'));
	});

	test('a null react-native-appsflyer section throws, naming the file', () => {
		const ctx = makeContext({ pkg: { 'react-native-appsflyer': null } });
		expect(() => plugin(ctx)).toThrow(path.join(ctx.projectRoot, 'package.json'));
	});

	test('an invalid Podfile.properties.json value throws even when package.json sets the same key', () => {
		const ctx = makeContext({ pkg: settings({ strictMode: false }), props: { 'appsflyer.strictMode': 'yes' } });
		expect(() => plugin(ctx)).toThrow(/appsflyer\.strictMode/);
		expect(() => plugin(ctx)).toThrow(path.join(ctx.appRoot, 'Podfile.properties.json'));
	});

	test('reads Podfile.properties.json from the Xcode project folder React Native passes as appRoot', () => {
		const ctx = makeContext({ appDir: 'native', props: { 'appsflyer.strictMode': 'true' } });
		fs.mkdirSync(path.join(ctx.projectRoot, 'ios'));
		fs.writeFileSync(
			path.join(ctx.projectRoot, 'ios', 'Podfile.properties.json'),
			JSON.stringify({ 'appsflyer.purchaseConnector': 'true' })
		);
		const result = plugin(ctx);
		expect(readManifest(ctx)).toContain('AppsFlyerLib-Strict');
		expect(readManifest(ctx)).not.toContain('PurchaseConnector');
		expect(result.watchPaths).toContain(path.join(ctx.appRoot, 'Podfile.properties.json'));
		expect(result.watchPaths).not.toContain(path.join(ctx.projectRoot, 'ios', 'Podfile.properties.json'));
	});

	test.each([
		['null', 'null'],
		['an array', '[]'],
		['a number', '1'],
	])('a package.json that holds %s throws, naming the file', (_, json) => {
		const ctx = makeContext();
		const file = path.join(ctx.projectRoot, 'package.json');
		fs.writeFileSync(file, json);
		expect(() => plugin(ctx)).toThrow(file);
	});

	test.each([
		['null', 'null'],
		['an array', '[]'],
		['a number', '1'],
	])('a Podfile.properties.json that holds %s throws, naming the file', (_, json) => {
		const ctx = makeContext();
		const file = path.join(ctx.appRoot, 'Podfile.properties.json');
		fs.writeFileSync(file, json);
		expect(() => plugin(ctx)).toThrow(file);
	});

	test('strictMode with purchaseConnector throws and says why', () => {
		const ctx = makeContext({ pkg: settings({ strictMode: true, purchaseConnector: true }) });
		expect(() => plugin(ctx)).toThrow(/cannot be combined/);
		expect(() => plugin(ctx)).toThrow(/PurchaseConnector requires the non-strict AppsFlyer SDK/);
	});
});

describe('manifest', () => {
	test('declares the platform, the Swift module and the ObjC target that depends on it', () => {
		const { manifest } = generate();
		expect(manifest).toMatch(/^\/\/ swift-tools-version: 6\.0\n/);
		expect(manifest).toContain('platforms: [.iOS("15.1")]');
		expect(manifest).toContain(
			'.library(name: "react-native-appsflyer", targets: ["react_native_appsflyer", "RNAppsFlyer"])'
		);
		expect(manifest).toMatch(/\.target\(\s*name: "react_native_appsflyer",/);
		expect(manifest).toMatch(/\.target\(\s*name: "RNAppsFlyer",\s*dependencies: \[\s*"react_native_appsflyer",/);
		expect(manifest).toContain('.swiftLanguageMode(.v5)');
		expect(manifest).toContain('cxxLanguageStandard: .cxx20');
	});

	test('sets the React Native defines', () => {
		const { manifest } = generate();
		expect(manifest).toContain('.define("RCT_NEW_ARCH_ENABLED", to: "1")');
		expect(manifest).toContain('.define("DEBUG", .when(configuration: .debug))');
		expect(manifest).toContain('.define("NDEBUG", .when(configuration: .release))');
		expect(manifest).toContain('swiftSettings: [.define("RCT_NEW_ARCH_ENABLED"), .swiftLanguageMode(.v5)]');
	});

	test('passes no build-setting macros, which SwiftPM rejects', () => {
		expect(generate().manifest).not.toContain('$(');
	});

	test('depends on React exactly as context.react describes it', () => {
		const { ctx, manifest } = generate();
		expect(manifest).toContain('.package(name: "ReactNative", path: "/abs/rn/xcframeworks")');
		expect(manifest).toContain(`.package(name: "React-GeneratedCode", path: "${path.join(ctx.appRoot, 'build', 'generated', 'ios')}")`);
		for (const product of REACT.products) {
			expect(manifest).toContain(`.product(name: "${product.name}", package: "${product.package}")`);
		}
	});

	test('omits React-GeneratedCode when no React product lives in it', () => {
		const react = { ...REACT, products: REACT.products.filter((p) => p.package === 'ReactNative') };
		const { manifest } = generate({ react });
		expect(manifest).not.toContain('React-GeneratedCode');
	});

	test('renders a url-shaped React package reference', () => {
		const react = {
			packageRef: { name: 'react-native-spm', url: 'https://example.com/react-native-spm.git', version: '0.88.0' },
			products: [{ name: 'ReactHeaders', package: 'react-native-spm' }],
		};
		const { manifest } = generate({ react });
		expect(manifest).toContain('.package(url: "https://example.com/react-native-spm.git", exact: "0.88.0")');
		expect(manifest).toContain('.product(name: "ReactHeaders", package: "react-native-spm")');
	});

	test('escapes quotes and backslashes in the paths it writes into Swift strings', () => {
		const swiftEscaped = (text) => text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		const react = { ...REACT, packageRef: { name: 'ReactNative', path: '/abs/a "quoted" \\ path' } };
		const { ctx, manifest } = generate({ react, appDir: 'i"os' });
		expect(manifest).toContain('.package(name: "ReactNative", path: "/abs/a \\"quoted\\" \\\\ path")');
		const codegenPath = path.join(ctx.appRoot, 'build', 'generated', 'ios');
		expect(manifest).toContain(`.package(name: "React-GeneratedCode", path: "${swiftEscaped(codegenPath)}")`);
	});

	test('throws a clear error when React Native passes no React package', () => {
		const ctx = makeContext({ react: null });
		expect(() => plugin(ctx)).toThrow(/react-native-appsflyer.*React/);
	});

	test('pins the same AppsFlyer versions as the podspec', () => {
		const regular = generate().manifest;
		expect(regular).toContain(`appsflyer-apple-rpc.git", exact: "${podspecVersion('AppsFlyerRPC')}")`);
		fs.rmSync(tmp, { recursive: true, force: true });
		fs.mkdirSync(tmp);
		const strict = generate({ pkg: settings({ strictMode: true }) }).manifest;
		expect(strict).toContain(`appsflyer-apple-rpc.git", exact: "${podspecVersion('AppsFlyerRPC/Strict')}")`);
		fs.rmSync(tmp, { recursive: true, force: true });
		fs.mkdirSync(tmp);
		const connector = generate({ pkg: settings({ purchaseConnector: true }) }).manifest;
		expect(connector).toContain(
			`appsflyer-apple-purchase-connector.git", exact: "${podspecVersion('PurchaseConnector')}")`
		);
	});
});

describe('generated tree', () => {
	const libFiles = (pattern) => fs.readdirSync(libIos).filter((f) => pattern.test(f)).sort();
	const sourcesDir = (ctx, target) => path.join(packageDir(ctx), 'Sources', target);

	function expectLinks(dir, files, otherEntries = []) {
		expect(fs.readdirSync(dir).sort()).toEqual([...files, ...otherEntries].sort());
		for (const file of files) {
			const link = path.join(dir, file);
			expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
			expect(fs.realpathSync(link)).toBe(fs.realpathSync(path.join(libIos, file)));
		}
	}

	test('links each Swift and ObjC source file into its target folder', () => {
		const { ctx } = generate();
		expectLinks(sourcesDir(ctx, 'react_native_appsflyer'), libFiles(/\.swift$/));
		const objc = libFiles(/\.(h|m|mm)$/).filter((f) => !f.endsWith('-Bridging-Header.h'));
		expect(objc).toEqual(['PCAppsFlyer.h', 'PCAppsFlyer.m', 'RNAppsFlyer.h', 'RNAppsFlyer.mm']);
		expectLinks(sourcesDir(ctx, 'RNAppsFlyer'), objc, ['include']);
	});

	test('gives the ObjC target the empty include folder SwiftPM requires for public headers', () => {
		const { ctx } = generate();
		plugin(ctx);
		const include = path.join(sourcesDir(ctx, 'RNAppsFlyer'), 'include');
		expect(fs.lstatSync(include).isDirectory()).toBe(true);
		expect(fs.readdirSync(include)).toEqual([]);
	});

	test('a second run rewrites nothing and produces the same bytes', () => {
		const { ctx, manifest } = generate();
		const manifestPath = path.join(packageDir(ctx), 'Package.swift');
		const past = new Date('2020-01-01T00:00:00Z');
		fs.utimesSync(manifestPath, past, past);
		const swiftLink = path.join(sourcesDir(ctx, 'react_native_appsflyer'), 'RNAppsFlyerImpl.swift');
		const linkInode = fs.lstatSync(swiftLink).ino;

		plugin(ctx);

		expect(readManifest(ctx)).toBe(manifest);
		expect(fs.statSync(manifestPath).mtimeMs).toBe(past.getTime());
		expect(fs.lstatSync(swiftLink).ino).toBe(linkInode);
	});

	test('a re-run removes stale entries from the target folders', () => {
		const { ctx } = generate();
		const stale = path.join(sourcesDir(ctx, 'RNAppsFlyer'), 'Removed.m');
		fs.symlinkSync(path.join(libIos, 'gone.m'), stale);
		plugin(ctx);
		expect(fs.lstatSync(stale, { throwIfNoEntry: false })).toBeUndefined();
	});

	test('writes only its own folder under outputDir', () => {
		const { ctx } = generate();
		expect(fs.readdirSync(ctx.outputDir)).toEqual(['react-native-appsflyer']);
	});

	test('returns the package, its product, and the settings files, source folder and plugin to watch', () => {
		const { ctx, result } = generate();
		expect(result).toEqual({
			packageDependencies: [{ name: 'react-native-appsflyer', path: packageDir(ctx) }],
			productDependencies: [{ name: 'react-native-appsflyer', package: 'react-native-appsflyer' }],
			watchPaths: [
				path.join(ctx.appRoot, 'Podfile.properties.json'),
				path.join(ctx.projectRoot, 'package.json'),
				fs.realpathSync(libIos),
				fs.realpathSync(path.join(libRoot, 'spm', 'autolinking-plugin.js')),
			],
		});
	});

	test('replaces a hard-linked Package.swift instead of writing through the link', () => {
		const { ctx } = generate();
		const outside = path.join(tmp, 'Outside.swift');
		fs.linkSync(path.join(packageDir(ctx), 'Package.swift'), outside);
		const before = fs.readFileSync(outside, 'utf8');
		fs.writeFileSync(path.join(ctx.projectRoot, 'package.json'), JSON.stringify(settings({ strictMode: true })));

		plugin(ctx);

		expect(fs.readFileSync(outside, 'utf8')).toBe(before);
		expect(readManifest(ctx)).toContain('AppsFlyerLib-Strict');
		expect(fs.readdirSync(packageDir(ctx)).sort()).toEqual(['Package.swift', 'Sources']);
	});

	test('links only regular files, never folders or symlinks with a source extension', () => {
		const lib = path.join(tmp, 'lib');
		const libSources = path.join(lib, 'ios');
		fs.mkdirSync(path.join(lib, 'spm'), { recursive: true });
		fs.mkdirSync(path.join(libSources, 'Folder.swift'), { recursive: true });
		fs.copyFileSync(path.join(libRoot, 'spm', 'autolinking-plugin.js'), path.join(lib, 'spm', 'autolinking-plugin.js'));
		for (const file of ['Impl.swift', 'Module.h', 'Module.m']) {
			fs.writeFileSync(path.join(libSources, file), '');
		}
		fs.symlinkSync(path.join(libSources, 'Impl.swift'), path.join(libSources, 'Alias.swift'));
		fs.symlinkSync(path.join(libSources, 'Module.m'), path.join(libSources, 'Alias.mm'));
		const ctx = makeContext();

		// Plain Node: Jest's transform would add imports that the temp folder cannot resolve.
		require('child_process').execFileSync(process.execPath, [
			'-e',
			'const [plugin, context] = process.argv.slice(1); require(plugin)(JSON.parse(context));',
			path.join(lib, 'spm', 'autolinking-plugin.js'),
			JSON.stringify(ctx),
		]);

		expect(fs.readdirSync(sourcesDir(ctx, 'react_native_appsflyer'))).toEqual(['Impl.swift']);
		expect(fs.readdirSync(sourcesDir(ctx, 'RNAppsFlyer')).sort()).toEqual(['Module.h', 'Module.m', 'include']);
	});

	describe('never writes or deletes through a symlink in its own output', () => {
		function outsideDir() {
			const dir = path.join(tmp, 'outside');
			fs.mkdirSync(dir);
			fs.writeFileSync(path.join(dir, 'keep.txt'), 'keep');
			return dir;
		}

		test.each([
			['package folder', (ctx) => packageDir(ctx)],
			['Sources folder', (ctx) => path.join(packageDir(ctx), 'Sources')],
			['Swift target folder', (ctx) => sourcesDir(ctx, 'react_native_appsflyer')],
			['ObjC target folder', (ctx) => sourcesDir(ctx, 'RNAppsFlyer')],
			['include folder', (ctx) => path.join(sourcesDir(ctx, 'RNAppsFlyer'), 'include')],
		])('replaces a symlinked %s with a real folder', (_, location) => {
			const ctx = makeContext();
			const outside = outsideDir();
			const link = location(ctx);
			fs.mkdirSync(path.dirname(link), { recursive: true });
			fs.symlinkSync(outside, link);

			plugin(ctx);

			expect(fs.lstatSync(link).isDirectory()).toBe(true);
			expect(fs.readdirSync(outside)).toEqual(['keep.txt']);
			expect(fs.readdirSync(sourcesDir(ctx, 'RNAppsFlyer'))).toContain('RNAppsFlyer.mm');
		});

		test('replaces a symlinked Package.swift with a real file', () => {
			const ctx = makeContext();
			const outside = path.join(tmp, 'Outside.swift');
			fs.writeFileSync(outside, 'keep');
			fs.mkdirSync(packageDir(ctx), { recursive: true });
			fs.symlinkSync(outside, path.join(packageDir(ctx), 'Package.swift'));

			plugin(ctx);

			expect(fs.lstatSync(path.join(packageDir(ctx), 'Package.swift')).isFile()).toBe(true);
			expect(fs.readFileSync(outside, 'utf8')).toBe('keep');
		});

		test('replaces a file where a folder belongs and a folder where Package.swift belongs', () => {
			const ctx = makeContext();
			fs.mkdirSync(path.join(packageDir(ctx), 'Package.swift'), { recursive: true });
			fs.writeFileSync(path.join(packageDir(ctx), 'Sources'), 'not a folder');

			plugin(ctx);

			expect(fs.lstatSync(path.join(packageDir(ctx), 'Package.swift')).isFile()).toBe(true);
			expect(fs.lstatSync(path.join(packageDir(ctx), 'Sources')).isDirectory()).toBe(true);
		});

		test('removes a stale symlink to a folder without deleting what it points at', () => {
			const { ctx } = generate();
			const outside = outsideDir();
			fs.symlinkSync(outside, path.join(sourcesDir(ctx, 'RNAppsFlyer'), 'Stale'));

			plugin(ctx);

			expect(fs.readdirSync(sourcesDir(ctx, 'RNAppsFlyer'))).not.toContain('Stale');
			expect(fs.readdirSync(outside)).toEqual(['keep.txt']);
		});
	});
});

// Under SwiftPM, Objective-C++ cannot reach the generated react_native_appsflyer-Swift.h,
// so RNAppsFlyer.mm declares the Swift API it calls. Nothing compiles one against the other.
describe('RNAppsFlyer.mm SwiftPM fallback', () => {
	const read = (file) => fs.readFileSync(path.join(libIos, file), 'utf8');
	const fallback = () => {
		const match = read('RNAppsFlyer.mm').match(
			/#elif defined\(SWIFT_PACKAGE\)\n(?:\/\/.*\n)*(@interface RNAppsFlyerImpl : NSObject\n[\s\S]*?@end)\n#else\n/
		);
		expect(match).not.toBeNull();
		return match[1];
	};

	test('declares the API only under SwiftPM and keeps the CocoaPods imports as they were', () => {
		expect(read('RNAppsFlyer.mm')).toMatch(
			/^#import "RNAppsFlyer.h"\n\n#if __has_include\("react_native_appsflyer-Swift.h"\)\n#import "react_native_appsflyer-Swift.h"\n#elif defined\(SWIFT_PACKAGE\)\n[\s\S]*?\n#else\n#import <react_native_appsflyer\/react_native_appsflyer-Swift.h>\n#endif\n/
		);
	});

	test('declares the initializer RNAppsFlyerImpl.swift exports', () => {
		expect(read('RNAppsFlyerImpl.swift')).toMatch(/@objc public init\(eventEmitter: @escaping \(String\) -> Void\)/);
		expect(fallback()).toContain('- (instancetype)initWithEventEmitter:(void (^)(NSString *))eventEmitter;');
	});

	test('declares the executeRpc method RNAppsFlyerImpl.swift exports', () => {
		expect(read('RNAppsFlyerImpl.swift')).toMatch(
			/@objc public func executeRpc\(\s*_ requestJson: String,\s*resolve: @escaping RCTPromiseResolveBlock,\s*reject: @escaping RCTPromiseRejectBlock\s*\)/
		);
		expect(fallback()).toContain(
			'- (void)executeRpc:(NSString *)requestJson resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;'
		);
	});

	test('declares nothing else', () => {
		expect(fallback().match(/^[-+] /gm)).toHaveLength(2);
	});
});

test('RNAppsFlyerImpl.swift imports React only under SwiftPM, so CocoaPods never builds the React module', () => {
	const source = fs.readFileSync(path.join(libIos, 'RNAppsFlyerImpl.swift'), 'utf8');
	expect(source).toMatch(/#if SWIFT_PACKAGE\nimport React\n#endif/);
	expect(source.match(/^import React$/gm)).toHaveLength(1);
	expect(source).not.toContain('canImport(React)');
});

test('PCAppsFlyer.m imports the Swift module only under SwiftPM and keeps its CocoaPods branches as they were', () => {
	const source = fs.readFileSync(path.join(libIos, 'PCAppsFlyer.m'), 'utf8');
	expect(source).toContain(
		'// Try modular import path first (for newer CocoaPods configurations)\n' +
			'#if __has_include(<react_native_appsflyer/react_native_appsflyer-Swift.h>)\n' +
			'#import <react_native_appsflyer/react_native_appsflyer-Swift.h>\n' +
			'#elif __has_include(<react_native_appsflyer-Swift.h>)\n' +
			'// Fallback to legacy import path (for older CocoaPods configurations)\n' +
			'#import <react_native_appsflyer-Swift.h>\n' +
			'#elif defined(SWIFT_PACKAGE)\n'
	);
	expect(source).toMatch(
		/#elif defined\(SWIFT_PACKAGE\)\n(?:\/\/.*\n)*@import react_native_appsflyer;\n#else\n#warning "react_native_appsflyer Swift header not found"\n#endif\n/
	);
});

describe('declaration', () => {
	test('package.json and react-native.config.js both point at the plugin', () => {
		const pkg = require('../package.json');
		const rnConfig = require('../react-native.config.js');
		expect(pkg.swiftpmConfig).toEqual({ autolinkingPlugin: './spm/autolinking-plugin.js' });
		expect(rnConfig.spm).toEqual({ autolinkingPlugin: './spm/autolinking-plugin.js' });
		expect(require(path.join(libRoot, pkg.swiftpmConfig.autolinkingPlugin))).toBe(plugin);
	});
});
