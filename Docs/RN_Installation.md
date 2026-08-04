---
title: Installation
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 1
hidden: false
---
## Adding react-native-appsflyer to your project

**Requirement:** This plugin requires React Native >= 0.76.0 and supports only the New Architecture (TurboModule). Autolinking is mandatory.

- [Installation with autolinking](#installation-with-autolinking)
- [Add strict-mode for App-kids](#add-strict-mode-for-app-kids)
- [The AD_ID permission for android apps](#the-ad_id-permission-for-android-apps)

## Installation with [autolinking](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md)

Run the following:
  
```
$ npm install react-native-appsflyer --save
$ cd ios && pod install
```

## Add strict-mode for App-kids
Starting from version **6.1.10** iOS SDK comes in two variants: **Strict** mode and **Regular** mode. Please read more [here](https://dev.appsflyer.com/hc/docs/install-ios-sdk#strict-mode-sdk)

***Change to Strict mode***
After you installed the AppsFlyer plugin, add `$RNAppsFlyerStrictMode=true` in the project's Podfile:
```
//MyRNApp/ios/Podfile
...
use_frameworks!
  $RNAppsFlyerStrictMode=true

  # Pods for MyRNApp
...

```
In the `ios` folder of your `root` project Run `pod install`

***Change to Regular mode***
Remove `$RNAppsFlyerStrictMode=true` from the project's Podfile or set it to `false`:
```
//MyRNApp/ios/Podfile
...
use_frameworks!
  $RNAppsFlyerStrictMode=false //OR remove this line

  # Pods for MyRNApp
...
```
In the `ios` folder of your `root` project Run `pod install`

## The AD_ID permission for android apps
The AppsFlyer SDK requires the `com.google.android.gms.permission.AD_ID` permission to collect the Android Advertising ID on apps targeting API 31 and above.

Your app's `AndroidManifest.xml` must explicitly declare this permission:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID" />
```

If your app is targeting children, you need to revoke this permission to comply with Google's Data policy. You can read more about it [here](https://dev.appsflyer.com/hc/docs/install-android-sdk#the-ad_id-permission).
