const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const pluginRoot = path.resolve(__dirname, '..');

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
      new RegExp(
        path.resolve(pluginRoot, 'node_modules/react-native').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*',
      ),
      new RegExp(
        path.resolve(pluginRoot, 'node_modules/react').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*',
      ),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
