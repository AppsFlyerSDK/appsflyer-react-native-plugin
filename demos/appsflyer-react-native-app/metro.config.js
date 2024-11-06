/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const localPackagePaths = [
  'your path for local testing the package',
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
    nodeModulesPaths: [...localPackagePaths], // update to resolver
  },
  watchFolders: [...localPackagePaths], // update to watch
};
