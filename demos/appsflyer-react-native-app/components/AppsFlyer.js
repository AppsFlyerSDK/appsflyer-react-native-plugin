import AppsFlyer, {
  AppsFlyerPurchaseConnector,
  AppsFlyerPurchaseConnectorConfig,
  MEDIATION_NETWORK,
} from 'react-native-appsflyer';
import {Linking, Platform} from 'react-native';
import {DEV_KEY, APP_ID, ONELINK_ID} from '@env';

export const AF_viewCart = 'af_view_cart';
export const AF_addedToCart = 'af_added_to_cart';
export const AF_removedFromCart = 'af_removed_from_cart';
export const AF_checkout = 'af_check_out';
export const AF_clickOnItem = 'af_click_on_item';

export function AFInit(onConversionData, onDeepLink) {

  AppsFlyer.registerDeepLinkListener({onDeepLinking: onDeepLink});

  AppsFlyer.init({devKey: DEV_KEY, appId: APP_ID}).then(
    () => console.log('init SDK success'),
    (error) => console.log('init SDK failed', error),
  );

  Linking.getInitialURL().then((url) => {
    console.log("AFINIT: Deeplink url" , url)
    if (Platform.OS === 'android' && url) {
      AppsFlyer.performDeepLinking({url, shouldTriggerSession: true});
    }
  });

  AppsFlyer.setAppInviteOneLink({oneLinkId:"neai"});
  if(Platform.OS == "ios"){
    AppsFlyer.setCurrentDeviceLanguage({language: 'EN'});
  }
  AppsFlyer.enableDebug({enabled: true});

  //Deeplink URL: https://rndemo.onelink.me/neai/by0p3obe
  AppsFlyer.registerConversionListener({
    onConversionDataSuccess: onConversionData,
    onConversionDataFail: (error) => console.log('conversion data error:', error),
  });

  AppsFlyer.registerSessionReadyListener(() => {
    AppsFlyer.start().then(
      (success) => {
        console.log('start SDK success');
        AFLogAdRevenue();
      },
      (error) => {
        console.log('start SDK failed:', error);
      },
    );
  });
}

export function AFCleanup() {
  //AppsFlyer.unregisterConversionListener();
  //AppsFlyer.unregisterDeeplinkListener();
}

// Sends in-app events to AppsFlyer servers. name is the events name ('simple event') and the values are a JSON ({info: 'fff', size: 5})
export function AFLogEvent(name, values) {
  AppsFlyer.logEvent({eventName: name, eventValues: values}).then(
    (res) => console.log(res),
    (err) => console.log(err),
  );
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

  AppsFlyer.logAdRevenue(adRevenueData);
}
