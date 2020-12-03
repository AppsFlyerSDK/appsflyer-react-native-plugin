
<img src="https://www.appsflyer.com/wp-content/uploads/2016/11/logo-1.svg"  width="450">

# React Native AppsFlyer plugin for Android and iOS.

🛠 In order for us to provide optimal support, we would kindly ask you to submit any issues to support@appsflyer.com

*When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer) 
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) 
[![Downloads](https://img.shields.io/npm/dm/react-native-appsflyer.svg)](https://www.npmjs.com/package/react-native-appsflyer)
[![Coverage](https://img.shields.io/badge/coverage-77%25-yellowgreen)]()
## Table of content

- [v6 Breaking changes](#v6-breaking-changes)
- [Adding the SDK to your project](#installation)
- [Add or Remove Strict mode for App-kids](#appKids)
- [Initializing the SDK](#init-sdk)
- [Guides](#guides)
- [API](#api) 
  
### <a id="plugin-build-for"> This plugin is built for

- iOS AppsFlyerSDK **v6.1.1**
- Android AppsFlyerSDK **v6.1.0**

## <a id="v6-breaking-changes"> ❗ v6 Breaking Changes

We have renamed the following APIs:

| Old API                       | New API                       |
| ------------------------------|-------------------------------|
| trackEvent                    | logEvent                      |
| trackLocation                 | logLocation                   |
| stopTracking                  | stop                          |
| trackCrossPromotionImpression | logCrossPromotionImpression   |
| trackAndOpenStore             | logCrossPromotionAndOpenStore |
| setDeviceTrackingDisabled     | anonymizeUser                 |

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

Starting from version **6.1.10** iOS SDK comes in two variants: **Strict** mode and **Regular** mode. Please read more [here](https://support.appsflyer.com/hc/en-us/articles/207032066#integration-strict-mode-sdk)

***Change to Strict mode***<br>
After you [installed](#installation) the AppsFlyer plugin, go to the `react-native-appsflyer` folder inside the `node_modules` folder:
```
cd node_modules/react-native-appsflyer
```
Run the script `changeMode.sh strict`
```
./changeMode.sh strict
```
Go to the `ios` folder in your `root` project
```
cd ../../ios
```
Run `pod install`

***Change to Regular mode***<br>
Go to the `react-native-appsflyer` folder inside the `node_modules` folder:
```
cd node_modules/react-native-appsflyer
```
Run the script `changeMode.sh` (WITHOUT `strict`)
```
./changeMode.sh
```
Go to the `ios` folder in your `root` project
```
cd ../../ios
```
Run `pod install`

## <a id="init-sdk"> 🚀 Initializing the SDK

Initialize the SDK to enable AppsFlyer to detect installations, sessions (app opens) and updates.  

```javascript
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true,
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


 ## <a id="guides"> 📖 Guides

Great installation and setup guides can be viewed [here](/Docs/Guides.md).
- [init SDK Guide](/Docs/Guides.md#init-sdk)
- [Deeplinking Guide](/Docs/Guides.md#deeplinking)
- [Uninstall Guide](/Docs/Guides.md#measure-app-uninstalls)



## <a id="api"> 📑 API
  
See the full [API](/Docs/API.md) available for this plugin.

