package com.appsflyer.reactnative;

import android.util.Log;

import com.appsflyer.api.PurchaseClient;
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

public interface MappedValidationResultListener extends PurchaseClient.ValidationResultListener<Map<String, Object>> {
    void onResponse(Map<String, Object> response);

    void onFailure(String result, Throwable error);
}

public class PCAppsFlyerModule extends ReactContextBaseJavaModule {

    //WeakReference prevents memory leaks by allowing the garbage collector to collect the ReactApplicationContext when it’s no longer needed.
    private WeakReference<ReactApplicationContext> reactContext;
    private boolean isModuleEnabled;
    private ConnectorWrapper connectorWrapper;
    private String TAG = "AppsFlyer_" + PLUGIN_VERSION;

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
        Log.d(TAG, "Attempting to create connector with config: " + config.toString());
        ReactApplicationContext context = this.reactContext.get();

        if (this.connectorWrapper == null) {
            boolean logSubscriptions = config.getBoolean("logSubscriptions");
            boolean logInApps = config.getBoolean("logInApps");
            boolean sandbox = config.getBoolean("sandbox");

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
            Log.d(TAG, "The Purchase Connector initiated successfully.");
        } else {
            // ConnectorWrapper is already configured, log an error message.
            Log.e(TAG, "The Purchase Connector is already configured and cannot be created again.");
        }
    }

    @ReactMethod
    public void startObservingTransactions() {
        connectorWrapper.startObservingTransactions();
        Log.d(TAG, "Start Observing Transactions...");
    }

    @ReactMethod
    public void stopObservingTransactions() {
        connectorWrapper.stopObservingTransactions();
        Log.d(TAG, "Stopped Observing Transactions...");  
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