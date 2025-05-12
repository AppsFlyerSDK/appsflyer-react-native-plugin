/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');

const localPackagePaths = [
  path.resolve(__dirname, '../../'), // Path to `react-native-appsflyer`
];

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), ...localPackagePaths],
    extraNodeModules: {
      'react-native-appsflyer': path.resolve(__dirname, '../../'),
    },
  },
  watchFolders: [...localPackagePaths],
};