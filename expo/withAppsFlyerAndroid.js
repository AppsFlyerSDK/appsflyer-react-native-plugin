const { withGradleProperties } = require('@expo/config-plugins');

function withAppsFlyerGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    const alreadySet = props.some(p => p.key === 'appsflyer.enable_purchase_connector');
    if (!alreadySet) {
      props.push({
        key: 'appsflyer.enable_purchase_connector',
        value: 'true',
      });
    }

    return config;
  });
}

module.exports = function withAppsFlyerAndroid(config, { 
  shouldUsePurchaseConnector = false 
} = {}) {
  if (shouldUsePurchaseConnector) {
    config = withAppsFlyerGradleProperties(config);
  }

  return config;
};