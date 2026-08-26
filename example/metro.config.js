const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const pluginRoot = path.resolve(__dirname, '..');

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockDir = dir => new RegExp(`^${escapeRegExp(dir)}[/\\\\].*`);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [pluginRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(pluginRoot, 'node_modules'),
    ],
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      react: path.resolve(__dirname, 'node_modules/react'),
    },
    blockList: [
      blockDir(path.resolve(pluginRoot, 'node_modules/react-native')),
      blockDir(path.resolve(pluginRoot, 'node_modules/react')),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
