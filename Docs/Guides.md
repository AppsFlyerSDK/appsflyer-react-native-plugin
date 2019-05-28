# React Native Appsflyer Plugin Guides

<img src="https://massets.appsflyer.com/wp-content/uploads/2016/06/26122512/banner-img-ziv.png"  width="300">

## Table of content

- [Init SDK](#init-sdk)
- [Deep Linking](#deeplinking)
    - [Deferred Deep Linking (Get Conversion Data)](#conversionData)
    - [iOS Deeplink Setup](#iosdeeplinks)
- [Uninstall](#track-app-uninstalls)
    - [iOS Uninstall Setup](#track-app-uninstalls-ios)
    - [Android Uninstall Setup](#track-app-uninstalls-android)
- [Demo](#demo)



##  <a id="init-sdk"> Init SDK
  *Example:*

```javascript
const options = {
devKey: "<AF_DEV_KEY>",
isDebug: true
};

if (Platform.OS === 'ios') {
options.appId = "123456789";
}

appsFlyer.initSdk(options,
(result) => {
console.log(result);
},
(error) => {
console.error(error);
}
)
```

*With Promise:*

```javascript
try {
     var result = await appsFlyer.initSdk(options);     
     } catch (error) {
    }
```
### <a id="deeplinking"> Deep linking

### <a id="conversionData"> AppsFlyer.onInstallConversionData(callback)

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking).
Read more: [Android](http://support.appsflyer.com/entries/69796693-Accessing-AppsFlyer-Attribution-Conversion-Data-from-the-SDK-Deferred-Deep-linking-), [iOS](http://support.appsflyer.com/entries/22904293-Testing-AppsFlyer-iOS-SDK-Integration-Before-Submitting-to-the-App-Store-)


Example of `onInstallConversionDataLoaded`:
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

Example of `onAppOpenAttribution`:
```
{
    "status": "success",
    "type": "onAppOpenAttribution",
    "data": {
        "af_sub1": "some custom data",
        "link": "https://rndemotest.onelink.me/7y5s/f78c46d5",
        "c": 'my campaign',
        "pid": "my media source" }
        }
}

```

The code implementation fro the conversion listener must be made **prior to the initialization** code of the SDK

*Example:*

```javascript
this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
      data => {
        console.log(data);        
      }
    );

    this.onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution(
      data => {
        console.log(data);        
      }
    );


appsFlyer.initSdk(/*...*/);
//...
```

The `appsFlyer.onInstallConversionData` returns function to  unregister this event listener. Actually it calls `NativeAppEventEmitter.remove()`

*Example:*

```javascript
state = {
  appState: AppState.currentState
}

componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
}

componentWillUnmount() {
  AppState.removeEventListener('change', this._handleAppStateChange);
}

_handleAppStateChange = (nextAppState) => {
    
    if (this.state.appState.match(/active|foreground/) && nextAppState === 'background') {
         if(this.onInstallConversionDataCanceller){
           this.onInstallConversionDataCanceller();
           console.log("unregister onInstallConversionDataCanceller");
         } 
         if(this.onAppOpenAttributionCanceller){
           this.onAppOpenAttributionCanceller();
           console.log("unregister onAppOpenAttributionCanceller");
         }  
    }

    this.setState({appState: nextAppState});
  }
```



### <a id="iosdeeplinks"> iOS Deep Links - Universal Links and URL Schemes

In order to track retargeting and use the onAppOpenAttribution callbacks in iOS,  the developer needs to pass the User Activity / URL to our SDK, via the following methods in the **AppDelegate.m** file:

#### Universal Links (iOS 9 +)
```
- (BOOL) application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *_Nullable))restorationHandler
{
[[AppsFlyerTracker sharedTracker] continueUserActivity:userActivity restorationHandler:restorationHandler];
return YES;
}
```

#### URL Schemes
```
// Reports app open from deep link from apps which do not support Universal Links (Twitter) and for iOS8 and below
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation {
[[AppsFlyerTracker sharedTracker] handleOpenURL:url sourceApplication:sourceApplication withAnnotation:annotation];
return YES;
}

// Reports app open from URL Scheme deep link for iOS 10
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
options:(NSDictionary *) options {
[[AppsFlyerTracker sharedTracker] handleOpenUrl:url options:options];
return YES;
}
```
---



### <a id="track-app-uninstalls"> Track App Uninstalls

#### <a id="track-app-uninstalls-ios"> iOS

AppsFlyer enables you to track app uninstalls. To handle notifications it requires  to modify your `AppDelegate.m`. Use [didRegisterForRemoteNotificationsWithDeviceToken](https://developer.apple.com/reference/uikit/uiapplicationdelegate) to register to the uninstall feature.

*Example:*

```objective-c
@import AppsFlyerLib;

...

- (void)application:(UIApplication ​*)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *​)deviceToken {
// notify AppsFlyerTracker
[[AppsFlyerTracker sharedTracker] registerUninstall:deviceToken];
}
```

Read more about Uninstall register: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)

#### <a id="track-app-uninstalls-android"> Android


Set the GCM API key. AppsFlyer requires a Google Project Number and GCM API Key to enable uninstall tracking.

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




## Demo

This plugin has a `demo` project bundled with it. To give it a try , clone this repo and from root a.e. `react-native-appsflyer` execute the following:

```sh
npm run setup
```

- Run `npm run demo.ios` or `npm run demo.android` will run for the appropriate platform.
- Run `npm run ios-pod` to run `Podfile` under `demo` project


![demo printscreen](demo/demo_example.png?raw=true)

### Second Demo (demo2)

Basic code implementation example of implementing the AppsFlyer React-Native plugin in the cross-platform `App.js` file:

- Run `npm run demo2.ios` or `npm run demo2.android` will run for the appropriate platform.
- Run `npm run ios-pod2` to run `Podfile` under `demo2` project

