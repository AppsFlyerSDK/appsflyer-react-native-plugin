# React Native Appsflyer Plugin Guides

<img src="https://massets.appsflyer.com/wp-content/uploads/2016/06/26122512/banner-img-ziv.png"  width="150">

## Table of content

- [Init SDK](#init-sdk)
- [Deep Linking](#deeplinking)
    - [Deferred Deep Linking (Get Conversion Data)](#deferred-deep-linking)
    - [Direct Deep Linking](#direct-deep-linking)
    - [Unified deep linking](#Unified-deep-linking)
    - [iOS Deeplink Setup](#iosdeeplinks)
    - [Android Deeplink Setup](#android-deeplinks)
- [Uninstall](#measure-app-uninstalls)
    - [iOS Uninstall Setup](#measure-app-uninstalls-ios)
    - [Android Uninstall Setup](#measure-app-uninstalls-android)


##  <a id="init-sdk"> Init SDK
  *Example:*

```javascript
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


##  <a id="deeplinking"> Deep Linking
    
<img src="https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png"  width="300">



#### The 3 Deep Linking Types:
Since users may or may not have the mobile app installed, there are 2 types of deep linking:

1. Deferred Deep Linking - Serving personalized content to new or former users, directly after the installation. 
2. Direct Deep Linking - Directly serving personalized content to existing users, which already have the mobile app installed.
3. Unified deep linking - Unified deep linking sends new and existing users to a specific in-app activity as soon as the app is opened.<br>
For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro).

###  <a id="deferred-deep-linking"> 1. Deferred Deep Linking (Get Conversion Data)

Check out the deferred deep linking guide from the AppFlyer knowledge base [here](https://support.appsflyer.com/hc/en-us/articles/207032096-Accessing-AppsFlyer-Attribution-Conversion-Data-from-the-SDK-Deferred-Deeplinking-#Introduction).

Code Sample to handle the conversion data:


```javascript
var onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (res) => {
    if (JSON.parse(res.data.is_first_launch) == true) {
      if (res.data.af_status === 'Non-organic') {
        var media_source = res.data.media_source;
        var campaign = res.data.campaign;
        alert('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
      } else if (res.data.af_status === 'Organic') {
        alert('This is first launch and a Organic Install');
      }
    } else {
      alert('This is not first launch');
    }
  }
);

appsFlyer.initSdk(/*...*/);
```
**Note:** The code implementation for `onInstallConversionData` must be made **prior to the initialization** code of the SDK.

<hr/>

**Important**

The `appsFlyer.onInstallConversionData` returns function to  unregister this event listener. If you want to remove the listener for any reason, you can simply call `onInstallConversionDataCanceller()`. This function will call `NativeAppEventEmitter.remove()`.

<hr/>

###  <a id="direct-deep-linking"> 2. Direct Deep Linking
    
When a deep link is clicked on the device the AppsFlyer SDK will return the link in the [onAppOpenAttribution](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#deep-linking-data-the-onappopenattribution-method-) method.

```javascript
var onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

appsFlyer.initSdk(/*...*/);

```
**Note:** The code implementation for `onAppOpenAttribution` must be made **prior to the initialization** code of the SDK.

**Important**

The `appsFlyer.onAppOpenAttribution` returns function to  unregister this event listener. If you want to remove the listener for any reason, you can simply call `onAppOpenAttributionCanceller()`. This function will call `NativeAppEventEmitter.remove()`.

<hr/>

###  <a id="Unified-deep-linking"> 3. Unified deep linking
In order to use the unified deep link you need to send the `onDeepLinkListener: true` flag inside the object that sent to the sdk.<br>
**NOTE:** when sending this flag, the sdk will ignore `onAppOpenAttribution`!<br>
For more information about this api, please check [OneLink Guide Here](https://dev.appsflyer.com/docs/android-unified-deep-linking)


```javascript
var onDeepLinkCanceller = appsFlyer.onDeepLink(res => {
  console.log('onDeepLinking: ' + JSON.stringify(res));
})

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);
```

**Note:** The code implementation for `onDeepLink` must be made **prior to the initialization** code of the SDK.

**Important**

The `appsFlyer.onDeepLink` returns function to  unregister this event listener. If you want to remove the listener for any reason, you can simply call `onDeepLinkCanceller()`. This function will call `NativeAppEventEmitter.remove()`.


<hr/>

### *Example:*

```javascript
import appsFlyer from 'react-native-appsflyer';

var onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

var onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (res) => {
    if (JSON.parse(res.data.is_first_launch) == true) {
      if (res.data.af_status === 'Non-organic') {
        var media_source = res.data.media_source;
        var campaign = res.data.campaign;
        alert('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
      } else if (res.data.af_status === 'Organic') {
        alert('This is first launch and a Organic Install');
      }
    } else {
      alert('This is not first launch');
    }
  }
);

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
// ...

class App extends Component<{}> {
  componentWillUnmount() {
    // Optionaly remove listeners for deep link data if you no longer need them after componentWillUnmount
    if (onInstallConversionDataCanceller) {
      onInstallConversionDataCanceller();
      console.log('unregister onInstallConversionDataCanceller');
      onInstallConversionDataCanceller = null;
    }
    if (onAppOpenAttributionCanceller) {
      onAppOpenAttributionCanceller();
      console.log('unregister onAppOpenAttributionCanceller');
      onAppOpenAttributionCanceller = null;
    }
  }
}
```

Init SDK with Hooks:

```javascript
import React, {useEffect, useState} from 'react';
import {AppState, SafeAreaView, Text, View} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

var onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
    (res) => {
        if (JSON.parse(res.data.is_first_launch) == true) {
            if (res.data.af_status === 'Non-organic') {
                var media_source = res.data.media_source;
                var campaign = res.data.campaign;
                console.log('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
            } else if (res.data.af_status === 'Organic') {
                console.log('This is first launch and a Organic Install');
            }
        } else {
            console.log('This is not first launch');
        }
    },
);

var onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
    console.log(res);
});


appsFlyer.initSdk(
    {
        devKey: 'K2a*********99',
        isDebug: false,
        appId: '41******5',
    },
    (result) => {
        console.log(result);
    },
    (error) => {
        console.error(error);
    },
);

const Home = (props) => {

    useEffect(() => {
        return () => {
            // Optionaly remove listeners for deep link data if you no longer need them after componentWillUnmount
            if (onInstallConversionDataCanceller) {
              onInstallConversionDataCanceller();
              console.log('unregister onInstallConversionDataCanceller');
              onInstallConversionDataCanceller = null;
            }
            if (onAppOpenAttributionCanceller) {
              onAppOpenAttributionCanceller();
              console.log('unregister onAppOpenAttributionCanceller');
              onAppOpenAttributionCanceller = null;
            }
        };
    }, []);

    return (
        <SafeAreaView>
            <View>
                <Text>{'App'}</Text>
            </View>
        </SafeAreaView>
    );
};

```


### <a id="iosdeeplinks"> iOS Deep Links - Universal Links and URL Schemes

In order to record retargeting and use the onAppOpenAttribution callbacks in iOS,  the developer needs to pass the User Activity / URL to our SDK, via the following methods in the **AppDelegate.m** file:

#### import
```objectivec
#import <React/RCTLinkingManager.h>
#if __has_include(<AppsFlyerLib/AppsFlyerLib.h>) // from Pod
#import <AppsFlyerLib/AppsFlyerLib.h>
#else
#import "AppsFlyerLib.h"
#endif
```

#### Universal Links (iOS 9 +)
```objectivec
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  [[AppsFlyerLib shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
  return YES;
}
```

#### URL Schemes
```objectivec
// Reports app open from deep link from apps which do not support Universal Links (Twitter) and for iOS8 and below
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation {
 [[AppsFlyerLib shared] handleOpenURL:url sourceApplication:sourceApplication withAnnotation:annotation];
return YES;
}

// Reports app open from URL Scheme deep link for iOS 10
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
options:(NSDictionary *) options {
 [[AppsFlyerLib shared] handleOpenUrl:url options:options];
return YES;
}
```

### <a id="android-deeplinks"> Android Deep Links
    
On Android, AppsFlyer SDK inspects activity intent object during onResume(). Because of that, for each activity that may be configured or launched with any [non-standard launch mode](https://developer.android.com/guide/topics/manifest/activity-element#lmode) please make sure to add the following code to `MainActivity.java` in `android/app/src/main/java/com...`:

```
...
import android.content.Intent;
...

public class MainActivity extends ReactActivity {
...
    @Override
    public void onNewIntent(Intent intent) {
         super.onNewIntent(intent);
         setIntent(intent);
    }
 }
```
This method makes sure that you get the latest deep link data even if the app was initially launched with another deep link. See the [Android developer documentation](https://developer.android.com/reference/android/app/Activity#onNewIntent(android.content.Intent)) for more details. 

---

### <a id="measure-app-uninstalls"> Measure App Uninstalls

#### <a id="measure-app-uninstalls-ios"> iOS

#### First method 

AppsFlyer enables you to measure app uninstalls. To handle notifications it requires  to modify your `AppDelegate.m`. Use [didRegisterForRemoteNotificationsWithDeviceToken](https://developer.apple.com/reference/uikit/uiapplicationdelegate) to register to the uninstall feature.

*Example:*

```objective-c
@import AppsFlyerLib;

...

- (void)application:(UIApplication ​*)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *​)deviceToken {
// notify AppsFlyerLib
 [[AppsFlyerLib shared] registerUninstall:deviceToken];
}
```

Read more about Uninstall register: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)

#### Second method 

Pass the device token to AppsFlyer

*Example:*

```javascript
appsFlyer.updateServerUninstallToken(deviceToken, (success) => {
  //...
});
```

#### <a id="measure-app-uninstalls-android"> Android

Update Firebase device token so it can be sent to AppsFlyer

*Example:*

```javascript
appsFlyer.updateServerUninstallToken(newFirebaseToken, (success) => {
  //...
});
```

Read more about Android  Uninstall Measurement: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking)

