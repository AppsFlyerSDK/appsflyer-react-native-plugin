const { withGradleProperties } = require('@expo/config-plugins');

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

module.exports = function withAppsFlyerAndroid(config, { shouldUsePurchaseConnector = false } = {}) {
  if (shouldUsePurchaseConnector) {
    config = addPurchaseConnectorFlag(config);
  } else {
    console.log('[AppsFlyerPlugin] Purchase Connector disabled, skipping gradle property injection');
  }
  return config;
};