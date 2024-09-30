/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const localPackagePaths = [
  '/Users/amit.levy/RN-Projects/appsflyer-react-native-plugin',
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
