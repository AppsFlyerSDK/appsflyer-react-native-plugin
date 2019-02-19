import { NativeModules } from "react-native";
import { NativeAppEventEmitter } from "react-native";

const { RNAppsFlyer } = NativeModules;

const appsFlyer = {};

const eventsMap = {};

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

  //console.log(JSON.stringify(options));

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

appsFlyer.trackLocation = (longitude, latitude, callback) => {
  return RNAppsFlyer.trackLocation(longitude, latitude, callback);
};

appsFlyer.setUserEmails = (options, successC, errorC) => {
  return RNAppsFlyer.setUserEmails(options, successC, errorC);
};

appsFlyer.setAdditionalData = (additionalData, successC) => {
  return RNAppsFlyer.setAdditionalData(additionalData, successC);
};

appsFlyer.getAppsFlyerUID = callback => {
  return RNAppsFlyer.getAppsFlyerUID(callback);
};

appsFlyer.sendDeepLinkData = callback => {
  return RNAppsFlyer.sendDeepLinkData(callback);
};

/**
Deprecated
*/
appsFlyer.setGCMProjectNumber = (gcmProjectNumber, successC, errorC) => {
  return RNAppsFlyer.setGCMProjectNumber(gcmProjectNumber, successC, errorC);
};

/**
 * For Android only (GCM). iOS uses 'didRegisterForRemoteNotificationsWithDeviceToken' in AppDelegate.m
 */
appsFlyer.enableUninstallTracking = (gcmProjectNumber, successC) => {
  return RNAppsFlyer.enableUninstallTracking(gcmProjectNumber, successC);
};

/**
 * For Android only (GCM or Firebase).
 */
appsFlyer.updateServerUninstallToken = (token, successC) => {
  return RNAppsFlyer.updateServerUninstallToken(token, successC);
};

appsFlyer.setCustomerUserId = (userId, successC) => {
  return RNAppsFlyer.setCustomerUserId(userId, successC);
};

/**
 *GDPR
 */
appsFlyer.stopTracking = (isStopTracking, successC) => {
  return RNAppsFlyer.stopTracking(isStopTracking, successC);
};

appsFlyer.setCollectIMEI = (isCollect, successC) => {
  return RNAppsFlyer.setCollectIMEI(isCollect, successC);
};

appsFlyer.setCollectAndroidID = (isCollect, successC) => {
  return RNAppsFlyer.setCollectAndroidID(isCollect, successC);
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
  //console.log("onInstallConversionData is called" );

  const listener = NativeAppEventEmitter.addListener(
    "onInstallConversionData",
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

appsFlyer.onAppOpenAttribution = callback => {

  //console.log("onAppOpenAttribution is called" );

  const listener = NativeAppEventEmitter.addListener(
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

function AFParseJSONException(_message, _data) {
  this.message = _message;
  this.data = _data;
  this.name = "AFParseJSONException";
}

export default appsFlyer;
