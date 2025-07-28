module.exports = function withAppsFlyerAndroid(config, { 
    shouldUsePurchaseConnector = false 
  } = {}) {
  
    if (shouldUsePurchaseConnector) {
      if (!config.android) {
        config.android = {};
      }
  
      if (!config.android.gradleProperties) {
        config.android.gradleProperties = [];
      }
  
      // Prevent duplicates
      const existingKeys = config.android.gradleProperties.map(p => p.key);
      if (!existingKeys.includes('appsflyer.enable_purchase_connector')) {
        config.android.gradleProperties.push({
          key: 'appsflyer.enable_purchase_connector',
          value: 'true',
        });
      }
    }
  
  return config;
}; 