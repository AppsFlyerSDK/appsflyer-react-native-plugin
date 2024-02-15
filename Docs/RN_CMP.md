---
title: Send consent for DMA compliance
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 12
hidden: false
---

## Send consent for DMA compliance
The SDK offers two alternative methods for gathering consent data:

Through a Consent Management Platform (CMP): If the app uses a CMP that complies with the Transparency and Consent Framework (TCF) v2.2 protocol, the SDK can automatically retrieve the consent details.

OR

Through a dedicated SDK API: Developers can pass Google's required consent data directly to the SDK using a specific API designed for this purpose.

### Use CMP to collect consent data
A CMP compatible with TCF v2.2 collects DMA consent data and stores it in NSUserDefaults (iOS) and SharedPreferences (Android). To enable the SDK to access this data and include it with every event, follow these steps:

1. Call `appsFlyer.enableTCFDataCollection(true)`
2. Initialize the SDK in [manual start mode](/Docs/RN_API.md#initsdk)
3. Use the CMP to decide if you need the consent dialog in the current session to acquire the consent data. If you need the consent dialog move to step 4; otherwise move to step 5
4. Get confirmation from the CMP that the user has made their consent decision and the data is available in NSUserDefaults/SharedPreferences
5. Call `appsFlyer.startSdk()`
```javascript
 useEffect(() => {
    const option = {
    isDebug: true,
    devKey: 'UxXxXxXxXd',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true,
    timeToWaitForATTUserAuthorization: 10,
    manualStart: true, // <-- Manual start
    };
    // TCF data collection
    appsFlyer.enableTCFDataCollection(true);

    //init appsflyer
    appsFlyer.initSdk(
      option,
      res => {
        console.log(res);
      },
      err => {
        console.log(err);
      },
    );

    ...
    
    // CMP Pseudocode
    if (cmpManager.hasConsent()) {
        appsFlyer.startSdk();
    } else {
        cmpManager.presentConsentDialog(res => {
            appsFlyer.startSdk();
        });
    }
 },[])
```
## Manually collect consent data
If your app does not use a CMP compatible with TCF v2.2, use the SDK API detailed below to provide the consent data directly to the SDK.

### When GDPR applies to the user
If GDPR applies to the user, perform the following:

1. Given that GDPR is applicable to the user, determine whether the consent data is already stored for this session.
    1. If there is no consent data stored, show the consent dialog to capture the user consent decision.
    2. If there is consent data stored continue to the next step.
2. To transfer the consent data to the SDK create a JSON with the following parameters:<br>
    `hasConsentForDataUsage` - Indicates whether the user has consented to use their data for advertising purposes.<br>
    `hasConsentForAdsPersonalization` - Indicates whether the user has consented to use their data for personalized advertising.
3. Call `appsFlyer.setConsentData({})` with the JSON.
4. Call `appsFlyer.initSdk()`.
```javascript
useEffect(() => {
    const option = {
    isDebug: true,
    devKey: 'UxXxXxXxXd',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true,
    timeToWaitForATTUserAuthorization: 10,
    };

    // user consent data
    let consentData = {
      hasConsentForDataUsage: true/false,
      hasConsentForAdsPersonalization: true/false
    }

    appsFlyer.setConsentData(consentData);

    //start appsflyer
    appsFlyer.initSdk(
      option,
      res => {
        console.log(res);
      },
      err => {
        console.log(err);
      },
    );
 },[])
```
### When GDPR does not apply to the user

If GDPR doesn’t apply to the user perform the following:

1. Call `appsFlyer.setNonGDPRUser()`.
2. Call `appsFlyer.initSdk()`.
```javascript
useEffect(() => {
    const option = {
    isDebug: true,
    devKey: 'UxXxXxXxXd',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true,
    timeToWaitForATTUserAuthorization: 10,
    };

    // GDPR does not apply to the user
    appsFlyer.setNonGDPRUser()

    //start appsflyer
    appsFlyer.initSdk(
      option,
      res => {
        console.log(res);
      },
      err => {
        console.log(err);
      },
    );
 },[])
```