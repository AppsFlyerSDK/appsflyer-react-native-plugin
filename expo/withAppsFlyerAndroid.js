module.exports = function withAppsFlyerAndroid(config, { 
  shouldUsePurchaseConnector = false 
} = {}) {
  
  if (shouldUsePurchaseConnector) {
    if (!config.android) {
      config.android = {};
    }
    
    if (!config.android.gradleProperties) {
      config.android.gradleProperties = {};
    }
    
    // Enable AppsFlyer Purchase Connector for Android
    config.android.gradleProperties['appsflyer.enable_purchase_connector'] = 'true';
  }
  
  return config;
}; 