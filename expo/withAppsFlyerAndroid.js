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
    const existingReplace = application['$']['tools:replace'];
    if (existingReplace) {
      const newReplace = existingReplace + ', android:dataExtractionRules, android:fullBackupContent';
      application['$']['tools:replace'] = newReplace;
    } else {
      application['$']['tools:replace'] = 'android:dataExtractionRules, android:fullBackupContent';
    }

    // Set dataExtractionRules and fullBackupContent as attributes within <application>
    application['$']['android:dataExtractionRules'] = '@xml/secure_store_data_extraction_rules';
    application['$']['android:fullBackupContent'] = '@xml/secure_store_backup_rules';

    console.log('[AppsFlyerPlugin] Android manifest modifications completed');
    
    return config;
  });
}

module.exports = function withAppsFlyerAndroid(config, { shouldUsePurchaseConnector = false } = {}) {
  if (shouldUsePurchaseConnector) {
    config = addPurchaseConnectorFlag(config);
  } else {
    console.log('[AppsFlyerPlugin] Purchase Connector disabled, skipping gradle property injection');
  }
  
  // Always apply Android manifest modifications for secure data handling
  config = withCustomAndroidManifest(config);
  
  return config;
};