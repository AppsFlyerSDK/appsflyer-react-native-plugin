const withAppsFlyerIos = require('./withAppsFlyerIos');
const withAppsFlyerAndroid = require('./withAppsFlyerAndroid');

module.exports = function withAppsFlyer(config, { 
  shouldUseStrictMode = false, 
  shouldUsePurchaseConnector = false,
  preferAppsFlyerBackupRules = false
} = {}) {
  config = withAppsFlyerIos(config, { shouldUseStrictMode, shouldUsePurchaseConnector });
  config = withAppsFlyerAndroid(config, { shouldUsePurchaseConnector, preferAppsFlyerBackupRules });
  return config;
};