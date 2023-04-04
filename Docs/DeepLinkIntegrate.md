
# Getting started

    
![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


## Deep Linking Types:
1. **Deferred Deep Linking** - Serving personalized content to new or former users, directly after the installation. 
2. **Direct Deep Linking** - Directly serving personalized content to existing users, which already have the mobile app installed.

** Unified deep linking (UDL) ** - an  API which enables you to send new and existing users to a specific in-app activity as soon as the app is opened.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro) and [developer guide](https://dev.appsflyer.com/hc/docs/getting-started-1).

---

#  Android Deeplink Setup
## Android Deeplink Setup(only fot non-Expo projects)

AppsFlyer SDK inspects activity intent object during onResume(). Because of that, for each activity that may be configured or launched with any [non-standard launch mode](https://developer.android.com/guide/topics/manifest/activity-element#lmode) please make sure to add the following code to `MainActivity.java` in `android/app/src/main/java/com...`:
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

## App Links
For more on App Links check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-for-deep-linking-and-deferred-deep-linking#procedures-for-android-app-links).

##  URI scheme in Android

Full setup guide for URI scheme in Android can be found [here](https://dev.appsflyer.com/hc/docs/initial-setup-for-deep-linking-and-deferred-deep-linking#procedures-for-uri-scheme).

#  iOS Deeplink Setup
## iOS Deeplink Setup(only fot non-Expo projects)

In order to record retargeting and use the onAppOpenAttribution/UDL callbacks in iOS,  the developer needs to pass the User Activity / URL to our SDK, via the following methods in the **AppDelegate.m** file:
#### import
```objectivec
#import <RNAppsFlyer.h>
```
```objectivec
// Deep linking
// Open URI-scheme for iOS 9 and above
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary *) options {
  [[AppsFlyerAttribution shared] handleOpenUrl:url options:options];
    return YES;
}
// Open URI-scheme for iOS 8 and below
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation {
  [[AppsFlyerAttribution shared] handleOpenUrl:url sourceApplication:sourceApplication annotation:annotation];
  return YES;
}
// Open Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler {
    [[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
    return YES;
}
```

## Universal Links 

Essentially, the Universal Links method links between an iOS mobile app and an associate website/domain, such as AppsFlyer’s OneLink domain (xxx.onelink.me). For more on Universal Links check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-2#procedures-for-ios-universal-links).

## URI scheme in iOS

Full setup guide for URI scheme in iOS can be found [here](https://dev.appsflyer.com/hc/docs/initial-setup-2#procedures-for-uri-scheme).