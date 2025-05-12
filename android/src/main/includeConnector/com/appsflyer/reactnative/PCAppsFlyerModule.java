package com.appsflyer.reactnative;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

import static com.appsflyer.reactnative.RNAppsFlyerConstants.*;
import com.appsflyer.reactnative.MappedValidationResultListener;

public class PCAppsFlyerModule extends ReactContextBaseJavaModule {

    //WeakReference prevents memory leaks by allowing the garbage collector to collect the ReactApplicationContext when it's no longer needed.
    private WeakReference<ReactApplicationContext> reactContext;
    private boolean isModuleEnabled;
    private ConnectorWrapper connectorWrapper;
    private String TAG = "AppsFlyer_" + PLUGIN_VERSION;

    private Map<String, Object> subscriptionPurchaseParams;
    private Map<String, Object> inAppPurchaseParams;

    public PCAppsFlyerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = new WeakReference<>(reactContext);
        this.isModuleEnabled = BuildConfig.INCLUDE_CONNECTOR;
        Log.d("AppsFlyer_", "PurchaseConnector inclusion status: " + this.isModuleEnabled);
    }

    @Override
    public String getName() {
        return "PCAppsFlyer";
    }

    @ReactMethod
    public void create(ReadableMap config) {
        if (!isModuleEnabled) {
            Log.e(TAG, "PurchaseConnector is not enabled. Please enable it in your build.gradle");
            return;
        }

        Log.d(TAG, "Attempting to create connector with config: " + config.toString());
        ReactApplicationContext context = this.reactContext.get();
        if (context == null) {
            Log.e(TAG, "React context is null");
            return;
        }

        if (this.connectorWrapper == null) {
            boolean logSubscriptions = config.getBoolean("logSubscriptions");
            boolean logInApps = config.getBoolean("logInApps");
            boolean sandbox = config.getBoolean("sandbox");

            // Optional: Log that storeKitVersion is ignored on Android (for debugging purposes)
            if (config.hasKey("storeKitVersion")) {
                String storeKitVersion = config.getString("storeKitVersion");
                Log.d(TAG, "storeKitVersion (" + storeKitVersion + ") is ignored on Android.");
            }

            MappedValidationResultListener arsListener = this.arsListener;
            MappedValidationResultListener viapListener = this.viapListener;

            // Instantiate the ConnectorWrapper with the config parameters.
            this.connectorWrapper = new ConnectorWrapper(
                    context,
                    logSubscriptions,
                    logInApps,
                    sandbox,
                    arsListener,
                    viapListener
            );

            // Set up the data sources if they were previously set
            if (subscriptionPurchaseParams != null) {
                connectorWrapper.setSubscriptionPurchaseEventDataSource(subscriptionPurchaseParams);
            }

            if (inAppPurchaseParams != null) {
                connectorWrapper.setInAppPurchaseEventDataSource(inAppPurchaseParams);
            }

            Log.d(TAG, "The Purchase Connector initiated successfully.");
        } else {
            Log.e(TAG, "The Purchase Connector is already configured and cannot be created again.");
        }
    }

    @ReactMethod
    public void startObservingTransactions() {
        if (!isModuleEnabled || connectorWrapper == null) {
            Log.e(TAG, "PurchaseConnector is not enabled or not initialized");
            return;
        }
        connectorWrapper.startObservingTransactions();
        Log.d(TAG, "Start Observing Transactions...");
    }

    @ReactMethod
    public void stopObservingTransactions() {
        if (!isModuleEnabled || connectorWrapper == null) {
            Log.e(TAG, "PurchaseConnector is not enabled or not initialized");
            return;
        }
        connectorWrapper.stopObservingTransactions();
        Log.d(TAG, "Stopped Observing Transactions...");  
    }

    @ReactMethod
    public void setSubscriptionPurchaseEventDataSource(ReadableMap dataSource) {
        if (!isModuleEnabled) {
            Log.e(TAG, "PurchaseConnector is not enabled");
            return;
        }
        Log.d(TAG, "Setting subscription purchase event data source");
        if (dataSource == null) {
            Log.e(TAG, "dataSource is required");
            return;
        }
        if (connectorWrapper == null) {
            Log.e(TAG, "Connector not initialized. Call create() first.");
            return;
        }
        subscriptionPurchaseParams = RNUtil.toMap(dataSource);
        connectorWrapper.setSubscriptionPurchaseEventDataSource(subscriptionPurchaseParams);
    }

    @ReactMethod
    public void setInAppPurchaseEventDataSource(ReadableMap dataSource) {
        if (!isModuleEnabled) {
            Log.e(TAG, "PurchaseConnector is not enabled");
            return;
        }
        Log.d(TAG, "Setting in-app purchase event data source");
        if (dataSource == null) {
            Log.e(TAG, "dataSource is required");
            return;
        }
        if (connectorWrapper == null) {
            Log.e(TAG, "Connector not initialized. Call create() first.");
            return;
        }
        inAppPurchaseParams = RNUtil.toMap(dataSource);
        connectorWrapper.setInAppPurchaseEventDataSource(inAppPurchaseParams);
    }

    // Initialization of the ARSListener
    private final MappedValidationResultListener arsListener = new MappedValidationResultListener() {
        @Override
        public void onFailure(String result, Throwable error) {
            handleError(EVENT_SUBSCRIPTION_VALIDATION_FAILURE, result, error);
        }

        @Override
        public void onResponse(Map<String, Object> response) {
            if (response != null) {
                WritableMap writableMap = RNUtil.toWritableMap(response);
                handleSuccess(EVENT_SUBSCRIPTION_VALIDATION_SUCCESS, writableMap);
            }
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
            handleSuccess(EVENT_IN_APP_PURCHASE_VALIDATION_SUCCESS, writableMap);
        }
    };

    //HELPER METHODS
    private void handleSuccess(String eventName, WritableMap response){
        sendEvent(eventName, response);
    }

    private void handleError(String eventName, String result, Throwable error) {
        WritableMap resMap = Arguments.createMap();
        resMap.putString("result", result);
        resMap.putMap("error", error != null ? errorToMap(error) : null);
        sendEvent(eventName, resMap.toString());
    }

    private void sendEvent(String eventName, Object params) {
        ReactApplicationContext context = reactContext.get(); // Retrieve the context from WeakReference
        if (context != null && context.hasActiveReactInstance()) { // Ensure context is not null and active
            Log.d("ReactNativeJS", "Event: " + eventName + ", params: " + params.toString());
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit(eventName, params);
        } else {
            Log.d("ReactNativeJS", "Skipping event: " + eventName + " (ReactContext is null or inactive)");
        }
    }

    private WritableMap errorToMap(Throwable error) {
        JSONObject errorJson = new JSONObject(this.throwableToMap(error));
        WritableMap errorMap = RNUtil.jsonToWritableMap(errorJson);
        return errorMap;
    }

    private Map<String, Object> throwableToMap(Throwable throwable) {
        Map<String, Object> map = new HashMap<>();
        map.put("type", throwable.getClass().getSimpleName());
        map.put("message", throwable.getMessage());
        map.put("stacktrace", String.join("\n", Arrays.stream(throwable.getStackTrace()).map(StackTraceElement::toString).toArray(String[]::new)));
        map.put("cause", throwable.getCause() != null ? throwableToMap(throwable.getCause()) : null);
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