const withAppsFlyerIos = require('./withAppsFlyerIos');

module.exports = function withAppsFlyer(config, { 
  shouldUseStrictMode = false, 
  shouldUsePurchaseConnector = false 
} = {}) {
  config = withAppsFlyerIos(config, { shouldUseStrictMode, shouldUsePurchaseConnector });
  return config;
};
