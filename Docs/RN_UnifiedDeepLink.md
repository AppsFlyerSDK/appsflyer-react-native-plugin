---
title: Unified Deep Linking (UDL)
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 9
hidden: false
---

### UDL flow

1. The SDK is triggered by:
   - **Deferred Deep Linking** - using a dedicated API
   - **Direct Deep Linking** - triggered by the OS via Android App Link, iOS Universal Links or URI scheme.
2. The SDK triggers the `OnDeepLink` listener, and passes the deep link result object to the user.
3. The `OnDeepLink` listener uses the deep link result object that includes the `deep_link_value` and other parameters to create the personalized experience for the users, which is the main goal of OneLink.

> Check out the Unified Deep Linking docs for [Android](https://dev.appsflyer.com/docs/android-unified-deep-linking) and [iOS](https://dev.appsflyer.com/docs/ios-unified-deep-linking).

### Considerations:

* Requires AppsFlyer Android SDK V6.1.3 or later.
* Does not support SRN campaigns.
* Does not provide af_dp in the API response.
* onAppOpenAttribution will not be called. All code should migrate to `onDeepLink`.

### Implementation:

___Important___  The code implementation for `onDeepLink` must be made **prior to the initialization** code of the SDK.

Example:

```javascript
const onDeepLinkCanceller = appsFlyer.onDeepLink(res => {
  if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const DLValue = res?.data.deep_link_value;
        const mediaSrc = res?.data.media_source;
        const deepLinkSub1 = res?.data.deep_link_sub1; // get up to 10 custom OneLink params
	
	[...]
	
	const deepLinkSub10 = res?.data.deep_link_sub10; // get up to 10 custom OneLink params
        console.log(JSON.stringify(res?.data, null, 2));
      }
})

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true // -->  you must set the onDeepLinkListener to true to get onDeepLink callbacks
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);
```

