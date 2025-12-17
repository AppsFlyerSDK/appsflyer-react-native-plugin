---
title: ESP (Email Service Provider) Integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 14
hidden: false
---

## 📧 What is ESP Support?

ESP (Email Service Provider) support allows AppsFlyer to handle deep links that are wrapped by email service providers. When users click links in emails, ESP services often wrap the original URL with their own tracking domains. This can break deep linking functionality. ESP support resolves these wrapped URLs to extract the original deep link.

### How ESP Works:
1. **Email Campaign**: Your email contains a deep link to your app
2. **ESP Wrapping**: Email provider wraps your link with their tracking domain
3. **User Clicks**: User clicks the wrapped link from their email
4. **ESP Resolution**: AppsFlyer resolves the wrapped URL to get the original link
5. **Decision**: If original link is a OneLink → continue deep linking; if web URL → open in browser

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

### Step 2: Configure Bridging Header

**For Expo Projects or Swift AppDelegate:**

Add AppsFlyer React Native plugin to your bridging header file (e.g., `your-app-name-Bridging-Header.h`):

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

// Add AppsFlyer React Native plugin
#import "RNAppsFlyer.h"
```

**⚠️ Critical Note:** Without adding `RNAppsFlyer.h` to the bridging header, the AppsFlyer SDK won't be accessible from Swift code and deep linking will fail.

### Step 3: Configure AppDelegate for Deep Linking

Ensure your `AppDelegate.swift` includes AppsFlyer attribution handling:

```swift
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
    //...

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    AppsFlyerAttribution.shared().handleOpen(url, options: options)
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    
    let selector = NSSelectorFromString("continueUserActivity:restorationHandler:")
    let afAttribution = AppsFlyerAttribution.shared()
    if afAttribution.responds(to: selector) {
        _ = afAttribution.perform(selector, with: userActivity, with: restorationHandler)
    }
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}
```

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

**Configure ESP resolution BEFORE SDK initialization:**

```javascript
import { AppsFlyer } from 'react-native-appsflyer';

/**
 * Configure ESP domains for deep link resolution
 * This MUST be called before AppsFlyer SDK initialization
 */
const configureESPDomains = () => {
  console.log('🔗 Configuring ESP domains:', ESP_DOMAINS);
  
  AppsFlyer.setResolveDeepLinkURLs(
    ESP_DOMAINS,
    (result) => {
      console.log('✅ ESP domains configured successfully:', result);
    },
    (error) => {
      console.error('❌ ESP domain configuration failed:', error);
    }
  );
};
```

### Step 3: Deep Link Handlers

**Create comprehensive ESP and deep link handling:**

```javascript
/**
 * Main ESP deep link handler
 */
const handleDeepLink = useCallback((deepLinkData: any) => {
    console.log('🔗 Deep Link Received:', deepLinkData);
    
    // Simply stringify and display the entire deep link data
    const formattedData = JSON.stringify(deepLinkData, null, 2);    
    console.log('📱 Deep Link Data:', formattedData);
    
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
                      console.log('📱 Would open in browser:', espUrl.toString());
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
        console.log('📋 Regular Deep Link Data:', actualDeepLinkData.data);
      }
    }
  });
```

### Step 4: SDK Initialization with ESP

**Complete SDK setup with ESP configuration:**

```javascript
import { useEffect } from 'react';
import { Platform } from 'react-native';

const initializeAppsFlyer = () => {
  console.log('🚀 Initializing AppsFlyer with ESP support...');

  // 1. Configure ESP domains FIRST
  configureESPDomains();

  // 2. Set up deep link listener
  AppsFlyer.onDeepLink(handleEspDeepLink);

  // 3. Set up conversion data listener
  AppsFlyer.onInstallConversionData((res) => {
    console.log('📊 Conversion Data:', res);
  });

  AppsFlyer.onInstallConversionFailure((error) => {
    console.error('❌ Conversion Data Error:', error);
  });

  // 4. Initialize SDK
  const devKey = Platform.OS === 'ios' 
    ? "YOUR_IOS_DEV_KEY"
    : "YOUR_ANDROID_DEV_KEY";

  AppsFlyer.initSdk(
    {
      devKey: devKey,
      appId: "YOUR_IOS_APP_ID", // iOS only
      isDebug: true,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true, // ✅ REQUIRED for ESP support
      timeToWaitForATTUserAuthorization: 15,
    },
    () => {
      console.log("✅ AppsFlyer SDK initialized successfully!");
    },
    (err) => {
      console.error("❌ AppsFlyer SDK initialization error:", err);
    }
  );
};

// Initialize in useEffect
useEffect(() => {
  initializeAppsFlyer();
}, []);
```

---

## 🔧 Troubleshooting

### Common Android Issues

**1. Deep links open Google Play instead of app:**
- Remove `android:autoVerify="true"` from intent filters
- Test with ADB for direct app opening
- Ensure app is installed and intent filters are correct

**2. Email deep links redirect to Play Store (Domain Disabled):**

This is a common issue where clicking deep links from emails opens the Play Store instead of your app. This happens when the domain is disabled in Android's app link settings.

**Diagnosis:**
```bash
# Check if your app's domain is disabled
adb shell pm get-app-links com.yourcompany.yourapp
```

Look for your domain in the "Selection state" → "Disabled" section.

**Solution:**
```bash
# Enable domain for your app (replace with your actual package name and domain)
adb shell pm set-app-links-user-selection --package com.yourcompany.yourapp --user 0 true your-onelink-domain.onelink.me

# Verify the fix
adb shell pm get-app-links com.yourcompany.yourapp
```

**Testing:**
```bash
# Test deep link after fix
adb shell am force-stop com.yourcompany.yourapp
adb shell am start -W -a android.intent.action.VIEW -d "https://your-onelink-domain.onelink.me/test"
```

**Production Note:** This is a testing solution. For production apps, consider:
- Domain verification (requires access to domain)
- User education about setting app as default handler
- Fallback handling for when app isn't the default handler

**3. Manifest merger conflicts:**
```xml
<!-- Add tools namespace and replace directive -->
<manifest xmlns:tools="http://schemas.android.com/tools">
  <application android:allowBackup="false" tools:replace="android:allowBackup">
```
See [AppsFlyer Android SDK documentation](https://dev.appsflyer.com/hc/docs/install-android-sdk#backup-rules) for more details.

**4. Package attribute deprecated:**
- Remove `package="com.yourapp"` from AndroidManifest.xml
- Use `namespace` in build.gradle instead

**5. Build Cache Issues:**

If experiencing persistent build failures, perform a complete clean build:
```bash
# Clean everything
rm -rf node_modules
rm -rf ios/Pods
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/build

# Reinstall dependencies
npm install
cd ios && pod install && cd ..

# Clean build
npx expo run:android / ios --clear
```

### Common iOS Issues

**1. Universal Links not working:**
- Verify associated domains in app.json/Xcode
- Check AppDelegate deep link handling
- Test with iOS Simulator using xcrun

**2. Deep links not triggering:**
- Ensure `onDeepLinkListener: true` in SDK config
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