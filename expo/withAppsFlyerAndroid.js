// this is not used currently because of a bug in Expo 53 , please manually add appsflyer.enable_purchase_connector = true to the gradle.properties file in Order to use Purchase Connector feature in Android.
/*
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
*/