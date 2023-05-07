---
title: Uninstall measurement
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 6
hidden: true
---

# Measure App Uninstalls

## iOS

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

Read more about Uninstall Measurement: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking)

#### Second method

Pass the device token to AppsFlyer

*Example:*

```javascript
appsFlyer.updateServerUninstallToken(deviceToken, (success) => {
  //...
});
```

## <a id="measure-app-uninstalls-android"> Android

Update Firebase device token so it can be sent to AppsFlyer

*Example:*

```javascript
appsFlyer.updateServerUninstallToken(newFirebaseToken, (success) => {
  //...
});
```

Read more about Android  Uninstall Measurement: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking)
