
<img src="https://www.appsflyer.com/wp-content/uploads/2016/11/logo-1.svg"  width="200">

# react-native-appsflyer
This React Native Library for AppsFlyer SDK

[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer)

----------
In order for us to provide optimal support, we would kindly ask you to submit any issues to support@appsflyer.com

*When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

----------


## Table of content

- [Supported Platforms](#this-plugin-is-built-for)
- [Installation](#installation)
 - [iOS](#installation_ios) 
 - [Android](#installation_android)
- [API Methods](#api-methods) 
 - [initSdk](#initSdk) 
 - [setCustomerUserId](#setCustomerUserId)
 - [setUserEmails](#setUserEmails)  
 - [trackEvent](#trackEvent)
 - [Track App Uninstalls](#track-app-uninstalls)
     - [iOS](#track-app-uninstalls-ios) 
     - [Android](#track-app-uninstalls-android)
 - [onInstallConversionData](#appsflyeroninstallconversiondatacallback-functionunregister)
 - [getAppsFlyerUID](#appsflyergetappsflyeruidcallback-void)
 - [trackLocation (ios only)](#appsflyertracklocationlongitude-latitude-callbackerror-coords-void-ios-only)
 - [sendDeepLinkData (Android only)](#senddeeplinkdata-android-only)
- [Demo](#demo) 


## <a id="this-plugin-is-built-for"> This plugin is built for

- iOS AppsFlyerSDK **v4.7.11**
- Android AppsFlyerSDK **v4.7.4**

## <a id="installation"> Installation

`$ npm install react-native-appsflyer --save`

### <a id="installation_ios"> iOS


1. Add the `appsFlyerFramework` to `podfile` and run `pod install`.


Example:
     
```
use_frameworks!
target 'demo' do
  pod 'AppsFlyerFramework'
end
```

  Don't use CocoaPods? please see their [DOCS](https://guides.cocoapods.org/using/getting-started.html) . 


2. Create *bridge* between your application and `appsFlyerFramework`:
  In XCode ➜ project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
  Go to `node_modules` ➜ `react-native-appsflyer` and add `RNAppsFlyer.xcodeproj`
   Build your project, It will generate `libRNAppsFlyer.a` file: 

    ![enter image description here](https://s26.postimg.org/ucnxv1jeh/react_native_api.png)
  
     

3. In your project **build phase** ➜ **Link binary with libraries** ➜ add `libRNAppsFlyer.a`. 
Run your project (`Cmd+R`) or through CLI run: `react-native run-ios`

##### **Breaking Changes for react-native >= 0.40.0:**

In `RNAppsFlyer.h`:

```obj-c
#import <React/RCTBridgeModule.h>  //for react-native ver >= 0.40
//#import "RCTBridgeModule.h"        //for react-native ver < 0.40
```

In `RNAppsFlyer.m`:

```obj-c
// for react-native ver >= 0.40
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>

// for react-native ver < 0.40
//#import "RCTBridge.h"
//#import "RCTEventDispatcher.h"
```

### <a id="installation_android"> Android

##### **android/app/build.gradle**
Add the project to your dependencies
```gradle
dependencies {
    ...
    compile project(':react-native-appsflyer')
}
```

##### **android/settings.gradle**

Add the project

```gradle
include ':react-native-appsflyer'
project(':react-native-appsflyer').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-appsflyer/android')
```

Build project so you should get following dependency (see an Image): 

![enter image description here](https://s26.postimg.org/4ie559jeh/Screen_Shot_2016_11_07_at_5_02_00_PM.png)

##### **MainApplication.java**
Add:
 

 1. `import com.appsflyer.reactnative.RNAppsFlyerPackage;`
 
 2.  In the `getPackages()` method register the module:
  `new RNAppsFlyerPackage(MainApplication.this)`

So `getPackages()` should look like:

```java
 @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new RNAppsFlyerPackage(MainApplication.this),
          //.....
      );
    }
```



## <a id="api-methods">  API Methods

---

Call module by adding: 

`import appsFlyer from 'react-native-appsflyer';`

---


##### <a id="initSdk">  **`appsFlyer.initSdk(options, callback): void`**

initializes the SDK.

| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `options`   | `Object`                    |   SDK configuration           |


**`options`**

| name       | type    | default | description            |
| -----------|---------|---------|------------------------|
| `devKey`   |`string` |         |   [Appsflyer Dev key](https://support.appsflyer.com/hc/en-us/articles/207032126-AppsFlyer-SDK-Integration-Android)    |
| `appId`    |`string` |        | [Apple Application ID](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS) (for iOS only) |
| `isDebug`  |`boolean`| `false` | debug mode (optional)|

*Example:*

```javascript
const options = {
  devKey: "WdpTVAcYwmxsaQ4WeTspmh",
  appId: "975313579",
  isDebug: true
};

appsFlyer.initSdk(options,
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
)
```

---


##### <a id="setCustomerUserId"> **`setCustomerUserId(customerUserId, callback): void`**

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs.
 
**Note:** The ID must be set during the first launch of the app at the SDK initialization. The best practice is to call this API during the `deviceready` event, where possible.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `customerUserId`   | `String`                      | |

*Example:*

```javascript
const userId = "some_user_id";

appsFlyer.setCustomerUserId(userId,
  (response) => {
    //..
  }
); 
```
---


##### <a id="trackEvent"> **`appsFlyer.trackEvent(eventName, eventValues, errorC, successC): void`**


- These in-app events help you track how loyal users discover your app, and attribute them to specific 
campaigns/media-sources. Please take the time define the event/s you want to measure to allow you 
to track ROI (Return on Investment) and LTV (Lifetime Value).
- The `trackEvent` method allows you to send in-app events to AppsFlyer analytics. This method allows you to add events dynamically by adding them directly to the application code.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `eventName` | `String`                    | custom event name, is presented in your dashboard.  See the Event list [HERE](https://github.com/AppsFlyerSDK/react-native-appsflyer/blob/master/ios/AppsFlyerTracker.h)  |
| `eventValues` | `Object`                    | event details (optional) |

*Example:*

```javascript
const eventName = "af_add_to_cart";
const eventValues = {
  "af_content_id": "id123",
  "af_currency":"USD",
  "af_revenue": "2"
};

appsFlyer.trackEvent(eventName, eventValues, errorC, successC) => {
  (result) => {
    //...
  },
  (error) => {
    console.error(error);
  }
 })
    
```

---




### <a id="track-app-uninstalls"> Track App Uninstalls 

#### <a id="track-app-uninstalls-ios"> iOS

AppsFlyer enables you to track app uninstalls. To handle notifications it requires  to modify your `AppDelegate.m`. Use [didRegisterForRemoteNotificationsWithDeviceToken](https://developer.apple.com/reference/uikit/uiapplicationdelegate) to register to the uninstall feature. 

*Example:*

```objective-c
- (void)application:(UIApplication ​*)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *​)deviceToken {
   // notify AppsFlyerTracker
   [[AppsFlyerTracker sharedTracker] registerUninstall:deviceToken];
}
```

Read more about Uninstall register: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS) 


#### <a id="track-app-uninstalls-android"> Android

 `enableUninstallTracking(GCMProjectID): void`

Set the GCM API key. AppsFlyer requires a Google Project Number and GCM API Key to enable uninstall tracking.  

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `GCMProjectID`   | `String`                      | |

*Example:*

```javascript

 enableUninstallTracking(){
    const  gcmProjectNum = "987186475229";
    appsFlyer.enableUninstallTracking(gcmProjectNum,
        (success) => {
          //...
        })
  }
  
```

Read more about Android  Uninstall Tracking: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking) 

---


##### **`appsFlyer.onInstallConversionData(callback): function:unregister`** 

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking). 
 Read more: [Android](http://support.appsflyer.com/entries/69796693-Accessing-AppsFlyer-Attribution-Conversion-Data-from-the-SDK-Deferred-Deep-linking-), [iOS](http://support.appsflyer.com/entries/22904293-Testing-AppsFlyer-iOS-SDK-Integration-Before-Submitting-to-the-App-Store-)  


| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `callback`  | `function`                  |  returns [object](#callback-structure)            |


##### callback structure: 

- `status`: `"success"`or `"failure"` if SDK returned error on `onInstallConversionData` event handler
- `type`:
 - `"onAppOpenAttribution"`  - returns deep linking data (non-organic)            
 - `"onInstallConversionDataLoaded"` - called on each launch
 - `"onAttributionFailure"`
 - `"onInstallConversionFailure"` 
- `data`: some metadata,
 for example:
```
{
  "status": "success",
  "type": "onInstallConversionDataLoaded",
  "data": {
    "af_status": "Organic",
    "af_message": "organic install"
  }
}
```
 

*Example:*

```javascript
this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (data) => {
    console.log(data);
  }
);
```

The `appsFlyer.onInstallConversionData` returns function to  unregister this event listener. Actually it calls `NativeAppEventEmitter.remove()`

*Example:*

```javascript
componentWillUnmount() {
  if(this.onInstallConversionDataCanceller){
    this.onInstallConversionDataCanceller();
  }
}
```

---

##### **`appsFlyer.getAppsFlyerUID(callback): void`**


Get AppsFlyer’s proprietary Device ID. The AppsFlyer Device ID is the main ID used by AppsFlyer in Reports and APIs.



*Example:*

```javascript
appsFlyer.getAppsFlyerUID((error, appsFlyerUID) => {
  if (error) {
    console.error(error);
  } else {
    console.log("on getAppsFlyerUID: " + appsFlyerUID);
  }
});
```

---



##### **`appsFlyer.trackLocation(longitude, latitude, callback(error, coords): void`** (**iOS only**)


Get AppsFlyer’s proprietary Device ID. The AppsFlyer Device ID is the main ID used by AppsFlyer in Reports and APIs.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `error` | `String`                    | Error callback - called on `getAppsFlyerUID` failure |
| `appsFlyerUID` | `string`                    | The AppsFlyer Device ID |

*Example:*

```javascript
const latitude = -18.406655;
const longitude = 46.406250;
 
appsFlyer.trackLocation(longitude, latitude, (error, coords) => {
  if (error) {
    console.error(error);
  } else {
    this.setState({ ...this.state, trackLocation: coords });
  }
});
```

---

#### <a id="senddeeplinkdata-android-only"> **`appsFlyer.sendDeepLinkData(String url): void`**

Report Deep Links for Re-Targeting Attribution (Android).
This method should be called when an app is opened using a deep link.

*Example:*
```javascript
componentDidMount() {
  Linking.getInitialURL().then((url) => {
    if (appsFlyer) {
        appsFlyer.sendDeepLinkData(url); // Report Deep Link to AppsFlyer
        // Additional Deep Link Logic Here ...
      }
  }).catch(err => console.error('An error occurred', err));
}
```

More about Deep Links in React-Native: [React-Native Linking](https://facebook.github.io/react-native/docs/linking.html)
More about Deep Links in Android: [Android Deep Linking , Adding Filters](https://developer.android.com/training/app-indexing/deep-linking.html#adding-filters)

---

##### <a id="setUserEmails"> **`appsFlyer.setUserEmails(options, errorC, successC): void`**

AppsFlyer enables you to report one or more of the device’s associated email addresses. You must collect the email addresses and report it to AppsFlyer according to your required encryption method.
More info you can find on [AppsFlyer-SDK-Integration-Android](https://support.appsflyer.com/hc/en-us/articles/207032126-AppsFlyer-SDK-Integration-Android) and [AppsFlyer-SDK-Integration-iOS](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)


| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `options`   | `Object`                    |   `setUserEmails` configuration           |


**`options`**

| name       | type    | default | description            |
| -----------|---------|---------|------------------------|
| `emailsCryptType`   |`int` |    0     |   NONE - `0` (default), SHA1 - `1`, MD5 - `2`    |
| `emails`    |`array` |        | comma separated list of emails |


*Example:*

```javascript
const options = {
  "emailsCryptType": 2,
  "emails": [
    "user1@gmail.com",
    "user2@gmail.com"
  ]
};

appsFlyer.setUserEmails(options,
  (response) => {
    this.setState({ ...this.state, setUserEmailsResponse: response });
  },
  (error) => {
    console.error(error);
  }
);
    
```

---


## Demo

This plugin has a `demo` project bundled with it. To give it a try , clone this repo and from root a.e. `react-native-appsflyer` execute the following:

```sh
npm run setup
```

 - Run `npm run demo.ios` or `npm run demo.android` will run for the appropriate platform.
 - Run `npm run ios-pod` to run `Podfile` under `demo` project
 

![demo printscreen](demo/demo_example.png?raw=true)
