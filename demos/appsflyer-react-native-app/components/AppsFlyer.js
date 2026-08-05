import appsFlyer, {
  AppsFlyerPurchaseConnector,
  AppsFlyerPurchaseConnectorConfig,
  MEDIATION_NETWORK,
} from 'react-native-appsflyer';
import {Linking, Platform} from 'react-native';
import {DEV_KEY, APP_ID} from '@env';

export const AF_viewCart = 'af_view_cart';
export const AF_addedToCart = 'af_added_to_cart';
export const AF_removedFromCart = 'af_removed_from_cart';
export const AF_checkout = 'af_check_out';
export const AF_clickOnItem = 'af_click_on_item';

export function AFInit(onConversionData, onDeepLink) {
  if (Platform.OS == 'ios') {
    appsFlyer.setCurrentDeviceLanguage('EN');
  }
  appsFlyer.enableDebug(true);

  appsFlyer.init(DEV_KEY, APP_ID).then(
    (success) => {
      console.log('init SDK success', success);
      // Android: MainActivity.onNewIntent only forwards warm-start VIEW intents to
      // performDeepLinking — the native SDK doesn't inspect the launch Intent until
      // init() has actually completed, so a cold-start deep link's Intent is present
      // at Activity onCreate but must be re-delivered here (once JS/native init has
      // resolved) via getInitialURL, or it's silently dropped.
      if (Platform.OS === 'android') {
        Linking.getInitialURL().then((url) => {
          if (url) {
            appsFlyer.performDeepLinking(url, true);
          }
        });
      }
    },
    (error) => console.log('init SDK failed', error),
  );
  
  //Deeplink URL: https://rndemo.onelink.me/neai/by0p3obe
  const unsubscribeConversion = appsFlyer.registerConversionListener(
    onConversionData,
    (error) => console.log('conversion data error:', error),
  );
  const unsubscribeDeepLink = appsFlyer.registerDeepLinkListener(onDeepLink);

  appsFlyer.registerSessionReadyListener(() => {
    appsFlyer.start().then(
      (success) => {
        console.log('start SDK success', success);
        AFLogAdRevenue();
      },
      (error) => {
        console.log('start SDK failed', error);
      },
    );
  });

  return {unsubscribeConversion, unsubscribeDeepLink};
}

// Sends in-app events to AppsFlyer servers. name is the events name ('simple event') and the values are a JSON ({info: 'fff', size: 5})
export function AFLogEvent(name, values) {
  appsFlyer.logEvent(name, values,(res) => {
    console.log(res);
  },
  (err) => {
    console.log(err);
  });
}

function AFLogAdRevenue() {
  const adRevenueData = {
    monetizationNetwork: 'AF-AdNetwork',
    mediationNetwork: MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK,
    currencyIso4217Code: 'USD',
    revenue: 1.23,
    additionalParameters: {
      customParam1: 'value1',
      customParam2: 'value2',
    },
  };

  appsFlyer.logAdRevenue(adRevenueData);
}
