const { withGradleProperties, withAndroidManifest } = require('@expo/config-plugins');

function addPurchaseConnectorFlag(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults ?? [];
   const exists = props.some((p) => p.key === 'appsflyer.enable_purchase_connector');
    if (!exists) {
      props.push({ type: 'property', key: 'appsflyer.enable_purchase_connector', value: 'true' });
    } else {
      console.log('[AppsFlyerPlugin] Flag already present, no changes made');
    }
    return cfg;
  });
}

// withCustomAndroidManifest.js
function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, async (config) => {
    console.log('[AppsFlyerPlugin] Starting Android manifest modifications...');
    
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;
    
    // Ensure xmlns:tools is present in the <manifest> tag
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
      console.log('[AppsFlyerPlugin] Added xmlns:tools namespace');
    }

    const application = manifest.application[0];

    // Add tools:replace attribute for dataExtractionRules and fullBackupContent
    // This allows AppsFlyer SDK's built-in backup rules to take precedence over
    // conflicting rules in the app's manifest (see: https://dev.appsflyer.com/hc/docs/install-android-sdk#backup-rules)
    const existingReplace = application['$']['tools:replace'];
    if (existingReplace) {
      // Add to existing tools:replace if not already present
      const replaceAttrs = existingReplace.split(',').map(s => s.trim());
      if (!replaceAttrs.includes('android:dataExtractionRules')) {
        replaceAttrs.push('android:dataExtractionRules');
      }
      if (!replaceAttrs.includes('android:fullBackupContent')) {
        replaceAttrs.push('android:fullBackupContent');
      }
      application['$']['tools:replace'] = replaceAttrs.join(', ');
    } else {
      application['$']['tools:replace'] = 'android:dataExtractionRules, android:fullBackupContent';
    }

    console.log('[AppsFlyerPlugin] Android manifest modifications completed');
    
    return config;
  });
}

module.exports = function withAppsFlyerAndroid(config, { shouldUsePurchaseConnector = false } = {}) {
  if (shouldUsePurchaseConnector) {
    config = addPurchaseConnectorFlag(config);
  } 
  // Apply Android manifest modifications to resolve backup rules conflicts with AppsFlyer SDK
  // This ensures AppsFlyer SDK's built-in backup rules take precedence (see issue #631)
  config = withCustomAndroidManifest(config);
  
  return config;
};