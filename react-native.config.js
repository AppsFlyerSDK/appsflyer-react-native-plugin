const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.appsflyer.reactnative.RNAppsFlyerPackage;',
        packageInstance: 'new RNAppsFlyerPackage()',
      },
    },
  },
};
