const withAppsFlyerIos = require('./withAppsFlyerIos');
const withAppsFlyerAndroid = require('./withAppsFlyerAndroid');
console.log('[AppsFlyerPlugin] Main plugin loaded');

module.exports = function withAppsFlyer(config, { 
  shouldUseStrictMode = false, 
  shouldUsePurchaseConnector = false 
} = {}) {
  config = withAppsFlyerIos(config, { shouldUseStrictMode, shouldUsePurchaseConnector });
  config = withAppsFlyerAndroid(config, { shouldUsePurchaseConnector });
  return config;
};
