package com.appsflyer.reactnative;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PCAppsFlyerModule extends ReactContextBaseJavaModule {

    public PCAppsFlyerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d("AppsFlyer", "PurchaseConnector inclusion status: " + BuildConfig.INCLUDE_CONNECTOR);
    }

    @Override
    public String getName() {
        return "PCAppsFlyer";
    }

    @ReactMethod
    public void addListener(String eventName) {
        // required by NativeEventEmitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // required by NativeEventEmitter
    }
}