package com.appsflyer.reactnative;

import com.appsflyer.reactnative.BuildConfig;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

public class RNAppsFlyerPackage implements ReactPackage {

    public RNAppsFlyerPackage() {
    }


    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        
        // Feature flag: Use RPC module if enabled, otherwise use legacy module
        if (BuildConfig.USE_RPC_MODULE) {
            modules.add(new RNAppsFlyerRPCModule(reactContext));
        } else {
            // Use reflection to load legacy module only when not using RPC module
            // This allows the class to be excluded from compilation when USE_RPC_MODULE=true
            try {
                Class<?> legacyModuleClass = Class.forName("com.appsflyer.reactnative.RNAppsFlyerModule");
                NativeModule legacyModule = (NativeModule) legacyModuleClass
                    .getConstructor(ReactApplicationContext.class)
                    .newInstance(reactContext);
                modules.add(legacyModule);
            } catch (Exception e) {
                throw new RuntimeException("Failed to load RNAppsFlyerModule. Make sure USE_RPC_MODULE is false or the legacy module is available.", e);
            }
        }
        
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
