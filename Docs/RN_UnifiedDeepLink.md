---
title: Unified Deep Linking (UDL)
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 9
hidden: false
---

> 📘 **UDL privacy protection**
> 
> For new users, the UDL method only returns parameters relevant to deferred deep linking: `deep_link_value` and `deep_link_sub1` to `deep_link_sub10`. If you try to get any other parameters (`media_source`, `campaign`, `af_sub1-5`, etc.), they return `null`.

### UDL flow

1. The SDK is triggered by:
   - **Deferred Deep Linking** - using a dedicated API
   - **Direct Deep Linking** - triggered by the OS via Android App Link, iOS Universal Links or URI scheme.
2. The SDK triggers the `registerDeepLinkListener` listener with a deep link result object that includes the `deep_link_value` and other parameters, which the listener uses to create the personalized experience for the users (the main goal of OneLink).

> Check out the Unified Deep Linking docs for [Android](https://dev.appsflyer.com/docs/android-unified-deep-linking) and [iOS](https://dev.appsflyer.com/docs/ios-unified-deep-linking).

### Considerations:

* Does not support SRN campaigns.
* Does not provide af_dp in the API response.
* `onAppOpenAttribution` and `onAttributionFailure` are **removed in 7.0.0** with no adapter — all code must migrate to `registerDeepLinkListener`.

### Implementation:

___Important___  The code implementation for `registerDeepLinkListener` must be made **prior to the initialization** code of the SDK.

Example:

```javascript
const onDeepLinkCanceller = appsFlyer.registerDeepLinkListener(res => {
  if (res?.status !== 'notFound') {
        const DLValue = res?.deepLink.deep_link_value;
        const mediaSrc = res?.deepLink.media_source;
        const deepLinkSub1 = res?.deepLink.deep_link_sub1; // custom OneLink param
        // Additional deep_link_sub2 through deep_link_sub10 may be present in the deepLink object
        
        console.log(JSON.stringify(res?.deepLink, null, 2));
      }
})

appsFlyer.init('K2***********99', '41*****44').then(
  (result) => console.log(result),
  (error) => console.error(error)
);
appsFlyer.enableDebug(false);
```

**Note on Android:** On Android, the `deepLink` payload may be delivered as a JSON string (requiring `JSON.parse`) rather than an object, while iOS delivers it as an object. Ensure your code handles both cases, e.g., by checking the type before accessing fields.

**Note:** `initSdk(options, success, error)` (with `isDebug`, `onInstallConversionDataListener`, `onDeepLinkListener` options) is **removed in 7.0.0** with no adapter. Use `init(devKey, appId)` + `enableDebug(enabled)` instead, and register `registerDeepLinkListener` synchronously — before `init()`'s promise settles, as shown above — rather than inside `init().then()`. See [RN_API.md](RN_API.md#initialization-flow) for the full recommended call order.

