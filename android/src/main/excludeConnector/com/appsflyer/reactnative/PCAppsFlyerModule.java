package com.appsflyer.reactnative;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PCAppsFlyerModule extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;
    private Application application;

    public PCAppsFlyerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.application = (Application) reactContext.getApplicationContext();
        Log.d("AppsFlyer", "PurchaseConnector inclusion status: " + BuildConfig.INCLUDE_CONNECTOR);
    }

    @Override
    public String getName() {
        return "PCAppsFlyer";
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