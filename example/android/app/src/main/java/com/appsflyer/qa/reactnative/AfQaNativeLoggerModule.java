package com.appsflyer.qa.reactnative;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AfQaNativeLoggerModule extends ReactContextBaseJavaModule {

    private static final String TAG = "AF_QA";

    AfQaNativeLoggerModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "AfQaNativeLogger";
    }

    @ReactMethod
    public void log(String message) {
        Log.d(TAG, message);
    }
}
