# 🚀 Basic integration of the SDK
Initialize the SDK to enable AppsFlyer to detect installations, sessions (app opens) and updates.<br>

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
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/207032066-Basic-SDK-integration-guide#retrieving-the-dev-key) provided by AppsFlyer (required)  |
| appId      | [App ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store)  (iOS only) you configured in your AppsFlyer dashboard  |
| isDebug    | Debug mode - set to `true` for testing only  |
|onInstallConversionDataListener| Set listener for [GCD](https://dev.appsflyer.com/hc/docs/conversion-data) response (Optional. default=true) |
|onDeepLinkListener| Set listener for [UDL](https://dev.appsflyer.com/hc/docs/unified-deep-linking-udl) response (Optional. default=false) |
|timeToWaitForATTUserAuthorization| Waits for request user authorization to access app-related data. please read more [here](https://support.appsflyer.com/hc/en-us/articles/207032066-iOS-SDK-V6-X-integration-guide-for-developers#configure-app-tracking-transparency-att-support) |