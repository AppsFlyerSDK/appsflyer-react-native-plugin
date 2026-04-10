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

// Opt-in backup rules handling
function withCustomAndroidManifest(config, { preferAppsFlyerBackupRules = false } = {}) {
  return withAndroidManifest(config, async (cfg) => {
    const androidManifest = cfg.modResults;
    const manifest = androidManifest.manifest;

    if (!manifest || !manifest.$ || !manifest.application || !manifest.application[0]) {
      console.warn('[AppsFlyerPlugin] Unexpected manifest structure; skipping modifications');
      return cfg;
    }

    // Ensure xmlns:tools is present in the <manifest> tag
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = manifest.application[0];
    const appAttrs = application.$ || {};

    const hasDataExtractionRules = appAttrs['android:dataExtractionRules'] !== undefined;
    const hasFullBackupContent = appAttrs['android:fullBackupContent'] !== undefined;

    if (!preferAppsFlyerBackupRules) {
      // Default: do not touch backup attributes at all
      if (hasDataExtractionRules || hasFullBackupContent) {
        console.log(
          '[AppsFlyerPlugin] App defines backup attributes; leaving them untouched (preferAppsFlyerBackupRules=false)'
        );
      } else {
        console.log(
          '[AppsFlyerPlugin] App does not define backup attributes; no changes required (preferAppsFlyerBackupRules=false)'
        );
      }
      console.log('[AppsFlyerPlugin] Android manifest modifications completed');
      return cfg;
    }

    // preferAppsFlyerBackupRules === true
    if (hasDataExtractionRules || hasFullBackupContent) {
      // Remove conflicting attributes from app's manifest.
      // This allows AppsFlyer SDK's built-in backup rules to be used instead.
      const removedKeys = [];

      if (hasDataExtractionRules) {
        delete appAttrs['android:dataExtractionRules'];
        removedKeys.push('android:dataExtractionRules');
        console.log('[AppsFlyerPlugin] Removed android:dataExtractionRules to use AppsFlyer SDK rules');
      }

      if (hasFullBackupContent) {
        delete appAttrs['android:fullBackupContent'];
        removedKeys.push('android:fullBackupContent');
        console.log('[AppsFlyerPlugin] Removed android:fullBackupContent to use AppsFlyer SDK rules');
      }

      // Clean removed attribute names from any existing tools:replace to avoid stale replace
      // directives. Other plugins (e.g. expo-secure-store) may have already added these keys
      // to tools:replace; leaving them after the attributes are deleted causes a manifest merge
      // failure: "Multiple entries with same key: <attr>=REPLACE".
      if (appAttrs['tools:replace']) {
        const filtered = appAttrs['tools:replace']
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && !removedKeys.includes(s));
        if (filtered.length > 0) {
          appAttrs['tools:replace'] = filtered.join(', ');
        } else {
          delete appAttrs['tools:replace'];
        }
        console.log('[AppsFlyerPlugin] Cleaned stale tools:replace entries for removed backup attributes');
      }
    }

    return cfg;
  });
}

// Main plugin export
module.exports = function withAppsFlyerAndroid(
  config,
  {
    shouldUsePurchaseConnector = false,
    preferAppsFlyerBackupRules = false,
  } = {}
) {
  if (shouldUsePurchaseConnector) {
    config = addPurchaseConnectorFlag(config);
  }

  config = withCustomAndroidManifest(config, { preferAppsFlyerBackupRules });

  return config;
};
