// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const pluginRoot = path.resolve(__dirname, '../../'); // `react-native-appsflyer`
const localPackagePaths = [pluginRoot];

// Escape a path into a blockList RegExp matching that dir and everything under it.
const blockDir = dir =>
  new RegExp(dir.replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*');

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  ...localPackagePaths,
];
config.resolver.extraNodeModules = {
  // Force a single copy of react-native / react. With the plugin linked via
  // `file:../../`, the plugin root ships its own (older) react-native, so the
  // plugin's NativeEventEmitter would otherwise bind to a second event bus and
  // registerDeepLinkListener / registerConversionListener callbacks would silently never fire
  // (SO#79083213). Local dev only — npm consumers have a single copy.
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-native-appsflyer': pluginRoot,
};
config.resolver.blockList = [
  blockDir(path.resolve(pluginRoot, 'node_modules/react-native')),
  blockDir(path.resolve(pluginRoot, 'node_modules/react')),
];
config.watchFolders = [...localPackagePaths];

module.exports = config;
