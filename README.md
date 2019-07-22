
<img src="https://www.appsflyer.com/wp-content/uploads/2016/11/logo-1.svg"  width="450">

# React Native AppsFlyer plugin for Android and iOS. 

🛠 In order for us to provide optimal support, we would kindly ask you to submit any issues to support@appsflyer.com

*When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer) 


## Table of content

- [SDK versions](#plugin-build-for)
- [Installation](#installation)
- [Guides](#guides)
- [API](#api) 
- [Demo](#demo)  


### <a id="plugin-build-for"> This plugin is built for

- iOS AppsFlyerSDK **v4.8.12**
- Android AppsFlyerSDK **v4.8.20** 


## <a id="installation">📲Installation

```
$ npm install react-native-appsflyer --save
```

Then run:
```
$ react-native link react-native-appsflyer
```

### <a id="installation_ios"> iOS

#### With Cocoapods

Add the `appsFlyerFramework` to `podfile` and run `pod install`.

```
pod 'react-native-appsflyer',
:path => '../node_modules/react-native-appsflyer'
```

Note that You must also have the React dependencies defined in the Podfile as described [here](https://facebook.github.io/react-native/docs/next/troubleshooting.html#missing-libraries-for-react).

Check out the [sample pod file](./Docs/Installation.md) for a working example.


#### Without Cocoapods

1. Download the Static Lib of the AppsFlyer iOS SDK from [here](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS#2-quick-start).
2. Unzip and copy the contents of the Zip file into your project directory.
3. Copy RNAppsFlyer.h and RNAppsFlyer.m from `node_modules` ➜ `react-native-appsflyer` to your project directory.

For more info check out the Installation guide [here](./Docs/Installation.md).

### <a id="installation_ios"> Android
    
Running `react-native link react-native-appsflyer` will complete the Android integration.


For the manual integration steps, check out the Installation guide [here](./Docs/Installation.md).

## <a id="setup"> 🚀 Setup

####  Set your App_ID (iOS only), Dev_Key and enable AppsFlyer to detect installations, sessions (app opens) and updates.  
> This is the minimum requirement to start tracking your app installs and is already implemented in this plugin. You **MUST** modify this call and provide:  
 **devKey** - Your application devKey provided by AppsFlyer.<br>
**appId**  - ***For iOS only.*** Your iTunes Application ID.


Add the following lines to your code to be able to initialize tracking with your own AppsFlyer dev key:


```javascript
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);
```

**Important** - For iOS another step is required for tracking. AppState logic is required to track Background-to-foreground transitions. Check out the [relevant guide](./Docs/API.md#--appsflyertrackapplaunch-void) to see how this manidtory step is impelemented.

 ## <a id="guides"> 📖 Guides

Great installation and setup guides can be viewed [here](/Docs/Guides.md).
- [init SDK Guide](/Docs/Guides.md#init-sdk)
- [Deeplinking Guide](/Docs/Guides.md#deeplinking)
- [Uninstall Guide](/Docs/Guides.md#uninstall)



## <a id="api"> 📑 API
  
See the full [API](/Docs/API.md) available for this plugin.


## <a id="demo"> 📱 Demo
  
  Check out the demo for this project [here](Docs/Guides.md#demo).
