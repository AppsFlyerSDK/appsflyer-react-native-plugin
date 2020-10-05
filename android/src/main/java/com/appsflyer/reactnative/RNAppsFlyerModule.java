package com.appsflyer.reactnative;


import android.app.Application;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import com.appsflyer.*;
import com.appsflyer.AFInAppEventType;
import com.appsflyer.AppsFlyerConversionListener;
import com.appsflyer.AppsFlyerLib;
import com.appsflyer.AppsFlyerProperties.EmailsCryptType;
import com.appsflyer.share.CrossPromotionHelper;
import com.appsflyer.share.LinkGenerator;
import com.appsflyer.share.ShareInviteHelper;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;
import java.util.ArrayList;

import static com.appsflyer.reactnative.RNAppsFlyerConstants.*;

public class RNAppsFlyerModule extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;
    private Application application;

    public RNAppsFlyerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.application = (Application) reactContext.getApplicationContext();
    }

    @Override
    public String getName() {
        return "RNAppsFlyer";
    }

    @Override
    public Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap<String, Object>();
        constants.put("ACHIEVEMENT_UNLOCKED", AFInAppEventType.ACHIEVEMENT_UNLOCKED);
        constants.put("ADD_PAYMENT_INFO", AFInAppEventType.ADD_PAYMENT_INFO);
        constants.put("ADD_TO_CART", AFInAppEventType.ADD_TO_CART);
        constants.put("ADD_TO_WISH_LIST", AFInAppEventType.ADD_TO_WISH_LIST);
        constants.put("COMPLETE_REGISTRATION", AFInAppEventType.COMPLETE_REGISTRATION);
        constants.put("CONTENT_VIEW", AFInAppEventType.CONTENT_VIEW);
        constants.put("INITIATED_CHECKOUT", AFInAppEventType.INITIATED_CHECKOUT);
        constants.put("INVITE", AFInAppEventType.INVITE);
        constants.put("LEVEL_ACHIEVED", AFInAppEventType.LEVEL_ACHIEVED);
        constants.put("LOCATION_CHANGED", AFInAppEventType.LOCATION_CHANGED);
        constants.put("LOCATION_COORDINATES", AFInAppEventType.LOCATION_COORDINATES);
        constants.put("LOGIN", AFInAppEventType.LOGIN);
        constants.put("OPENED_FROM_PUSH_NOTIFICATION", AFInAppEventType.OPENED_FROM_PUSH_NOTIFICATION);
        constants.put("ORDER_ID", AFInAppEventType.ORDER_ID);
        constants.put("PURCHASE", AFInAppEventType.PURCHASE);
        constants.put("RATE", AFInAppEventType.RATE);
        constants.put("RE_ENGAGE", AFInAppEventType.RE_ENGAGE);
        constants.put("SEARCH", AFInAppEventType.SEARCH);
        constants.put("SHARE", AFInAppEventType.SHARE);
        constants.put("SPENT_CREDIT", AFInAppEventType.SPENT_CREDIT);
        constants.put("TRAVEL_BOOKING", AFInAppEventType.TRAVEL_BOOKING);
        constants.put("TUTORIAL_COMPLETION", AFInAppEventType.TUTORIAL_COMPLETION);
        constants.put("UPDATE", AFInAppEventType.UPDATE);
        return constants;
    }

    @ReactMethod
    public void initSdk(
            ReadableMap _options,
            Callback successCallback,
            Callback errorCallback
    ) {

        try {
            final String errorReason = callSdkInternal(_options);
            if (errorReason == null) {
                //TODO: callback should come from SDK
                successCallback.invoke(SUCCESS);
            } else {
                errorCallback.invoke(new Exception(errorReason).getMessage());
            }
        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
        }
    }


    private String callSdkInternal(ReadableMap _options) {

        String devKey;
        boolean isDebug;
        boolean isConversionData;

        AppsFlyerLib instance = AppsFlyerLib.getInstance();

        JSONObject options = RNUtil.readableMapToJson(_options);

        devKey = options.optString(afDevKey, "");

        if (devKey.trim().equals("")) {
            return NO_DEVKEY_FOUND;
        }

        isDebug = options.optBoolean(afIsDebug, false);
        instance.setDebugLog(isDebug);

        isConversionData = options.optBoolean(afConversionData, false);

        if (isDebug == true) {
            Log.d("AppsFlyer", "Starting SDK");
        }

        instance.init(
                devKey,
                (isConversionData == true) ? registerConversionListener() : null,
                application.getApplicationContext());

        Intent intent = null;
        Activity currentActivity = getCurrentActivity();

        if (currentActivity != null) {
            // register for lifecycle with Activity (automatically fetching deeplink from Activity if present)
            instance.startTracking(currentActivity, devKey);
        } else {
            // register for lifecycle with Application (cannot fetch deeplink without access to the Activity,
            // also sending first session manually)
            instance.trackAppLaunch(application, devKey);
            instance.startTracking(application, devKey);
        }
        return null;
    }

    @ReactMethod
    public void initSdkWithPromise(ReadableMap _options, Promise promise) {
        try {
            final String errorReason = callSdkInternal(_options);
            if (errorReason == null) {
                //TODO: callback should come from SDK
                promise.resolve(SUCCESS);
            } else {
                promise.reject(errorReason, new Exception(errorReason).getMessage());
            }
        } catch (Exception e) {
            promise.reject(UNKNOWN_ERROR, e);
        }
    }

    private AppsFlyerConversionListener registerConversionListener() {
        return new AppsFlyerConversionListener() {

            @Override
            public void onAppOpenAttribution(Map<String, String> attributionData) {
                handleSuccess(afOnAppOpenAttribution, null, attributionData);
            }

            @Override
            public void onAttributionFailure(String errorMessage) {
                handleError(afOnAttributionFailure, errorMessage);
            }

            @Override
            public void onConversionDataSuccess(Map<String, Object> conversionData) {
                handleSuccess(afOnInstallConversionDataLoaded, conversionData, null);
            }

            @Override
            public void onConversionDataFail(String errorMessage) {
                handleError(afOnInstallConversionFailure, errorMessage);
            }

            private void handleSuccess(String eventType, Map<String, Object> conversionData, Map<String, String> attributionData) {
                JSONObject obj = new JSONObject();

                try {
                    JSONObject data = new JSONObject(conversionData == null ? attributionData : conversionData);
                    obj.put("status", afSuccess);
                    obj.put("type", eventType);
                    obj.put("data", data);
                    if (eventType.equals(afOnInstallConversionDataLoaded)) {
                        sendEvent(reactContext, afOnInstallConversionDataLoaded, obj.toString());
                    } else if (eventType.equals(afOnAppOpenAttribution)) {
                        sendEvent(reactContext, afOnAppOpenAttribution, obj.toString());
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            private void handleError(String eventType, String errorMessage) {
                JSONObject obj = new JSONObject();

                try {
                    obj.put("status", afFailure);
                    obj.put("type", eventType);
                    obj.put("data", errorMessage);
                    sendEvent(reactContext, afOnInstallConversionDataLoaded, obj.toString());
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            private void sendEvent(ReactContext reactContext,
                                   String eventName,
                                   Object params) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
            }
        };
    }

    private String logEventInternal(final String eventName, ReadableMap eventData) {

        if (eventName.trim().equals("")) {
            return NO_EVENT_NAME_FOUND;
        }

        Map<String, Object> data = RNUtil.toMap(eventData);

        if (data == null) { // in case of no values
            data = new HashMap<>();
        }

        Activity currentActivity = getCurrentActivity();

        if (currentActivity != null) {
            AppsFlyerLib.getInstance().trackEvent(currentActivity.getBaseContext(), eventName, data);
        }

        return null;
    }

    @ReactMethod
    public void logEvent(
            final String eventName, ReadableMap eventData,
            Callback successCallback,
            Callback errorCallback) {
        try {
            final String errorReason = logEventInternal(eventName, eventData);

            if (errorReason != null) {
                errorCallback.invoke(new Exception(errorReason).getMessage());
            } else {
                //TODO: callback should come from SDK
                successCallback.invoke(SUCCESS);
            }
        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
            return;
        }
    }

    @ReactMethod
    public void logEventWithPromise(
            final String eventName, ReadableMap eventData, Promise promise) {
        try {
            final String errorReason = logEventInternal(eventName, eventData);

            if (errorReason != null) {
                promise.reject(errorReason, new Exception(errorReason).getMessage());
            } else {
                //TODO: callback should come from SDK
                promise.resolve(SUCCESS);
            }
        } catch (Exception e) {
            promise.reject(UNKNOWN_ERROR, e);
            return;
        }
    }

    @ReactMethod
    public void getAppsFlyerUID(Callback callback) {
        String appId = AppsFlyerLib.getInstance().getAppsFlyerUID(getReactApplicationContext());
        callback.invoke(null, appId);
    }

    @ReactMethod
    public void updateServerUninstallToken(final String token, Callback callback) {
        AppsFlyerLib.getInstance().updateServerUninstallToken(getReactApplicationContext(), token);
        if (callback != null) {
            callback.invoke(SUCCESS);
        }
    }

    @ReactMethod
    public void setCustomerUserId(final String userId, Callback callback) {
        AppsFlyerLib.getInstance().setCustomerUserId(userId);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setCollectIMEI(boolean isCollect, Callback callback) {
        AppsFlyerLib.getInstance().setCollectIMEI(isCollect);
        if (callback != null) {
            callback.invoke(SUCCESS);
        }
    }

    @ReactMethod
    public void setCollectAndroidID(boolean isCollect, Callback callback) {
        AppsFlyerLib.getInstance().setCollectAndroidID(isCollect);
        if (callback != null) {
            callback.invoke(SUCCESS);
        }
    }

    @ReactMethod
    public void stop(boolean isStopped, Callback callback) {
        AppsFlyerLib.getInstance().stopTracking(isStopped, getReactApplicationContext());
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setAdditionalData(ReadableMap additionalData, Callback callback) {
        Map<String, Object> data = null;
        try {
            data = RNUtil.toMap(additionalData);
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

        if (data == null) { // in case of no values
            data = new HashMap<>();
        }

        HashMap<String, Object> copyData = new HashMap<>(data);
        AppsFlyerLib.getInstance().setAdditionalData(copyData);
        callback.invoke(SUCCESS);
    }


    @ReactMethod
    public void setUserEmails(ReadableMap _options,
                              Callback successCallback,
                              Callback errorCallback) {

        JSONObject options = RNUtil.readableMapToJson(_options);

        int emailsCryptType = options.optInt(afEmailsCryptType, 0);
        JSONArray emailsJSON = options.optJSONArray(afEmails);

        if (emailsJSON.length() == 0) {
            errorCallback.invoke(new Exception(EMPTY_OR_CORRUPTED_LIST).getMessage());
            return;
        }

        EmailsCryptType type = EmailsCryptType.NONE; // default type

        for (EmailsCryptType _type : EmailsCryptType.values()) {
            if (_type.getValue() == emailsCryptType) {
                type = _type;
                break;
            }
        }

        String[] emailsList = new String[emailsJSON.length()];
        try {
            for (int i = 0; i < emailsJSON.length(); i++) {
                emailsList[i] = emailsJSON.getString(i);
            }
        } catch (JSONException e) {
            e.printStackTrace();
            errorCallback.invoke(new Exception(EMPTY_OR_CORRUPTED_LIST).getMessage());
            return;
        }

        AppsFlyerLib.getInstance().setUserEmails(type, emailsList);
        successCallback.invoke(SUCCESS);
    }


    @ReactMethod
    public void setAppInviteOneLinkID(final String oneLinkID, Callback callback) {
        AppsFlyerLib.getInstance().setAppInviteOneLink(oneLinkID);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setCurrencyCode(final String currencyCode, Callback callback) {
        AppsFlyerLib.getInstance().setCurrencyCode(currencyCode);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void generateInviteLink(ReadableMap args, final Callback successCallback, final Callback errorCallback) {

        String channel = null;
        String campaign = null;
        String referrerName = null;
        String referrerImageUrl = null;
        String customerID = null;
        String baseDeepLink = null;
        String brandDomain = null;

        LinkGenerator linkGenerator = ShareInviteHelper.generateInviteUrl(getReactApplicationContext());

        try {

            JSONObject options = RNUtil.readableMapToJson(args);

            channel = options.optString(INVITE_CHANNEL, "");
            campaign = options.optString(INVITE_CAMPAIGN, "");
            referrerName = options.optString(INVITE_REFERRER, "");
            referrerImageUrl = options.optString(INVITE_IMAGEURL, "");
            customerID = options.optString(INVITE_CUSTOMERID, "");
            baseDeepLink = options.optString(INVITE_DEEPLINK, "");
            brandDomain = options.optString(INVITE_BRAND_DOMAIN, "");

            if (channel != null && channel != "") {
                linkGenerator.setChannel(channel);
            }
            if (campaign != null && campaign != "") {
                linkGenerator.setCampaign(campaign);
            }
            if (referrerName != null && referrerName != "") {
                linkGenerator.setReferrerName(referrerName);
            }
            if (referrerImageUrl != null && referrerImageUrl != "") {
                linkGenerator.setReferrerImageURL(referrerImageUrl);
            }
            if (customerID != null && customerID != "") {
                linkGenerator.setReferrerCustomerId(customerID);
            }
            if (baseDeepLink != null && baseDeepLink != "") {
                linkGenerator.setBaseDeeplink(baseDeepLink);
            }
            if (brandDomain != null && brandDomain != "") {
                linkGenerator.setBrandDomain(brandDomain);
            }


            if (options.length() > 1 && !options.get("userParams").equals("")) {

                JSONObject jsonCustomValues = options.getJSONObject("userParams");

                Iterator<?> keys = jsonCustomValues.keys();

                while (keys.hasNext()) {
                    String key = (String) keys.next();
                    Object keyvalue = jsonCustomValues.get(key);
                    linkGenerator.addParameter(key, keyvalue.toString());
                }
            }

        } catch (JSONException e) {

        }

        CreateOneLinkHttpTask.ResponseListener listener = new CreateOneLinkHttpTask.ResponseListener() {
            @Override
            public void onResponse(final String oneLinkUrl) {
                successCallback.invoke(oneLinkUrl);
            }

            @Override
            public void onResponseError(final String error) {
                errorCallback.invoke(error);
            }
        };

        linkGenerator.generateLink(getReactApplicationContext(), listener);

    }

    @ReactMethod
    public void logCrossPromotionImpression(final String appId, final String campaign, ReadableMap params) {
        try {
            Map<String, Object> temp = RNUtil.toMap(params);
            Map<String, String> data = null;
            data = (Map) temp;
            CrossPromotionHelper.trackCrossPromoteImpression(getReactApplicationContext(), appId, campaign, data);
        } catch (Exception e) {
            CrossPromotionHelper.trackCrossPromoteImpression(getReactApplicationContext(), appId, campaign);
        }
    }

    @ReactMethod
    public void logCrossPromotionAndOpenStore(final String appId, final String campaign, ReadableMap params) {
        Map<String, String> data = null;
        try {
            Map<String, Object> temp = RNUtil.toMap(params);
            data = (Map) temp;
        } catch (Exception e) {
        }
        CrossPromotionHelper.trackAndOpenStore(getReactApplicationContext(), appId, campaign, data);
    }

    @ReactMethod
    public void anonymizeUser(boolean b, Callback callback) {
        AppsFlyerLib.getInstance().setDeviceTrackingDisabled(b);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setOneLinkCustomDomains(ReadableArray domainsArray, Callback successCallback, Callback errorCallback) {
        if (domainsArray.size() <= 0) {
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
            return;
        }
        ArrayList<Object> domainsList = domainsArray.toArrayList();
        try {
            String[] domains = domainsList.toArray(new String[domainsList.size()]);
            AppsFlyerLib.getInstance().setOneLinkCustomDomain(domains);
            successCallback.invoke(SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
        }
    }

    @ReactMethod
    public void setResolveDeepLinkURLs(ReadableArray urlsArray, Callback successCallback, Callback errorCallback) {
        if (urlsArray.size() <= 0) {
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
            return;
        }
        ArrayList<Object> urlsList = urlsArray.toArrayList();
        try {
            String[] urls = urlsList.toArray(new String[urlsList.size()]);
            AppsFlyerLib.getInstance().setResolveDeepLinkURLs(urls);
            successCallback.invoke(SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
        }
    }

    @ReactMethod
    public void performOnAppAttribution(String urlString, Callback successCallback, Callback errorCallback) {
        try {
            URI uri = URI.create(urlString);
            Context c = application.getApplicationContext();
            AppsFlyerLib.getInstance().performOnAppAttribution(c, uri);
            successCallback.invoke(SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            errorCallback.invoke(INVALID_URI);
        }
    }

    @ReactMethod
    public void setSharingFilterForAllPartners() {
        AppsFlyerLib.getInstance().setSharingFilterForAllPartners();
    }

    @ReactMethod
    public void setSharingFilter(ReadableArray partnersArray, Callback successCallback, Callback errorCallback) {
        if (partnersArray.size() <= 0) {
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
            return;
        }
        ArrayList<Object> partnersList = partnersArray.toArrayList();
        try {
            String[] partners = partnersList.toArray(new String[partnersList.size()]);
            AppsFlyerLib.getInstance().setSharingFilter(partners);
            successCallback.invoke(SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            errorCallback.invoke(EMPTY_OR_CORRUPTED_LIST);
        }
    }

    @ReactMethod
    public void logLocation(double longitude, double latitude, Callback successCallback) {
        AppsFlyerLib.getInstance().trackLocation(getReactApplicationContext(), latitude, longitude);
        successCallback.invoke(SUCCESS);
    }
}
