---
title: Integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 3
hidden: false
---

# Basic integration of the SDK
Initialize the SDK to enable AppsFlyer to detect installations, sessions (app opens) and updates.

`initSdk(options, success, error)` was **removed in 7.0.0**. Initialization is now a Promise-only
`init(devKey, appId)` call; the options it used to accept are now separate calls — see
[MIGRATION.md](../MIGRATION.md#initsdkoptions--replaced-by-initdevkey-appid) and
[RN_API.md — Initialization Flow](RN_API.md#initialization-flow) for the full recommended order.

| Parameter | Description   |
| -------- | ------------- |
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/207032066-Basic-SDK-integration-guide#retrieving-the-dev-key) provided by AppsFlyer (required)  |
| appId      | [App ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store) (required on iOS, unused on Android) you configured in your AppsFlyer dashboard  |

`isDebug`, `onInstallConversionDataListener`, `onDeepLinkListener`, and `manualStart` are no
longer options on the init call — call [`setIsDebug`](RN_API.md#setisdebug),
[`onInstallConversionData`](RN_API.md#oninstallconversiondata), and
[`onDeepLink`](RN_API.md#ondeeplink) as separate methods instead, and always finish with an
explicit [`start()`](RN_API.md#start) (SDK7 never auto-starts).

```javascript
import appsFlyer from 'react-native-appsflyer';

appsFlyer.init('K2***********99', '41*****44').then(
  (result) => console.log(result),
  (error) => console.error(error)
);
appsFlyer.setIsDebug(true);

// Register these synchronously, right after init() — never inside init().then()
appsFlyer.onInstallConversionData((res) => {
  // ...
});
appsFlyer.onDeepLink((res) => {
  // ...
});

appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start().then(
    () => console.log('SDK started'),
    (err) => console.error('start failed', err)
  );
});
```
