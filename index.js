import {NativeEventEmitter, NativeModules} from "react-native";

const {RNAppsFlyer} = NativeModules;
const appsFlyer = {};
const eventsMap = {};
const appsFlyerEventEmitter = new NativeEventEmitter(RNAppsFlyer);


function initSdkCallback(options, successC, errorC) {
    return RNAppsFlyer.initSdk(options, successC, errorC);
}

function initSdkPromise(options): Promise<string> {
    return RNAppsFlyer.initSdkWithPromise(options);
}

function initSdk(options, success, error): Promise<string> {
    appsFlyer.appId = options.appId;
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

function logEventCallback(eventName, eventValues, successC, errorC) {
    return RNAppsFlyer.logEvent(eventName, eventValues, successC, errorC);
}

function logEventPromise(eventName, eventValues): Promise<string> {
    return RNAppsFlyer.logEventWithPromise(eventName, eventValues);
}

function logEvent(eventName, eventValues, success, error): Promise<string> {
    if (success && error) {
        //logEvent is a callback function
        logEventCallback(eventName, eventValues, success, error);
    } else if (!success) {
        //logEvent is a promise function
        return logEventPromise(eventName, eventValues);
    }
}

appsFlyer.logEvent = logEvent;

/**
 * Manually record the location of the user
 *
 * @param longitude latitude as double.
 * @param latitude latitude as double.
 * @param callback success callback function
 */
appsFlyer.logLocation = (longitude, latitude, callback) => {
    if (longitude == null || latitude == null || longitude == "" || latitude == "") {
        console.log("longitude or latitude are missing!");
        return;
    }
    if (typeof longitude != "number" || typeof latitude != "number") {
        longitude = parseFloat(longitude);
        latitude = parseFloat(latitude);
    }
    return RNAppsFlyer.logLocation(longitude, latitude, callback);
};

/**
 * Set the user emails and encrypt them.
 *
 * @param options latitude as double.
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setUserEmails = (options, successC, errorC) => {
    return RNAppsFlyer.setUserEmails(options, successC, errorC);
};

/**
 * Set additional data to be sent to AppsFlyer.
 *
 * @param additionalData additional data Dictionary.
 * @param successC success callback function.
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

/**
 * Manually pass the Firebase / GCM Device Token for Uninstall measurement.
 *
 * @param token Firebase Device Token.
 * @param successC success callback function.
 */
appsFlyer.updateServerUninstallToken = (token, successC) => {
    if ( token == null || token == "") {
        console.log("token is missing!");
        return;
    }
    if (typeof token != "string") {
        token = token.toString();
    }
    return RNAppsFlyer.updateServerUninstallToken(token, successC);
};

/**
 * Setting your own customer ID enables you to cross-reference your own unique ID with AppsFlyer’s unique ID and the other devices’ IDs.
 * This ID is available in AppsFlyer CSV reports along with Postback APIs for cross-referencing with your internal IDs.
 *
 * @param {string} userId Customer ID for client.
 * @param successC callback function.
 */
appsFlyer.setCustomerUserId = (userId, successC) => {
    if ( userId == null || userId == "") {
        console.log("userId is missing!");
        return;
    }
    if (typeof userId != "string") {
        userId = userId.toString();
    }
    return RNAppsFlyer.setCustomerUserId(userId, successC);
};

/**
 * Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.
 * In some extreme cases you might want to shut down all SDK activity due to legal and privacy compliance.
 * This can be achieved with the stop API.
 *
 * @param {boolean} isStopped boolean should SDK be stopped.
 * @param successC callback function.
 */
appsFlyer.stop = (isStopped, successC) => {
    return RNAppsFlyer.stop(isStopped, successC);
};

/**
 * Opt-out of collection of IMEI.
 * If the app does NOT contain Google Play Services, device IMEI is collected by the SDK.
 * However, apps with Google play services should avoid IMEI collection as this is in violation of the Google Play policy.
 *
 * @param {boolean} isCollect boolean, false to opt out.
 * @param successC callback function.
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
 * @param successC callback function.
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
 * @param successC callback function.
 */
appsFlyer.setAppInviteOneLinkID = (oneLinkID, successC) => {
    if ( oneLinkID == null || oneLinkID == "") {
        console.log("oneLinkID is missing!");
        return;
    }
    if (typeof oneLinkID != "string") {
        oneLinkID = oneLinkID.toString();
    }
    return RNAppsFlyer.setAppInviteOneLinkID(oneLinkID, successC);
};

/**
 * The LinkGenerator class builds the invite URL according to various setter methods which allow passing on additional information on the click.
 * @see https://support.appsflyer.com/hc/en-us/articles/115004480866-User-invite-attribution-
 *
 * @param parameters Dictionary.
 * @param success success callback function..
 * @param error error callback function.
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
 * @param parameters additional params to be added to the attribution link
 */
appsFlyer.logCrossPromotionImpression = (appId, campaign, parameters) => {
    if ( appId == null ||  campaign == null || appId == "" || campaign == "") {
        console.log("App-Id or campaign is missing!");
        return;
    }
    if (typeof appId != "string" || typeof campaign != "string") {
        appId = appId.toString();
        campaign = campaign.toString();
    }
    return RNAppsFlyer.logCrossPromotionImpression(appId, campaign, parameters);
};

/**
 * Use the following API to attribute the click and launch the app store's app page.
 *
 * @param appId promoted App ID.
 * @param campaign cross promotion campaign.
 * @param params additional user params.
 */
appsFlyer.logCrossPromotionAndOpenStore = (appId, campaign, params) => {
    if ( appId == null ||  campaign == null || appId == "" || campaign == "") {
        console.log("App-Id or campaign is missing!");
        return;
    }
    if (typeof appId != "string" || typeof campaign != "string") {
        appId = appId.toString();
        campaign = campaign.toString();
    }
    return RNAppsFlyer.logCrossPromotionAndOpenStore(appId, campaign, params);

};

/**
 * Setting user local currency code for in-app purchases.
 * The currency code should be a 3 character ISO 4217 code. (default is USD).
 * You can set the currency code for all events by calling the following method.
 * @param currencyCode
 * @param successC success callback function.
 */
appsFlyer.setCurrencyCode = (currencyCode, successC) => {
    if ( currencyCode == null || currencyCode == "") {
        console.log("currencyCode is missing!");
        return;
    }
    if (typeof currencyCode != "string") {
        currencyCode = currencyCode.toString();
    }
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
 * @param shouldAnonymize boolean
 * @param successC success callback function.
 */
appsFlyer.anonymizeUser = (shouldAnonymize, successC) => {
    return RNAppsFlyer.anonymizeUser(shouldAnonymize, successC);
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

/**
 * This function allows developers to manually re-trigger onAppOpenAttribution with a specific link (URI or URL),
 * without recording a new re-engagement.
 * This method may be required if the app needs to redirect users based on the given link,
 * or resolve the AppsFlyer short URL while staying in the foreground/opened. This might be needed because
 * regular onAppOpenAttribution callback is only called if the app was opened with the deep link.
 * @param urlString String representing the URL that needs to be resolved/returned in the onAppOpenAttribution callback
 * @param callback Result callback
 */
appsFlyer.performOnAppAttribution = (urlString, successC, errorC) => {
    if (typeof urlString != "string") {
        urlString = urlString.toString();
    }
    return RNAppsFlyer.performOnAppAttribution(urlString, successC, errorC);
}

/**
 * Used by advertisers to exclude **all** networks/integrated partners from getting data.
 * Learn more - https://support.appsflyer.com/hc/en-us/articles/207032126#additional-apis-exclude-partners-from-getting-data
 */

appsFlyer.setSharingFilterForAllPartners = () => {
    return RNAppsFlyer.setSharingFilterForAllPartners();
}

/**
 * Used by advertisers to exclude specified networks/integrated partners from getting data.
 * Learn more - https://support.appsflyer.com/hc/en-us/articles/207032126#additional-apis-exclude-partners-from-getting-data
 * @param partners Comma separated array of partners that need to be excluded
 * @param successC Success callback
 * @param errorC Error callback
 */

appsFlyer.setSharingFilter = (partners, successC, errorC) => {
    return RNAppsFlyer.setSharingFilter(partners, successC, errorC);
}

/**
 * Disables IDFA collecting
 * @param shouldDisable Flag to disable/enable IDFA collection
 * @platform iOS only
 */
appsFlyer.disableAdvertisingIdentifier = (shouldDisable) => {
    return RNAppsFlyer.disableAdvertisingIdentifier(shouldDisable);
}

/**
 * Disables Apple Search Ads collecting
 * @param shouldDisable Flag to disable/enable Apple Search Ads data collection
 * @platform iOS only
 */
appsFlyer.disableCollectASA = (shouldDisable) => {
    return RNAppsFlyer.disableCollectASA(shouldDisable);
}

function AFParseJSONException(_message, _data) {
    this.message = _message;
    this.data = _data;
    this.name = "AFParseJSONException";
}


export default appsFlyer;
