const { withGradleProperties, withAndroidManifest, WarningAggregator } = require('@expo/config-plugins');

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

function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, async (cfg) => {
    const androidManifest = cfg.modResults;
    const manifest = androidManifest.manifest;

    if (!manifest || !manifest.$ || !manifest.application || !manifest.application[0]) {
      console.warn('[AppsFlyerPlugin] Unexpected manifest structure; skipping modifications');
      return cfg;
    }

    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const appAttrs = manifest.application[0].$ || {};
    const backupKeys = ['android:dataExtractionRules', 'android:fullBackupContent'];
    const present = backupKeys.filter((key) => appAttrs[key] !== undefined);

    for (const key of present) {
      delete appAttrs[key];
      console.log(`[AppsFlyerPlugin] Removed ${key} to use AppsFlyer SDK rules`);
    }

    // Another plugin (e.g. expo-secure-store) may have listed these in tools:replace; a stale entry fails the manifest merge.
    if (appAttrs['tools:replace']) {
      const entries = appAttrs['tools:replace'].split(',').map((s) => s.trim()).filter(Boolean);
      const kept = entries.filter((s) => !backupKeys.includes(s));
      if (kept.length !== entries.length) {
        if (kept.length > 0) {
          appAttrs['tools:replace'] = kept.join(', ');
        } else {
          delete appAttrs['tools:replace'];
        }
        console.log('[AppsFlyerPlugin] Cleaned stale backup entries from tools:replace');
      }
    }

    if (!present.length) {
      WarningAggregator.addWarningAndroid(
        'withAppsFlyerAndroid',
        'preferAppsFlyerBackupRules is set but no backup attributes were found; if another plugin adds them, list react-native-appsflyer before it in "plugins".'
      );
    }

    return cfg;
  });
}

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
  if (preferAppsFlyerBackupRules) {
    config = withCustomAndroidManifest(config);
  }
  return config;
};
