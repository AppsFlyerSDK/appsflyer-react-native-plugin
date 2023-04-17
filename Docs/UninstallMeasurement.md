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

Read more about Uninstall register: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)

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
