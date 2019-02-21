package com.appsflyer.reactnative;


import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import com.appsflyer.*;
import com.appsflyer.AFInAppEventType;
import com.appsflyer.AppsFlyerConversionListener;
import com.appsflyer.AppsFlyerLib;
import com.appsflyer.AppsFlyerProperties.EmailsCryptType;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import static com.appsflyer.reactnative.RNAppsFlyerConstants.NO_DEVKEY_FOUND;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.NO_EMAILS_FOUND_OR_CORRUPTED;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.NO_EVENT_NAME_FOUND;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.SUCCESS;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.UNKNOWN_ERROR;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afConversionData;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afDevKey;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afEmails;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afEmailsCryptType;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afFailure;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afIsDebug;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afOnAppOpenAttribution;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afOnAttributionFailure;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afOnInstallConversionData;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afOnInstallConversionDataLoaded;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afOnInstallConversionFailure;
import static com.appsflyer.reactnative.RNAppsFlyerConstants.afSuccess;
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
            Log.d("AppsFlyer", "Starting Tracking");
        }

        instance.init(
                devKey,
                (isConversionData == true) ? registerConversionListener() : null,
                application.getApplicationContext());


        Intent intent = this.getCurrentActivity().getIntent();
        //Generally we already do this validation into the SDK, anyways, we want to show it to clients
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            AppsFlyerLib.getInstance().setPluginDeepLinkData(intent);
        }

        trackAppLaunch();
        instance.startTracking(application, devKey);


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
                handleSuccess(afOnAppOpenAttribution, attributionData);
            }

            @Override
            public void onAttributionFailure(String errorMessage) {
                handleError(afOnAttributionFailure, errorMessage);
            }

            @Override
            public void onInstallConversionDataLoaded(Map<String, String> conversionData) {
                handleSuccess(afOnInstallConversionDataLoaded, conversionData);
            }

            @Override
            public void onInstallConversionFailure(String errorMessage) {
                handleError(afOnInstallConversionFailure, errorMessage);
            }

            private void handleSuccess(String eventType, Map<String, String> data) {
                JSONObject obj = new JSONObject();

                try {
                    obj.put("status", afSuccess);
                    obj.put("type", eventType);
                    obj.put("data", new JSONObject(data));
                    if (eventType.equals(afOnInstallConversionDataLoaded)) {
                        sendEvent(reactContext, afOnInstallConversionData, obj.toString());
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
                    sendEvent(reactContext, afOnInstallConversionData, obj.toString());
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

    private void trackAppLaunch() {
        Context c = application.getApplicationContext();
        AppsFlyerLib.getInstance().trackEvent(c, null, null);
    }


    private String trackEventInternal(final String eventName, ReadableMap eventData) {

        if (eventName.trim().equals("")) {
            return NO_EVENT_NAME_FOUND;
        }

        Map<String, Object> data = RNUtil.toMap(eventData);

        if (data == null) { // in case of no values
            data = new HashMap<>();
        }

        AppsFlyerLib.getInstance().trackEvent(getCurrentActivity().getBaseContext(), eventName, data);

        return null;
    }

    @ReactMethod
    public void trackEvent(
            final String eventName, ReadableMap eventData,
            Callback successCallback,
            Callback errorCallback) {
        try {
            final String errorReason = trackEventInternal(eventName, eventData);

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
    public void trackEventWithPromise(
            final String eventName, ReadableMap eventData, Promise promise) {
        try {
            final String errorReason = trackEventInternal(eventName, eventData);

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

    @Deprecated
    @ReactMethod
    public void sendDeepLinkData(String url) {
        if (url != null) {
            Intent intent = getCurrentActivity().getIntent();
            Uri uri = Uri.parse(url);
            intent.setData(uri);
            AppsFlyerLib.getInstance().sendDeepLinkData(this.getCurrentActivity());
        }
    }

    @Deprecated
    @ReactMethod
    public void sendTrackingWithEvent(final String eventName) {
        AppsFlyerLib.getInstance().trackEvent(getReactApplicationContext(), eventName, null);
    }

    @ReactMethod
    public void getAppsFlyerUID(Callback callback) {
        String appId = AppsFlyerLib.getInstance().getAppsFlyerUID(getReactApplicationContext());
        callback.invoke(null, appId);
    }

    @ReactMethod
    @Deprecated
    public void setGCMProjectNumber(final String gcmProjectNumber,
                                    Callback successCallback,
                                    Callback errorCallback) {
        AppsFlyerLib.getInstance().setGCMProjectNumber(gcmProjectNumber);
        successCallback.invoke(SUCCESS);
    }

    @ReactMethod
    public void enableUninstallTracking(final String gcmProjectNumber,
                                        Callback successCallback) {
        AppsFlyerLib.getInstance().enableUninstallTracking(gcmProjectNumber);
        successCallback.invoke(SUCCESS);
    }

    @ReactMethod
    public void updateServerUninstallToken(final String token, Callback callback) {
        AppsFlyerLib.getInstance().updateServerUninstallToken(getReactApplicationContext(), token);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setCustomerUserId(final String userId, Callback callback) {
        AppsFlyerLib.getInstance().setCustomerUserId(userId);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setCollectIMEI(boolean isCollect, Callback callback) {
        AppsFlyerLib.getInstance().setCollectIMEI(isCollect);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setCollectAndroidID(boolean isCollect, Callback callback) {
        AppsFlyerLib.getInstance().setCollectAndroidID(isCollect);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void stopTracking(boolean isCollect, Callback callback) {
        AppsFlyerLib.getInstance().stopTracking(isCollect, getReactApplicationContext());
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setAdditionalData(ReadableMap additionalData, Callback callback) {

        Map<String, Object> data = RNUtil.toMap(additionalData);

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
            errorCallback.invoke(new Exception(NO_EMAILS_FOUND_OR_CORRUPTED).getMessage());
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
            errorCallback.invoke(new Exception(NO_EMAILS_FOUND_OR_CORRUPTED).getMessage());
            return;
        }

        AppsFlyerLib.getInstance().setUserEmails(type, emailsList);
        successCallback.invoke(SUCCESS);
    }

    @ReactMethod
    public void setAppInviteOneLinkID(final String oneLinkID, Callback callback) {
        if (oneLinkID == null || oneLinkID.length() == 0) {
            return;
        }
        AppsFlyerLib.getInstance().setAppInviteOneLink(oneLinkID);
        callback.invoke(SUCCESS);
    }

    @ReactMethod
    public void generateInviteLink(ReadableMap args, Callback successCallback, Callback errorCallback) {

        String channel = null;
        String campaign = null;
        String referrerName = null;
        String referrerImageUrl = null;
        String customerID = null;
        String baseDeepLink = null;

        JSONObject options = RNUtil.readableMapToJson(args);

        channel = options.optString(INVITE_CHANNEL, "");
        campaign = options.optString(INVITE_CAMPAIGN, "");
        referrerName = options.optString(INVITE_REFERRER, "");
        referrerImageUrl = options.optString(INVITE_IMAGEURL, "");
        customerID = options.optString(INVITE_CUSTOMERID, "");
        baseDeepLink = options.optString(INVITE_DEEPLINK, "");

        LinkGenerator linkGenerator = ShareInviteHelper.generateInviteUrl(getReactApplicationContext());

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
    public void trackCrossPromotionImpression(final String appId, final String campaign) {
        if (appId != "" && campaign != "") {
            CrossPromotionHelper.trackCrossPromoteImpression(getReactApplicationContext(), appId, campaign);
        }
    }

    @ReactMethod
    public void trackAndOpenStore(final String appId, final String campaign, ReadableMap params) {

        if (appId == null || appId == "") {
            return;
        }

        try {
            Map<String, Object> data = RNUtil.toMap(params);
        } catch (Exception e) {

        }

        CrossPromotionHelper.trackAndOpenStore(getReactApplicationContext(), appId, campaign, data);
    }
}