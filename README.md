
<img src="https://raw.githubusercontent.com/AppsFlyerSDK/appsflyer-capacitor-plugin/main/assets/AFLogo_primary.png"  width="450">

# React Native AppsFlyer plugin for Android and iOS.
///d
🛠 In order for us to provide optimal support, we would kindly ask you to submit any issues to support@appsflyer.com

*When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/react-native-appsflyer.svg)](https://www.npmjs.com/package/react-native-appsflyer)
## Table of content

- [Breaking changes](#breaking-changes)
- [Adding the SDK to your project](#installation)
- [Add or Remove Strict mode for App-kids](#appKids)
- [Initializing the SDK](#init-sdk)
- [Guides](#guides)
- [API](#api)

### <a id="plugin-build-for"> This plugin is built for

- iOS AppsFlyerSDK **v6.4.+**(latest)
- Android AppsFlyerSDK **v6.4.+**(latest)

## <a id="breaking-changes"> ❗ Breaking Changes

- From version `6.3.0`, we use `xcframework` for iOS platform, then you need to use cocoapods version >= 1.10

- From version `6.2.30`, `logCrossPromotionAndOpenStore`  api will register as `af_cross_promotion` instead of `af_app_invites` in your dashboard.<br>
Click on a link that was generated using `generateInviteLink` api will be register as `af_app_invites`.

- We have renamed the following APIs:

| Old API                       | New API                       |
| ------------------------------|-------------------------------|
| trackEvent                    | logEvent                      |
| trackLocation                 | logLocation                   |
| stopTracking                  | stop                          |
| trackCrossPromotionImpression | logCrossPromotionImpression   |
| trackAndOpenStore             | logCrossPromotionAndOpenStore |
| setDeviceTrackingDisabled     | anonymizeUser                 |
| AppsFlyerTracker    | AppsFlyerLib                 |

And removed the following ones:

- trackAppLaunch -> no longer needed. See new init guide
- sendDeepLinkData -> no longer needed. See new init guide
- enableUninstallTracking -> no longer needed. See new uninstall measurement guide

If you have used 1 of the removed APIs, please check the integration guide for the updated instructions

## <a id="installation"> 📲 Adding the SDK to your project

**Production** version from npm:
```
$ npm install react-native-appsflyer --save
```

Then run the following:

*iOS*
```
$ cd ios && pod install
$ react-native run-ios
```

*Android*
```
$ react-native run-android
```

> Starting from RN [v0.60](https://facebook.github.io/react-native/blog/2019/07/03/version-60), and react-native-appsflyer `v1.4.7` the plugin uses [autolinking](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md). <br/>
If your app does not support autolinking, check out the Installation Guide [here](./Docs/Installation.md).

## <a id="appKids"> 👨‍👩‍👧‍👦 Add or Remove Strict mode for App-kids

Starting from version **6.1.10** iOS SDK comes in two variants: **Strict** mode and **Regular** mode. Please read more [here](https://support.appsflyer.com/hc/en-us/articles/207032066#integration-strict-mode-sdk) <br>
***Version <= 6.3.0:*** read this section of the README.md in branch: `releases/6.x.x/6.3.x/6.3.0`<br>
***Change to Strict mode***<br>
1. After you [installed](#installation) the AppsFlyer plugin, add `$RNAppsFlyerStrictMode=true` in the project's Podfile:
```
//MyRNApp/ios/Podfile
...
use_frameworks!
  $RNAppsFlyerStrictMode=true

  # Pods for MyRNApp
...

```
2. In the `ios` folder of your `root` project Run `pod install`

***Change to Regular mode***<br>
1. Remove `$RNAppsFlyerStrictMode=true` from the project's Podfile or set it to `$RNAppsFlyerStrictMode=false`

2. In the `ios` folder of your `root` project Run `pod install`
## <a id="init-sdk"> 🚀 Initializing the SDK

Initialize the SDK to enable AppsFlyer to detect installations, sessions (app opens) and updates.<br>
NOTE! for iOS 14.5, we use `timeToWaitForATTUserAuthorization` parameter. Please read more [here](https://support.appsflyer.com/hc/en-us/articles/207032066-iOS-SDK-V6-X-integration-guide-for-developers#integration-33-configuring-app-tracking-transparency-att-support)

```javascript
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true, //Optional
    onDeepLinkListener: true, //Optional
    timeToWaitForATTUserAuthorization: 10 //for iOS 14.5
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);
```

| Setting  | Description   |
| -------- | ------------- |
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/211719806-Global-app-settings-#sdk-dev-key) provided by AppsFlyer (required)  |
| appId      | Your iTunes [application ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store)  (iOS only)  |
| isDebug    | Debug mode - set to `true` for testing only  |
|onInstallConversionDataListener| Set listener for SDK init response (Optional. default=true) |
|onDeepLinkListener| Set listener for DDL response (Optional. default=false) |
|timeToWaitForATTUserAuthorization| Time for the sdk to wait before launch. please read more [Here](https://support.appsflyer.com/hc/en-us/articles/207032066-iOS-SDK-V6-X-integration-guide-for-developers#additional-apis-configuring-app-tracking-transparency-att-support) |


 ## <a id="guides"> 📖 Guides

Great installation and setup guides can be viewed [here](/Docs/Guides.md).
- [init SDK Guide](/Docs/Guides.md#init-sdk)
- [Deeplinking Guide](/Docs/Guides.md#deeplinking)
- [Uninstall Guide](/Docs/Guides.md#measure-app-uninstalls)



## <a id="api"> 📑 API

See the full [API](/Docs/API.md) available for this plugin.
