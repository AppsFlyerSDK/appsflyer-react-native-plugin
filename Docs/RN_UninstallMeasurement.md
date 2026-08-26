---
title: Uninstall measurement
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 6
hidden: false
---

## Measure App Uninstalls

## iOS

### First method

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

### Second method

Pass the device token to AppsFlyer

*Example:*

```javascript
AppsFlyer.updateServerUninstallToken({ token: deviceToken });
```

**Note:** On iOS, the token string must be a valid hex-encoded string (even-length hex characters). Passing a raw NSData description or base64 string will cause a native validation error.

For sandbox uninstall-token registration, also see `setUseUninstallSandbox()` in the [API reference](RN_API.md).

## Android

Update Firebase device token so it can be sent to AppsFlyer.

*Example:*

```javascript
AppsFlyer.updateServerUninstallToken({ token: newFirebaseToken });
```

Read more about Android uninstall measurement: [AppsFlyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking)
