package com.appsflyer.reactnative;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Arrays;

import com.appsflyer.api.PurchaseClient;
import com.appsflyer.api.Store;
import com.appsflyer.internal.models.*;
import com.appsflyer.internal.models.InAppPurchaseValidationResult;
import com.appsflyer.internal.models.SubscriptionPurchase;
import com.appsflyer.internal.models.SubscriptionValidationResult;
import com.appsflyer.internal.models.ValidationFailureData;

import static com.appsflyer.reactnative.RNAppsFlyerConstants.*;

interface MappedValidationResultListener extends PurchaseClient.ValidationResultListener<Map<String, Object>> {
    void onResponse(Map<String, Object> response);

    void onFailure(String result, Throwable error);
}

public class PCAppsFlyerModule extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;
    private Application application;
    private boolean isModuleEnabled;
    private ConnectorWrapper connectorWrapper;
    private String TAG = "AppsFlyer_" + PLUGIN_VERSION;

    public PCAppsFlyerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.application = (Application) reactContext.getApplicationContext();
        this.isModuleEnabled = BuildConfig.INCLUDE_CONNECTOR;
    }

    @Override
    public String getName() {
        return "PCAppsFlyer";
    }

    @ReactMethod
    public void create(ReadableMap config) {
        Log.d(TAG, "Attempting to create connector with config: " + config.toString());
        // Check if the module is enabled before proceeding
        if (!this.isModuleEnabled) {
            Log.e(TAG, "Failed to create connector: module is not enabled.\n" + ENABLE_MODULE_MESSAGE);
        }

        if (this.connectorWrapper == null) {
            boolean logSubscriptions = config.getBoolean("logSubscriptions");
            boolean logInApps = config.getBoolean("logInApps");
            boolean sandbox = config.getBoolean("sandbox");

            MappedValidationResultListener arsListener = this.arsListener;
            MappedValidationResultListener viapListener = this.viapListener;

            // Instantiate the ConnectorWrapper with the config parameters.
            this.connectorWrapper = new ConnectorWrapper(
                    this.reactContext,
                    logSubscriptions,
                    logInApps,
                    sandbox,
                    arsListener,
                    viapListener
            );
            Log.d(TAG, "The Purchase Connector initiated successfully.");
        } else {
            // ConnectorWrapper is already configured, log an error message.
            Log.e(TAG, "The Purchase Connector is already configured and cannot be created again.");
        }
    }

    @ReactMethod
    public void startObservingTransactions() {
        if (isModuleEnabled) {
            connectorWrapper.startObservingTransactions();
            Log.d(TAG, "Start Observing Transactions...");
        } else {
            Log.e(TAG, "Module is not enabled.\n" + ENABLE_MODULE_MESSAGE);
        }
    }

    @ReactMethod
    public void stopObservingTransactions() {
        if (isModuleEnabled) {
            connectorWrapper.stopObservingTransactions();
            Log.d(TAG, "Stopped Observing Transactions...");
        } else {
            Log.e(TAG, "Module is not enabled.\n" + ENABLE_MODULE_MESSAGE);
        }
    }

    // Initialization of the ARSListener
    private final MappedValidationResultListener arsListener = new MappedValidationResultListener() {
        @Override
        public void onFailure(String result, Throwable error) {
            handleError(EVENT_SUBSCRIPTION_VALIDATION_FAILURE, result, error);
        }

        @Override
        public void onResponse(Map<String, Object> response) {
            WritableMap writableMap = RNUtil.toWritableMap(response);
            JSONObject json = RNUtil.readableMapToJson(writableMap);
            handleSuccess(EVENT_SUBSCRIPTION_VALIDATION_SUCCESS, json);
        }
    };

    // Initialization of the VIAPListener
    private final MappedValidationResultListener viapListener = new MappedValidationResultListener() {
        @Override
        public void onFailure(String result, Throwable error) {
            handleError(EVENT_IN_APP_PURCHASE_VALIDATION_FAILURE, result, error);
        }

        @Override
        public void onResponse(Map<String, Object> response) {
            WritableMap writableMap = RNUtil.toWritableMap(response);
            JSONObject json = RNUtil.readableMapToJson(writableMap);
            handleSuccess(EVENT_IN_APP_PURCHASE_VALIDATION_SUCCESS, json);
        }
    };

    //HELPER METHODS
    private void handleSuccess(String eventName, JSONObject response){
        sendEvent(reactContext,eventName, response);
    }

    private void handleError(String eventName, String result, Throwable error) {
        WritableMap resMap = Arguments.createMap();
        resMap.putString("result", result);
        resMap.putMap("error", error != null ? errorToMap(error) : null);
        sendEvent(reactContext,eventName, resMap.toString());
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           Object params) {
        Log.d("ReactNativeJS", "Event: " + eventName + ", params: " + params.toString());
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private WritableMap errorToMap(Throwable error) {
        JSONObject errorJson = new JSONObject(this.toMap(error));
        WritableMap errorMap = RNUtil.jsonToWritableMap(errorJson);
        return errorMap;
    }

    private Map<String, Object> toMap(Throwable throwable) {
        Map<String, Object> map = new HashMap<>();
        map.put("type", throwable.getClass().getSimpleName());
        map.put("message", throwable.getMessage());
        map.put("stacktrace", String.join("\n", Arrays.stream(throwable.getStackTrace()).map(StackTraceElement::toString).toArray(String[]::new)));
        map.put("cause", throwable.getCause() != null ? toMap(throwable.getCause()) : null);
        return map;
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}

class ConnectorWrapper implements PurchaseClient {
    private final PurchaseClient connector;

    public ConnectorWrapper(Context context, boolean logSubs, boolean logInApps, boolean sandbox,
                            MappedValidationResultListener subsListener, MappedValidationResultListener inAppListener) {
        this.connector = new Builder(context, Store.GOOGLE)
                .setSandbox(sandbox)
                .logSubscriptions(logSubs)
                .autoLogInApps(logInApps)
                .setSubscriptionValidationResultListener(new SubscriptionPurchaseValidationResultListener() {
                    @Override
                    public void onResponse(Map<String, ? extends SubscriptionValidationResult> result) {
                        if (result != null) {
                            Map<String, Object> mappedResults = result.entrySet().stream()
                                    .collect(Collectors.toMap(Map.Entry::getKey, entry -> toJsonMap(entry.getValue())));
                            subsListener.onResponse(mappedResults);
                        } else {
                            subsListener.onResponse(null);
                        }
                    }

                    @Override
                    public void onFailure(String result, Throwable error) {
                        subsListener.onFailure(result, error);
                    }
                })
                .setInAppValidationResultListener(new InAppPurchaseValidationResultListener() {
                    @Override
                    public void onResponse(Map<String, ? extends InAppPurchaseValidationResult> result) {
                        if (result != null && !result.isEmpty()) {
                            Log.d("AppsFlyer", "onResponse: " + result);

                            Map.Entry<String, ? extends InAppPurchaseValidationResult> entry = result.entrySet().iterator().next();
                            Map<String, Object> innerJsonMap = toJsonMap(entry.getValue());

                            inAppListener.onResponse(innerJsonMap);
                        } else {
                            // There's no result or it's empty, handle this case accordingly.
                            inAppListener.onResponse(null);
                        }
                    }

                    @Override
                    public void onFailure(String result, Throwable error) {
                        inAppListener.onFailure(result, error);
                    }
                })
                .build();
    }

    /**
     * Starts observing all incoming transactions from the play store.
     */
    @Override
    public void startObservingTransactions() {
        connector.startObservingTransactions();
    }

    /**
     * Stops observing all incoming transactions from the play store.
     */
    @Override
    public void stopObservingTransactions() {
        connector.stopObservingTransactions();
    }

    private Map<String, Object> toJsonMap(SubscriptionPurchase subscriptionPurchase) {
        Map<String, Object> map = new HashMap<>();
        map.put("acknowledgementState", subscriptionPurchase.getAcknowledgementState());
        map.put("canceledStateContext", subscriptionPurchase.getCanceledStateContext() != null ? toJsonMap(subscriptionPurchase.getCanceledStateContext()) : null);
        map.put("externalAccountIdentifiers", subscriptionPurchase.getExternalAccountIdentifiers() != null ? toJsonMap(subscriptionPurchase.getExternalAccountIdentifiers()) : null);
        map.put("kind", subscriptionPurchase.getKind());
        map.put("latestOrderId", subscriptionPurchase.getLatestOrderId());
        map.put("lineItems", subscriptionPurchase.getLineItems().stream().map(this::toJsonMap).collect(Collectors.toList()));
        map.put("linkedPurchaseToken", subscriptionPurchase.getLinkedPurchaseToken());
        map.put("pausedStateContext", subscriptionPurchase.getPausedStateContext() != null ? toJsonMap(subscriptionPurchase.getPausedStateContext()) : null);
        map.put("regionCode", subscriptionPurchase.getRegionCode());
        map.put("startTime", subscriptionPurchase.getStartTime());
        map.put("subscribeWithGoogleInfo", subscriptionPurchase.getSubscribeWithGoogleInfo() != null ? toJsonMap(subscriptionPurchase.getSubscribeWithGoogleInfo()) : null);
        map.put("subscriptionState", subscriptionPurchase.getSubscriptionState());
        map.put("testPurchase", subscriptionPurchase.getTestPurchase() != null ? toJsonMap(subscriptionPurchase.getTestPurchase()) : null);
        return map;
    }

    private Map<String, Object> toJsonMap(CanceledStateContext canceledStateContext) {
        Map<String, Object> map = new HashMap<>();
        map.put("developerInitiatedCancellation", canceledStateContext.getDeveloperInitiatedCancellation() != null ? toJsonMap(canceledStateContext.getDeveloperInitiatedCancellation()) : null);
        map.put("replacementCancellation", canceledStateContext.getReplacementCancellation() != null ? toJsonMap(canceledStateContext.getReplacementCancellation()) : null);
        map.put("systemInitiatedCancellation", canceledStateContext.getSystemInitiatedCancellation() != null ? toJsonMap(canceledStateContext.getSystemInitiatedCancellation()) : null);
        map.put("userInitiatedCancellation", canceledStateContext.getUserInitiatedCancellation() != null ? toJsonMap(canceledStateContext.getUserInitiatedCancellation()) : null);
        return map;
    }

    private Map<String, Object> toJsonMap(DeveloperInitiatedCancellation developerInitiatedCancellation) {
        return new HashMap<>();
    }

    private Map<String, Object> toJsonMap(ReplacementCancellation replacementCancellation) {
        return new HashMap<>();
    }

    private Map<String, Object> toJsonMap(SystemInitiatedCancellation systemInitiatedCancellation) {
        return new HashMap<>();
    }

    private Map<String, Object> toJsonMap(UserInitiatedCancellation userInitiatedCancellation) {
        Map<String, Object> map = new HashMap<>();
        map.put("cancelSurveyResult", userInitiatedCancellation.getCancelSurveyResult() != null ? toJsonMap(userInitiatedCancellation.getCancelSurveyResult()) : null);
        map.put("cancelTime", userInitiatedCancellation.getCancelTime());
        return map;
    }

    private Map<String, Object> toJsonMap(CancelSurveyResult cancelSurveyResult) {
        Map<String, Object> map = new HashMap<>();
        map.put("reason", cancelSurveyResult.getReason());
        map.put("reasonUserInput", cancelSurveyResult.getReasonUserInput());
        return map;
    }

    private Map<String, Object> toJsonMap(ExternalAccountIdentifiers externalAccountIdentifiers) {
        Map<String, Object> map = new HashMap<>();
        map.put("externalAccountId", externalAccountIdentifiers.getExternalAccountId());
        map.put("obfuscatedExternalAccountId", externalAccountIdentifiers.getObfuscatedExternalAccountId());
        map.put("obfuscatedExternalProfileId", externalAccountIdentifiers.getObfuscatedExternalProfileId());
        return map;
    }

    private Map<String, Object> toJsonMap(SubscriptionPurchaseLineItem subscriptionPurchaseLineItem) {
        Map<String, Object> map = new HashMap<>();
        map.put("autoRenewingPlan", subscriptionPurchaseLineItem.getAutoRenewingPlan() != null ? toJsonMap(subscriptionPurchaseLineItem.getAutoRenewingPlan()) : null);
        map.put("deferredItemReplacement", subscriptionPurchaseLineItem.getDeferredItemReplacement() != null ? toJsonMap(subscriptionPurchaseLineItem.getDeferredItemReplacement()) : null);
        map.put("expiryTime", subscriptionPurchaseLineItem.getExpiryTime());
        map.put("offerDetails", subscriptionPurchaseLineItem.getOfferDetails() != null ? toJsonMap(subscriptionPurchaseLineItem.getOfferDetails()) : null);
        map.put("prepaidPlan", subscriptionPurchaseLineItem.getPrepaidPlan() != null ? toJsonMap(subscriptionPurchaseLineItem.getPrepaidPlan()) : null);
        map.put("productId", subscriptionPurchaseLineItem.getProductId());
        return map;
    }

    private Map<String, Object> toJsonMap(OfferDetails offerDetails) {
        Map<String, Object> map = new HashMap<>();
        map.put("offerTags", offerDetails.getOfferTags());
        map.put("basePlanId", offerDetails.getBasePlanId());
        map.put("offerId", offerDetails.getOfferId());
        return map;
    }

    private Map<String, Object> toJsonMap(AutoRenewingPlan autoRenewingPlan) {
        Map<String, Object> map = new HashMap<>();
        map.put("autoRenewEnabled", autoRenewingPlan.getAutoRenewEnabled());
        map.put("priceChangeDetails", autoRenewingPlan.getPriceChangeDetails() != null ? toJsonMap(autoRenewingPlan.getPriceChangeDetails()) : null);
        return map;
    }

    private Map<String, Object> toJsonMap(SubscriptionItemPriceChangeDetails subscriptionItemPriceChangeDetails) {
        Map<String, Object> map = new HashMap<>();
        map.put("expectedNewPriceChargeTime", subscriptionItemPriceChangeDetails.getExpectedNewPriceChargeTime());
        map.put("newPrice", subscriptionItemPriceChangeDetails.getNewPrice() != null ? toJsonMap(subscriptionItemPriceChangeDetails.getNewPrice()) : null);
        map.put("priceChangeMode", subscriptionItemPriceChangeDetails.getPriceChangeMode());
        map.put("priceChangeState", subscriptionItemPriceChangeDetails.getPriceChangeState());
        return map;
    }

    private Map<String, Object> toJsonMap(Money money) {
        Map<String, Object> map = new HashMap<>();
        map.put("currencyCode", money.getCurrencyCode());
        map.put("nanos", money.getNanos());
        map.put("units", money.getUnits());
        return map;
    }

    private Map<String, Object> toJsonMap(DeferredItemReplacement deferredItemReplacement) {
        Map<String, Object> map = new HashMap<>();
        map.put("productId", deferredItemReplacement.getProductId());
        return map;
    }

    private Map<String, Object> toJsonMap(PrepaidPlan prepaidPlan) {
        Map<String, Object> map = new HashMap<>();
        map.put("allowExtendAfterTime", prepaidPlan.getAllowExtendAfterTime());
        return map;
    }

    private Map<String, Object> toJsonMap(PausedStateContext pausedStateContext) {
        Map<String, Object> map = new HashMap<>();
        map.put("autoResumeTime", pausedStateContext.getAutoResumeTime());
        return map;
    }

    private Map<String, Object> toJsonMap(SubscribeWithGoogleInfo subscribeWithGoogleInfo) {
        Map<String, Object> map = new HashMap<>();
        map.put("emailAddress", subscribeWithGoogleInfo.getEmailAddress());
        map.put("familyName", subscribeWithGoogleInfo.getFamilyName());
        map.put("givenName", subscribeWithGoogleInfo.getGivenName());
        map.put("profileId", subscribeWithGoogleInfo.getProfileId());
        map.put("profileName", subscribeWithGoogleInfo.getProfileName());
        return map;
    }

    public Map<String, Object> toJsonMap(TestPurchase testPurchase) {
        return new HashMap<>();
    }

    private Map<String, Object> toJsonMap(ProductPurchase productPurchase) {
        Map<String, Object> map = new HashMap<>();
        map.put("kind", productPurchase.getKind());
        map.put("purchaseTimeMillis", productPurchase.getPurchaseTimeMillis());
        map.put("purchaseState", productPurchase.getPurchaseState());
        map.put("consumptionState", productPurchase.getConsumptionState());
        map.put("developerPayload", productPurchase.getDeveloperPayload());
        map.put("orderId", productPurchase.getOrderId());
        map.put("purchaseType", productPurchase.getPurchaseType());
        map.put("acknowledgementState", productPurchase.getAcknowledgementState());
        map.put("purchaseToken", productPurchase.getPurchaseToken());
        map.put("productId", productPurchase.getProductId());
        map.put("quantity", productPurchase.getQuantity());
        map.put("obfuscatedExternalAccountId", productPurchase.getObfuscatedExternalAccountId());
        map.put("obfuscatedExternalProfileId", productPurchase.getObfuscatedExternalProfileId());
        map.put("regionCode", productPurchase.getRegionCode());
        return map;
    }

    private Map<String, Object> toJsonMap(InAppPurchaseValidationResult inAppPurchaseValidationResult) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", inAppPurchaseValidationResult.getSuccess());
        map.put("productPurchase", inAppPurchaseValidationResult.getProductPurchase() != null ? toJsonMap(inAppPurchaseValidationResult.getProductPurchase()) : null);
        map.put("failureData", inAppPurchaseValidationResult.getFailureData() != null ? toJsonMap(inAppPurchaseValidationResult.getFailureData()) : null);
        return map;
    }

    private Map<String, Object> toJsonMap(SubscriptionValidationResult subscriptionValidationResult) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", subscriptionValidationResult.getSuccess());
        map.put("subscriptionPurchase", subscriptionValidationResult.getSubscriptionPurchase() != null ? toJsonMap(subscriptionValidationResult.getSubscriptionPurchase()) : null);
        map.put("failureData", subscriptionValidationResult.getFailureData() != null ? toJsonMap(subscriptionValidationResult.getFailureData()) : null);
        return map;
    }

    private Map<String, Object> toJsonMap(ValidationFailureData validationFailureData) {
        Map<String, Object> map = new HashMap<>();
        map.put("status", validationFailureData.getStatus());
        map.put("description", validationFailureData.getDescription());
        return map;
    }
}