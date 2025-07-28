const withAppsFlyerIos = require('./withAppsFlyerIos');
const withAppsFlyerAndroid = require('./withAppsFlyerAndroid');

module.exports = function withAppsFlyer(config, { 
  shouldUseStrictMode = false, 
  shouldUsePurchaseConnector = false 
} = {}) {
  config = withAppsFlyerIos(config, { shouldUseStrictMode, shouldUsePurchaseConnector });
  config = withAppsFlyerAndroid(config, { shouldUsePurchaseConnector });
  return config;
};
