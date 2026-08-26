---
title: Test integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 4
hidden: false
---

## Testing

First, you need to enable debug mode for full logs from the SDK.
To enable it, call `enableDebug({ enabled: true })` — a dedicated call, separate from `init` (see
[RN_API.md — enableDebug](RN_API.md#enabledebug)):

```javascript
AppsFlyer.init({ devKey: 'UsxXxXxXxed', appId: '78xXxXx35' }).then(
  (result) => console.log(result),
  (error) => console.error(error)
);
AppsFlyer.enableDebug({ enabled: true });
```

## Testing for iOS
Open your ios project with XCode (`appName.xcworkspace`) and run it. In the logs section or in the console app, you will see logs related to AppsFlyer start with `[AppsFlyerSDK]`.<br>
Search for launch event that looks like this:
```
<~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~~+~>
<~+~   SEND Start:   https://launches.appsflyer.com/api/v6.4/iosevent?app_id=7xXxXxX1&buildnumber=7.0.1
<~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~~+~>
```

The response should include `statusCode = 200` (success). For example:
```
Result: {
    statusCode = 200; // ~~> success!
    ...
}
```
For more iOS integration tests, see [Here](https://dev.appsflyer.com/hc/docs/testing-ios)

## Testing for Android
Open your Android project with Android studio (`android` folder) and run it. In the logs section (adb), you will see logs related to AppsFlyer start with `I/AppsFlyer_x.x.x`.<br>
Search for launch event that looks like this:
```
I/AppsFlyer_7.0.1: url: https://launches.appsflyer.com/api/v6.4/androidevent?app_id=com.aXxXxt.rxXxXxt&buildnumber=7.0.1
I/AppsFlyer_7.0.1: response code: 200 // ~~> success!
```
For more Android integration tests, see [Here](https://dev.appsflyer.com/hc/docs/testing-android)