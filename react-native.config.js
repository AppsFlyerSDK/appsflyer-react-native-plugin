const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: [
          'import com.appsflyer.reactnative.RNAppsFlyerPackage;',
          'import com.appsflyer.reactnative.PCAppsFlyerPackage;',
        ].join('\n'),
        packageInstance: [
          'new RNAppsFlyerPackage()',
          'new PCAppsFlyerPackage()',
        ].join(',\n'),
      },
    },
  },
};
