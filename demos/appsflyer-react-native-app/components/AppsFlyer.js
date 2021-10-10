import appsFlyer from 'react-native-appsflyer';
import {Platform} from 'react-native';

// events
export const AF_viewCart = 'af_view_cart';
export const AF_addedToCart = 'af_added_to_cart';
export const AF_removedFromCart = 'af_removed_from_cart';
export const AF_checkout = 'af_check_out';
export const AF_clickOnItem = 'af_click_on_item';

const initOptions = {
    isDebug: true,
    devKey: 'Us4GmXxXx46Qed',
    onInstallConversionDataListener: true,
    timeToWaitForATTUserAuthorization: 10,
    onDeepLinkListener: true,
    appId: '741993747'
};

// AppsFlyer initialization flow. ends with initSdk.
export function AFInit() {
  if (Platform.OS == 'ios') {
    appsFlyer.setCurrentDeviceLanguage("EN");
  }
  appsFlyer.setAppInviteOneLinkID('oW4R');
  appsFlyer.initSdk(initOptions, null, null);
}

// Sends in-app events to AppsFlyer servers. name is the events name ('simple event') and the values are a JSON ({info: 'fff', size: 5})
export function AFLogEvent(name, values) {
  appsFlyer.logEvent(name, values, null, null);
}
