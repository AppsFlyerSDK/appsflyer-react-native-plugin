import {NativeEventEmitter, NativeModules} from "react-native";

const { RNAppsFlyer }        = NativeModules;
const appsFlyer              = {};
const eventsMap              = {};
const appsFlyerEventEmitter  = new NativeEventEmitter(RNAppsFlyer);


function initSdkCallback(options, successC, errorC) {
  return RNAppsFlyer.initSdk(options, successC, errorC);
}

function initSdkPromise(options): Promise<string> {
  return RNAppsFlyer.initSdkWithPromise(options);
}

function initSdk(options, success, error): Promise<string> {
  options.onInstallConversionDataListener = eventsMap["onInstallConversionData"]
      ? true
      : false;

  if (success && error) {
    //initSdk is a callback function
    initSdkCallback(options, success, error);
  } else if (!success) {
    //initSdk is a promise function
    return initSdkPromise(options);
  }
}
appsFlyer.initSdk = initSdk;

function trackEventCallback(eventName, eventValues, successC, errorC) {
  return RNAppsFlyer.trackEvent(eventName, eventValues, successC, errorC);
}

function trackEventPromise(eventName, eventValues): Promise<string> {
  return RNAppsFlyer.trackEventWithPromise(eventName, eventValues);
}

function trackEvent(eventName, eventValues, success, error): Promise<string> {
  if (success && error) {
    //trackEvent is a callback function
    trackEventCallback(eventName, eventValues, success, error);
  } else if (!success) {
    //trackEvent is a promise function
    return trackEventPromise(eventName, eventValues);
  }
}

appsFlyer.trackEvent = trackEvent;

/**
 * iOS only
 */
appsFlyer.trackAppLaunch = () => {
  return RNAppsFlyer.trackAppLaunch();
};

/**
 * Manually record the location of the user
 *
 * @param longitude latitude as double.
 * @param latitude latitude as double.
 * @callback callback success callback function.
 * @platform ios only
 */
appsFlyer.trackLocation = (longitude, latitude, callback) => {
  return RNAppsFlyer.trackLocation(longitude, latitude, callback);
};

/**
 * Set the user emails and encrypt them.
 *
 * @param options latitude as double.
 * @callback successC success callback function.
 * @callback errorC error callback function.
 */
appsFlyer.setUserEmails = (options, successC, errorC) => {
  return RNAppsFlyer.setUserEmails(options, successC, errorC);
};

/**
 * Set additional data to be sent to AppsFlyer.
 *
 * @param additionalData additional data Dictionary.
 * @callback successC success callback function.
 */
appsFlyer.setAdditionalData = (additionalData, successC) => {
  return RNAppsFlyer.setAdditionalData(additionalData, successC);
};

/**
 * Get AppsFlyer's unique device ID is created for every new install of an app.
 *
 * @callback callback function that returns (error,uid)
 */
appsFlyer.getAppsFlyerUID = callback => {
  return RNAppsFlyer.getAppsFlyerUID(callback);
};

appsFlyer.sendDeepLinkData = callback => {
  return RNAppsFlyer.sendDeepLinkData(callback);
};

/**
 * @deprecated
 */
appsFlyer.setGCMProjectNumber = (gcmProjectNumber, successC, errorC) => {
  return RNAppsFlyer.setGCMProjectNumber(gcmProjectNumber, successC, errorC);
};

/**
 * @deprecated
 */
appsFlyer.enableUninstallTracking = (gcmProjectNumber, successC) => {
  return RNAppsFlyer.enableUninstallTracking(gcmProjectNumber, successC);
};

/**
 * Manually pass the Firebase / GCM Device Token for Uninstall measurement.
 *
 * @param token Firebase Device Token.
 * @callback successC success callback function.
 */
appsFlyer.updateServerUninstallToken = (token, successC) => {
  return RNAppsFlyer.updateServerUninstallToken(token, successC);
};

/**
 * Setting your own customer ID enables you to cross-reference your own unique ID with AppsFlyer’s unique ID and the other devices’ IDs.
 * This ID is available in AppsFlyer CSV reports along with Postback APIs for cross-referencing with your internal IDs.
 *
 * @param {string} userId Customer ID for client.
 * @callback successC success callback function.
 */
appsFlyer.setCustomerUserId = (userId, successC) => {
  return RNAppsFlyer.setCustomerUserId(userId, successC);
};

/**
 * Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.
 * In some extreme cases you might want to shut down all SDK activity due to legal and privacy compliance.
 * This can be achieved with the stopTracking API.
 *
 * @param {boolean} isStopTracking boolean should SDK be stopped.
 * @callback successC success callback function.
 */
appsFlyer.stopTracking = (isStopTracking, successC) => {
  return RNAppsFlyer.stopTracking(isStopTracking, successC);
};

/**
 * Opt-out of collection of IMEI.
 * If the app does NOT contain Google Play Services, device IMEI is collected by the SDK.
 * However, apps with Google play services should avoid IMEI collection as this is in violation of the Google Play policy.
 *
 * @param {boolean} isCollect boolean, false to opt out.
 * @callback successC success callback function.
 * @platform android
 */
appsFlyer.setCollectIMEI = (isCollect, successC) => {
  return RNAppsFlyer.setCollectIMEI(isCollect, successC);
};

/**
 * Opt-out of collection of Android ID.
 * If the app does NOT contain Google Play Services, Android ID is collected by the SDK.
 * However, apps with Google play services should avoid Android ID collection as this is in violation of the Google Play policy.
 *
 * @param {boolean} isCollect boolean, false to opt out.
 * @callback successC success callback function.
 * @platform android
 */
appsFlyer.setCollectAndroidID = (isCollect, successC) => {
  return RNAppsFlyer.setCollectAndroidID(isCollect, successC);
};

/**
 * Set the OneLink ID that should be used for User-Invite-API.
 * The link that is generated for the user invite will use this OneLink as the base link.
 *
 * @param {string} oneLinkID OneLink ID obtained from the AppsFlyer Dashboard.
 * @callback successC success callback function.
 */
appsFlyer.setAppInviteOneLinkID = (oneLinkID, successC) => {
  return RNAppsFlyer.setAppInviteOneLinkID(oneLinkID, successC);
};

/**
 * The LinkGenerator class builds the invite URL according to various setter methods which allow passing on additional information on the click.
 * @see https://support.appsflyer.com/hc/en-us/articles/115004480866-User-invite-attribution-
 *
 * @param parameters Dictionary.
 * @callback success success callback function.
 * @callback error error callback function.
 */
appsFlyer.generateInviteLink = (parameters, success, error) => {
  return RNAppsFlyer.generateInviteLink(parameters, success, error);
};

/**
 * To attribute an impression use the following API call.
 * Make sure to use the promoted App ID as it appears within the AppsFlyer dashboard.
 *
 * @param appId promoted App ID.
 * @param campaign cross promotion campaign.
 */
appsFlyer.trackCrossPromotionImpression = (appId, campaign, parameters) => {
  return RNAppsFlyer.trackCrossPromotionImpression(appId, campaign, parameters);
};

/**
 * Use the following API to attribute the click and launch the app store's app page.
 *
 * @param appId promoted App ID.
 * @param campaign cross promotion campaign.
 * @param params additional user params.
 */
appsFlyer.trackAndOpenStore = (appId, campaign, params) => {
  return RNAppsFlyer.trackAndOpenStore(appId, campaign, params);
};

/**
 * Setting user local currency code for in-app purchases.
 * The currency code should be a 3 character ISO 4217 code. (default is USD).
 * You can set the currency code for all events by calling the following method.
 * @param currencyCode
 * @param successC success callback function.
 */
appsFlyer.setCurrencyCode = (currencyCode, successC) => {
  return RNAppsFlyer.setCurrencyCode(currencyCode, successC);
};



/**
 * Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking)
 * @param callback: contains fields:
 *    status: success/failure
 *    type:
 *          onAppOpenAttribution
 *          onInstallConversionDataLoaded
 *          onAttributionFailure
 *          onInstallConversionFailure
 *    data: metadata,
 * @example {"status":"success","type":"onInstallConversionDataLoaded","data":{"af_status":"Organic","af_message":"organic install"}}
 *
 * @returns {remove: function - unregister listener}
 */
appsFlyer.onInstallConversionData = callback => {

  const listener = appsFlyerEventEmitter.addListener(
      "onInstallConversionDataLoaded",
      _data => {
        if (callback && typeof callback === typeof Function) {
          try {
            let data = JSON.parse(_data);
            callback(data);
          } catch (_error) {
            //throw new AFParseJSONException("...");
            //TODO: for today we return an error in callback
            callback(new AFParseJSONException("Invalid data structure", _data));
          }
        }
      }
  );

  eventsMap["onInstallConversionData"] = listener;

  // unregister listener (suppose should be called from componentWillUnmount() )
  return function remove() {
    listener.remove();
  };
};

appsFlyer.onInstallConversionFailure = callback => {

  const listener = appsFlyerEventEmitter.addListener(
      "onInstallConversionFailure",
      _data => {
        if (callback && typeof callback === typeof Function) {
          try {
            let data = JSON.parse(_data);
            callback(data);
          } catch (_error) {
            //throw new AFParseJSONException("...");
            //TODO: for today we return an error in callback
            callback(new AFParseJSONException("Invalid data structure", _data));
          }
        }
      }
  );

  eventsMap["onInstallConversionFailure"] = listener;

  // unregister listener (suppose should be called from componentWillUnmount() )
  return function remove() {
    listener.remove();
  };
};

appsFlyer.onAppOpenAttribution = callback => {

  //console.log("onAppOpenAttribution is called" );

  const listener = appsFlyerEventEmitter.addListener(
      "onAppOpenAttribution",
      _data => {
        if (callback && typeof callback === typeof Function) {
          try {
            let data = JSON.parse(_data);
            callback(data);
          } catch (_error) {
            callback(new AFParseJSONException("Invalid data structure", _data));
          }
        }
      }
  );


  eventsMap["onAppOpenAttribution"] = listener;

  // unregister listener (suppose should be called from componentWillUnmount() )
  return function remove() {
    listener.remove();
  };
};

/**
 * Anonymize user Data.
 * Use this API during the SDK Initialization to explicitly anonymize a user's installs, events and sessions.
 * Default is false
 * @param isDeviceTrackingDisabled boolean
 * @param successC success callback function.
 */
appsFlyer.setDeviceTrackingDisabled = (isDeviceTrackingDisabled, successC) => {
  return RNAppsFlyer.setDeviceTrackingDisabled(isDeviceTrackingDisabled, successC);
};

/**
 * Set Onelink custom/branded domains
 * Use this API during the SDK Initialization to indicate branded domains.
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360002329137-Implementing-Branded-Links
 * @param domains array of strings
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setOneLinkCustomDomains = (domains, successC, errorC) => {
  return RNAppsFlyer.setOneLinkCustomDomains(domains, successC, errorC);
};

/**
 * Set domains used by ESP when wrapping your deeplinks.
 * Use this API during the SDK Initialization to indicate that links from certain domains should be resolved
 * in order to get original deeplink
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360001409618-Email-service-provider-challenges-with-iOS-Universal-links
 * @param urls array of strings
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setResolveDeepLinkURLs = (urls, successC, errorC) => {
  return RNAppsFlyer.setResolveDeepLinkURLs(urls, successC, errorC);
};

appsFlyer.performOnAppAttribution = (urlString, callback) => {
  return RNAppsFlyer.performOnAppAttribution(urlString, callback);
}

appsFlyer.setSharingFilterForAllPartners = () => {
  return RNAppsFlyer.setSharingFilterForAllPartners();
}

appsFlyer.setSharingFilter = (partners, successC, errorC) => {
  return RNAppsFlyer.setSharingFilter(partners, successC, errorC);
}

/**
 * iOS only
 */
appsFlyer.waitForAdvertisingIdentifierWithTimeoutInterval = (timeoutInterval, successC, errorC) => {
  return RNAppsFlyer.waitForAdvertisingIdentifierWithTimeoutInterval(timeoutInterval * 1000, successC, errorC);
}
/**
 * iOS only
 */
appsFlyer.requestTrackingAuthorization = (successC, errorC) => {
  RNAppsFlyer.requestTrackingAuthorizationWith(successC, errorC);
}

function AFParseJSONException(_message, _data) {
  this.message = _message;
  this.data = _data;
  this.name = "AFParseJSONException";
}


export default appsFlyer;
