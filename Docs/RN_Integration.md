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
[MIGRATION.md](../MIGRATION.md#initsdk--init--explicit-startup) and
[RN_API.md — Initialization Flow](RN_API.md#initialization-flow) for the full recommended order.

| Parameter | Description   |
| -------- | ------------- |
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/207032066-Basic-SDK-integration-guide#retrieving-the-dev-key) provided by AppsFlyer (required)  |
| appId      | [App ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store) you configured in your AppsFlyer dashboard (optional per the type signature, but recommended for iOS)  |

`isDebug`, `onInstallConversionDataListener`, `onDeepLinkListener`, and `manualStart` are no
longer options on the init call — call [`enableDebug`](RN_API.md#enabledebug),
[`registerConversionListener`](RN_API.md#registerconversionlistener), and
[`registerDeepLinkListener`](RN_API.md#registerdeeplinklistener) as separate methods instead, and always finish with an
explicit [`start()`](RN_API.md#start) (SDK7 never auto-starts).

```javascript
import AppsFlyer from 'react-native-appsflyer';

const onDeepLink = (res) => { /* ... */ };

// registerDeepLinkListener is the one exception to "always after init()" — register it
// before init(), on both platforms. See RN_API.md — Initialization Flow.
AppsFlyer.registerDeepLinkListener({ onDeepLinking: onDeepLink });

AppsFlyer.init('K2***********99', '41*****44');
AppsFlyer.enableDebug(true);

// Register remaining listeners synchronously, before init's promise settles
AppsFlyer.registerConversionListener({
  onConversionDataSuccess: (res) => { /* ... */ },
  onConversionDataFail: (error) => { /* ... */ },
});

AppsFlyer.registerSessionReadyListener(() => {
  AppsFlyer.start().then(
    () => console.log('SDK started'),
    (err) => console.error('start failed', err)
  );
});
```

See [RN_API.md — Initialization Flow](RN_API.md#initialization-flow) for the full recommended call order and detailed explanation of why the order matters.
