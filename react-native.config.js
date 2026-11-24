const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.appsflyer.reactnative.RNAppsFlyerPackage;',
        packageInstance: [
          'new RNAppsFlyerPackage()',
          'new com.appsflyer.reactnative.PCAppsFlyerPackage()',
        ].join(',\n'),
      },
    },
  },
  // React Native 0.87 reads the SwiftPM plugin only from here; later versions read package.json's swiftpmConfig.
  spm: {
    autolinkingPlugin: './spm/autolinking-plugin.js',
  },
};
