---
title: ESP (Email Service Provider) Integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 14
hidden: false
---

## 📧 What is ESP Support?

ESP (Email Service Provider) support allows AppsFlyer to handle deep links that are wrapped by email service providers. When users click links in emails, ESP services often wrap the original URL with their own tracking domains. This can break deep linking functionality. ESP support resolves these wrapped URLs to extract the original deep link.


## 🚀 Prerequisites

Before integrating ESP support, ensure you have:

- ✅ **AppsFlyer React Native SDK** installed (`react-native-appsflyer`)
- ✅ **Basic AppsFlyer integration** working (SDK initialization, conversion data)
- ✅ **Deep linking** set up in your app (Universal Links for iOS, App Links for Android)
- ✅ **ESP domain list** from your email service provider(s)

---

## 📱 iOS Platform Preparation

### Step 1: Configure Associated Domains

**For Expo Projects:**

Add associated domains to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "associatedDomains": [
        "applinks:your-onelink-domain.onelink.me"
      ]
    }
  }
}
```

**For Native iOS Projects:**

1. Open your project in Xcode
2. Go to **Signing & Capabilities** tab
3. Add **Associated Domains** capability
4. Add your OneLink domain: `applinks:your-onelink-domain.onelink.me`

### Step 2: Configure AppDelegate for Deep Linking

Forward opened URLs / Universal Links to the AppsFlyer SDK via `AppsFlyerAttribution` from `AppDelegate` (there is no JavaScript API for this — `AppsFlyerLib`/`AppsFlyerAttribution` are already available as transitive dependencies of this plugin, no extra `pod` entry needed). `AppsFlyerAttribution` buffers calls that arrive before `init()` has configured the native SDK (e.g. a cold-start Universal Link) and replays them once it has — see [Deep linking integration](RN_DeepLinkIntegrate.md#ios-deeplink-setup). If your app also uses React Native's own `Linking` module for its own deep-link routing, call both `AppsFlyerAttribution.shared` and `RCTLinkingManager` from the same delegate methods:

```swift
import AppsFlyerLib
import react_native_appsflyer
import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)
    //...

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    AppsFlyerAttribution.shared.handleOpen(url, options: options)
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: restorationHandler)
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}
```

See [Deep linking integration](RN_DeepLinkIntegrate.md#ios-deeplink-setup) for the full native pattern (this plugin's Expo config plugin auto-injects the `openURL`/`continueUserActivity` and `handleLaunchOptions` calls above at `expo prebuild` time).

---

## 🤖 Android Platform Preparation

### Step 1: Configure App.json for Expo

**Add intentFilters to your `app.json`:**

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "your-onelink-domain.onelink.me"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        },
        {
          "action": "VIEW", 
          "data": [
            {
              "scheme": "your-custom-scheme"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Step 2: Configure AndroidManifest.xml

**Critical Configuration Points:**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
  
  <!-- Required permissions -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
  
  <!-- Queries for link handling -->
  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https"/>
    </intent>
  </queries>
  
  <application 
    android:name=".MainApplication"
    android:allowBackup="false"
    tools:replace="android:allowBackup">
    
    <activity 
      android:name=".MainActivity"
      android:launchMode="singleTask"
      android:exported="true">
      
      <!-- App Launcher Intent -->
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      
      <!-- Custom Scheme Deep Links -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="your-custom-scheme"/>
      </intent-filter>
      
      <!-- HTTPS Deep Links (App Links) -->
      <!-- NOTE: Remove autoVerify for testing without domain verification -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="your-onelink-domain.onelink.me"/>
      </intent-filter>
      
    </activity>
  </application>
</manifest>
```

**⚠️ Important Android Notes:**

1. **Remove `autoVerify="true"`** unless you have domain verification set up
2. **Add `tools:replace="android:allowBackup"`** to resolve AppsFlyer SDK conflicts
3. **Include `xmlns:tools` namespace** in the manifest root
4. **Don't include `package` attribute** in manifest (use namespace in build.gradle)

## ⚛️ React Native Implementation

### Step 1: Configure ESP Domains

**Best Practice: List ESP domains first, OneLink domains below**

```javascript
/**
 * ESP (Email Service Provider) domains configuration
 * Best Practice: Add ESP domains first, then OneLink domains for reference
 */
const ESP_DOMAINS = [
  // ESP Provider Domains (add your actual ESP domains here)
  "reactn.esp-integrations1.com",
  "my-link.onelink.me"
];
```

### Step 2: Set Up setResolveDeepLinkURLs

**Configure ESP resolution right after SDK initialization:**

```javascript
import AppsFlyer from 'react-native-appsflyer';

/**
 * Configure ESP domains for deep link resolution.
 * Call this after init() — see Step 4 for where it fits in the call order.
 */
const configureESPDomains = () => {
  console.log('Configuring ESP domains:', ESP_DOMAINS);
  
  AppsFlyer.setResolveDeepLinkURLs(ESP_DOMAINS)
    .then((result) => {
      console.log('ESP domains configured successfully:', result);
    })
    .catch((error) => {
      console.error('ESP domain configuration failed:', error);
    });
};
```

### Step 3: Deep Link Handlers

**Create comprehensive ESP and deep link handling:**

```javascript
/**
 * Main ESP deep link handler
 */
const handleEspDeepLink = useCallback((deepLinkData: any) => {
    console.log('Deep Link Received:', deepLinkData);
    
    // Simply stringify and display the entire deep link data
    const formattedData = JSON.stringify(deepLinkData, null, 2);    
    console.log('Deep Link Data:', formattedData);
    
    let actualDeepLinkData = deepLinkData;
    
    // Check if this is a deferred or direct deep link
    if (actualDeepLinkData.isDeferred === true) {
      console.log('[AFSDK] This is a deferred deep link');
    } else {
      console.log('[AFSDK] This is a direct deep link');
      
      let originalLink = actualDeepLinkData.data?.['original_link'];
      
      if (originalLink && typeof originalLink === 'string') {
        console.log('[AFSDK] This is a resolved ESP flow');
        console.log('[AFSDK] Original Link:', originalLink);
        
        try {
          // Extract the host
          const url = new URL(originalLink);
          const host = url.hostname;
          
          if (host) {
            console.log('[AFSDK] Host:', host);
            
            // Check if the host part of `original_link` matches one of the ESP domains
            // This means this ESP link wraps another link
            if (ESP_DOMAINS.includes(host)) {
              console.log('[AFSDK] The ESP domain matches');
              
              // Check for link in both locations: clickEvent and directly in data
              let espLink = actualDeepLinkData.data?.clickEvent?.['link'];
              if (!espLink) {
                espLink = actualDeepLinkData.data?.['link'];
              }
              
              if (espLink && typeof espLink === 'string') {
                try {
                  const espUrl = new URL(espLink);
                  const espHost = espUrl.hostname;
                  
                  if (espHost) {
                    console.log('[AFSDK] ESP Host:', espHost);
                    
                    // The following `if` checks if the wrapped link should continue deep link or open the link in a browser.
                    // If the wrapped link ends with ".onelink.me" it is obviously a OneLink and will continue the Deep Link flow.
                    if (espHost.endsWith('.onelink.me')) {
                      console.log('[AFSDK] The ESP link is a OneLink link. Deep link continues normally');
                    } else {
                      console.log('[AFSDK] The ESP link is NOT a OneLink link. It will be opened in a browser');
                      console.log('[AFSDK] ESP marks to divert the link to the browser');
                      console.log('URL to open:', espUrl.toString());
                    }
                  } else {
                    console.log('[AFSDK] No host found in the ESP URL');
                  }
                } catch (error) {
                  console.log('[AFSDK] Invalid ESP URL:', error);
                }
              } else {
                console.log('[AFSDK] No link found in data');
              }
            } else {
              console.log('[AFSDK] ESP domain does not match configured domains');
              console.log('[AFSDK] Configured domains:', ESP_DOMAINS);
              console.log('[AFSDK] This appears to be a regular OneLink, not an ESP-wrapped link');
            }
          } else {
            console.log('[AFSDK] No host found in the original URL');
          }
        } catch (error) {
          console.log('[AFSDK] Invalid original URL:', error);
        }
      } else {
        console.log('[AFSDK] The original_link is not found');
        console.log('Regular Deep Link Data:', actualDeepLinkData.data);
      }
    }
  }, []);
```

### Step 4: SDK Initialization with ESP

**Complete SDK setup with ESP configuration:**

```javascript
import { useEffect } from 'react';
import { Platform } from 'react-native';

const initializeAppsFlyer = () => {
  console.log('Initializing AppsFlyer with ESP support...');

  // 1. Set up deep link listener — must be registered before init()
  AppsFlyer.registerDeepLinkListener({ onDeepLinking: handleEspDeepLink });

  // 2. Initialize SDK
  // `initSdk` was removed in 7.0.0 — use `init(devKey, appId)` instead (see MIGRATION.md).
  const devKey = Platform.OS === 'ios' 
    ? "YOUR_IOS_DEV_KEY"
    : "YOUR_ANDROID_DEV_KEY";

  AppsFlyer.init(devKey, "YOUR_IOS_APP_ID").then(
    () => {
      console.log("AppsFlyer SDK initialized successfully!");
    },
    (err) => {
      console.error("AppsFlyer SDK initialization error:", err);
    }
  );

  // 3. Configure ESP domains — after init(), synchronously
  configureESPDomains();

  // 4. Set up conversion data listener — after init(), synchronously
  AppsFlyer.registerConversionListener({
    onConversionDataSuccess: (res) => {
      console.log('Conversion Data:', res);
    },
    onConversionDataFail: (error) => {
      console.error('Conversion Data Error:', error);
    },
  });

  // 5. Start the SDK once the session is ready — the SDK never auto-starts (see RN_API.md#start)
  AppsFlyer.registerSessionReadyListener(() => {
    AppsFlyer.start().then(
      () => console.log('AppsFlyer SDK started!'),
      (err) => console.error('start failed', err)
    );
  });
};

// Initialize in useEffect
useEffect(() => {
  initializeAppsFlyer();
}, []);
```

---

## 🔧 Troubleshooting

### Common Android Issues

For general Android configuration issues (manifest merging, package attribute deprecation, autoVerify behavior, backup rules), refer to the [API reference](RN_API.md) and [AppsFlyer Android SDK documentation](https://dev.appsflyer.com/hc/docs/install-android-sdk).

**ESP-Specific: Domain Verification Issues**

When deep links from emails open the Play Store instead of your app, the domain may be disabled in Android's app link settings.

**Diagnosis:**
```bash
adb shell pm get-app-links com.yourcompany.yourapp
```

**Solution:**
```bash
# Enable domain for your app
adb shell pm set-app-links-user-selection --package com.yourcompany.yourapp --user 0 true your-onelink-domain.onelink.me

# Test the fix
adb shell am force-stop com.yourcompany.yourapp
adb shell am start -W -a android.intent.action.VIEW -d "https://your-onelink-domain.onelink.me/test"
```

### Common iOS Issues

**1. Universal Links not working:**
- Verify associated domains in app.json/Xcode
- Check AppDelegate deep link handling
- Test with iOS Simulator using xcrun

**2. Deep links not triggering:**
- Ensure `AppsFlyer.registerDeepLinkListener(...)` is registered synchronously before `init()`'s promise settles (see [Initialization Flow](RN_API.md#initialization-flow))
- Verify ESP domains are configured before SDK init

---

## 🧪 Testing Your ESP Integration

### Quick Deep Link Testing

**Android Testing:**
```bash
# 1. Check if app is installed
adb shell pm list packages | grep com.yourcompany.yourapp

# 2. Check app link verification status
adb shell pm get-app-links com.yourcompany.yourapp

# 3. Test deep link (cold start)
adb shell am force-stop com.yourcompany.yourapp
adb shell am start -W -a android.intent.action.VIEW -d "https://your-onelink-domain.onelink.me/test"

# 4. Test deep link (warm start)
adb shell am start -W -a android.intent.action.VIEW -d "https://your-onelink-domain.onelink.me/test"
```

**iOS Testing:**
```bash
# Test with iOS Simulator
xcrun simctl openurl booted "https://your-onelink-domain.onelink.me/test"
```
---

## 📖 Support Resources

- [AppsFlyer React Native Plugin](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin)
- [iOS ESP Setup Guide](https://dev.appsflyer.com/hc/docs/dl_ios_esp_2_setup)
- [Android ESP Setup Guide](https://dev.appsflyer.com/hc/docs/dl_android_esp_2_setup)

---