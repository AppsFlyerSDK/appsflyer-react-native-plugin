/**
 * React Native SwiftPM autolinking plugin for react-native-appsflyer.
 *
 * React Native calls it synchronously on every SwiftPM sync. It writes a
 * Package.swift for this library under `<outputDir>/react-native-appsflyer`
 * that builds the Swift module `react_native_appsflyer` and the Objective-C
 * TurboModule target against the AppsFlyer SDK variant the app selects:
 *
 *   package.json:            "react-native-appsflyer": { "strictMode": true, "purchaseConnector": false }
 *   ios/Podfile.properties.json: "appsflyer.strictMode": "true", "appsflyer.purchaseConnector": "false"
 *
 * package.json wins, key by key. Both default to false.
 */

/* global __filename */
'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'react-native-appsflyer';
const SWIFT_TARGET = 'react_native_appsflyer';
const OBJC_TARGET = 'RNAppsFlyer';
const REACT_CODEGEN_PACKAGE = 'React-GeneratedCode';
const LIB_IOS_DIR = path.join(__dirname, '..', 'ios');

// rpc and purchaseConnector must match react-native-appsflyer.podspec; a Jest test fails when they drift.
// rpc and sdk move together: AppsFlyerRPC 7.0.41 pins AppsFlyerFramework 7.0.4.
const VERSIONS = { rpc: '7.0.41', sdk: '7.0.4', purchaseConnector: '7.0.4' };

const SETTINGS = [
  { name: 'purchaseConnector', property: 'appsflyer.purchaseConnector' },
  { name: 'strictMode', property: 'appsflyer.strictMode' },
];

module.exports = function plugin(context) {
  const packageJsonPath = path.join(context.projectRoot, 'package.json');
  const propertiesPath = path.join(context.appRoot, 'Podfile.properties.json');
  const settings = readSettings(packageJsonPath, propertiesPath);
  if (settings.strictMode && settings.purchaseConnector) {
    throw new Error(
      `${PACKAGE_NAME}: strictMode and purchaseConnector cannot be combined under SwiftPM. ` +
        'PurchaseConnector requires the non-strict AppsFlyer SDK: its package pins AppsFlyerFramework-Static, ' +
        'and SwiftPM cannot build that next to AppsFlyerFramework-Strict because both declare a target named AppsFlyerLib.'
    );
  }

  const packageDir = path.join(context.outputDir, PACKAGE_NAME);
  ensureDir(packageDir);
  ensureDir(path.join(packageDir, 'Sources'));
  const sources = fs
    .readdirSync(LIB_IOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  linkSources(
    path.join(packageDir, 'Sources', SWIFT_TARGET),
    sources.filter((file) => file.endsWith('.swift'))
  );
  // SwiftPM has no bridging headers; the Swift target imports React instead.
  // The headers stay private, but SwiftPM rejects a C target without its public "include" folder.
  linkSources(
    path.join(packageDir, 'Sources', OBJC_TARGET),
    sources.filter((file) => /\.(h|m|mm)$/.test(file) && !file.endsWith('-Bridging-Header.h')),
    ['include']
  );
  writeIfChanged(
    path.join(packageDir, 'Package.swift'),
    renderManifest({
      appsFlyer: appsFlyerPackages(settings),
      react: reactDependencies(context.react, context.outputDir),
      strictMode: settings.strictMode,
    })
  );

  return {
    packageDependencies: [{ name: PACKAGE_NAME, path: packageDir }],
    productDependencies: [{ name: PACKAGE_NAME, package: PACKAGE_NAME }],
    // React Native watches neither a plugin host's sources nor its plugin, so adding a source
    // or changing a pin here would not re-sync.
    watchPaths: [propertiesPath, packageJsonPath, fs.realpathSync(LIB_IOS_DIR), fs.realpathSync(__filename)],
  };
};

function readSettings(packageJsonPath, propertiesPath) {
  const packageJson = readJsonObject(packageJsonPath);
  const section = PACKAGE_NAME in packageJson ? packageJson[PACKAGE_NAME] : {};
  if (!isObject(section)) {
    throw new Error(
      `${PACKAGE_NAME}: "${PACKAGE_NAME}" in ${packageJsonPath} must be an object such as { "strictMode": true }.`
    );
  }
  const properties = fs.existsSync(propertiesPath) ? readJsonObject(propertiesPath) : {};

  const settings = {};
  for (const { name, property } of SETTINGS) {
    const value = section[name];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new Error(
        `${PACKAGE_NAME}: "${PACKAGE_NAME}.${name}" in ${packageJsonPath} must be true or false, not ${JSON.stringify(value)}.`
      );
    }
    const fallback = properties[property];
    if (fallback !== undefined && fallback !== 'true' && fallback !== 'false') {
      throw new Error(
        `${PACKAGE_NAME}: "${property}" in ${propertiesPath} must be "true" or "false", not ${JSON.stringify(fallback)}.`
      );
    }
    settings[name] = value ?? fallback === 'true';
  }
  return settings;
}

function readJsonObject(file) {
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${PACKAGE_NAME}: cannot read ${file}: ${error.message}`, { cause: error });
  }
  if (!isObject(json)) {
    throw new Error(`${PACKAGE_NAME}: ${file} must hold a JSON object, not ${JSON.stringify(json)}.`);
  }
  return json;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function appsFlyerPackages({ strictMode, purchaseConnector }) {
  // The three AppsFlyerFramework packages each declare a binary target named AppsFlyerLib,
  // so only one may be in the graph. PurchaseConnector pins AppsFlyerFramework-Static,
  // which ships the same binary as AppsFlyerFramework.
  let sdk = { repo: 'AppsFlyerFramework', product: 'AppsFlyerLib' };
  if (strictMode) {
    sdk = { repo: 'AppsFlyerFramework-Strict', product: 'AppsFlyerLib-Strict' };
  } else if (purchaseConnector) {
    sdk = { repo: 'AppsFlyerFramework-Static', product: 'AppsFlyerLib-Static' };
  }
  const packages = [
    {
      repo: 'appsflyer-apple-rpc',
      product: strictMode ? 'AppsFlyerRPCStrict' : 'AppsFlyerRPC',
      version: VERSIONS.rpc,
    },
    { ...sdk, version: VERSIONS.sdk },
  ];
  if (purchaseConnector) {
    packages.push({
      repo: 'appsflyer-apple-purchase-connector',
      product: 'PurchaseConnector',
      version: VERSIONS.purchaseConnector,
    });
  }
  return packages.map(({ repo, product, version }) => ({
    declaration: `.package(url: ${swiftString(`https://github.com/AppsFlyerSDK/${repo}.git`)}, exact: ${swiftString(version)})`,
    product: productDependency({ name: product, package: repo }),
  }));
}

function reactDependencies(react, outputDir) {
  if (react == null) {
    throw new Error(
      `${PACKAGE_NAME}: React Native passed no React package to depend on (context.react is null), ` +
        `so the SwiftPM package for ${PACKAGE_NAME} cannot be generated.`
    );
  }
  const ref = react.packageRef;
  const declarations = [
    ref.url != null
      ? `.package(url: ${swiftString(ref.url)}, exact: ${swiftString(ref.version)})`
      : `.package(name: ${swiftString(ref.name)}, path: ${swiftString(ref.path)})`,
  ];
  // React Native lists products from its per-app codegen package without a reference to the
  // package itself; it always lives at <outputDir>/../ios.
  if (react.products.some((product) => product.package === REACT_CODEGEN_PACKAGE)) {
    const codegenPath = path.join(outputDir, '..', 'ios');
    declarations.push(`.package(name: ${swiftString(REACT_CODEGEN_PACKAGE)}, path: ${swiftString(codegenPath)})`);
  }
  return { declarations, products: react.products.map(productDependency) };
}

function renderManifest({ appsFlyer, react, strictMode }) {
  const products = [...appsFlyer.map((p) => p.product), ...react.products];
  const cSettings = ['.define("RCT_NEW_ARCH_ENABLED", to: "1")'];
  if (strictMode) {
    cSettings.push('.define("AFSDK_NO_IDFA", to: "1")');
  }
  const cxxSettings = [
    ...cSettings,
    '.define("DEBUG", .when(configuration: .debug))',
    '.define("NDEBUG", .when(configuration: .release))',
  ];
  const list = (items, indent) => items.map((item) => `${indent}${item},`).join('\n');

  return `// swift-tools-version: 6.0
// Generated by ${PACKAGE_NAME}/spm/autolinking-plugin.js on every SwiftPM sync. Do not edit.

import PackageDescription

let package = Package(
    name: "${PACKAGE_NAME}",
    platforms: [.iOS("15.1")],
    products: [
        .library(name: "${PACKAGE_NAME}", targets: ["${SWIFT_TARGET}", "${OBJC_TARGET}"]),
    ],
    dependencies: [
${list([...react.declarations, ...appsFlyer.map((p) => p.declaration)], '        ')}
    ],
    targets: [
        .target(
            name: "${SWIFT_TARGET}",
            dependencies: [
${list(products, '                ')}
            ],
            swiftSettings: [.define("RCT_NEW_ARCH_ENABLED"), .swiftLanguageMode(.v5)]
        ),
        .target(
            name: "${OBJC_TARGET}",
            dependencies: [
${list([`"${SWIFT_TARGET}"`, ...products], '                ')}
            ],
            cSettings: [
${list(cSettings, '                ')}
            ],
            cxxSettings: [
${list(cxxSettings, '                ')}
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

function productDependency(product) {
  return `.product(name: ${swiftString(product.name)}, package: ${swiftString(product.package)})`;
}

function swiftString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// React Native links library sources file by file, never whole directories.
function linkSources(dir, files, emptyDirs = []) {
  ensureDir(dir);
  for (const entry of fs.readdirSync(dir)) {
    if (!files.includes(entry) && !emptyDirs.includes(entry)) {
      remove(path.join(dir, entry));
    }
  }
  for (const emptyDir of emptyDirs) {
    ensureDir(path.join(dir, emptyDir));
  }
  for (const file of files) {
    const link = path.join(dir, file);
    const target = path.join(LIB_IOS_DIR, file);
    if (readLink(link) !== target) {
      remove(link);
      fs.symlinkSync(target, link);
    }
  }
}

// Everything under outputDir/react-native-appsflyer is ours to replace, but a symlink found
// there may point anywhere, so it is unlinked and never followed.
function ensureDir(dir) {
  if (fs.lstatSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    return;
  }
  remove(dir);
  fs.mkdirSync(dir, { recursive: true });
}

function remove(file) {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    fs.rmSync(file, { recursive: true });
  } else if (stat) {
    fs.unlinkSync(file);
  }
}

function readLink(file) {
  try {
    return fs.readlinkSync(file);
  } catch {
    return null;
  }
}

function writeIfChanged(file, content) {
  if (fs.lstatSync(file, { throwIfNoEntry: false })?.isFile()) {
    if (fs.readFileSync(file, 'utf8') === content) {
      return;
    }
  } else {
    remove(file);
  }
  // Renaming replaces the folder entry; writing in place would also change a hard-linked copy.
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, content);
    fs.renameSync(temp, file);
  } catch (error) {
    remove(temp);
    throw error;
  }
}
