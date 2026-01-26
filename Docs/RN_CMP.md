---
title: Send consent for DMA compliance
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 12
hidden: false
---

## Send consent for DMA compliance
The SDK offers two alternative methods for gathering consent data:

Through a Consent Management Platform (CMP): If the app uses a CMP that complies with the Transparency and Consent Framework (TCF) v2.2/2.3 protocol, the SDK can automatically retrieve the consent details.

OR

Through a dedicated SDK API: Developers can pass Google's required consent data directly to the SDK using a specific API designed for this purpose.

### Use CMP to collect consent data
A CMP compatible with TCF v2.2/2.3 collects DMA consent data and stores it in NSUserDefaults (iOS) and SharedPreferences (Android). To enable the SDK to access this data and include it with every event, follow these steps:

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

### Manually Collecting Consent Data

If your app does not use a TCF v2.2/2.3-compatible CMP, you must manually provide the consent data using the SDK API.

How to Set Consent Data: </br>
1.	Determine GDPR Applicability:
    *	If GDPR applies, check whether consent data is already stored.
    *	If not stored, show a consent dialog to obtain user consent.
2.	Create an AppsFlyerConsent object with the relevant parameters.
3.	Pass the consent data to the SDK using appsFlyer.setConsentData(consentData).
4.	Initialize the SDK with appsFlyer.initSdk().

#### Setting Consent Data for Users

<b>When GDPR Applies</b>

If GDPR applies to the user, create an AppsFlyerConsent object with the user’s preferences.
```javascript
import appsFlyer, { AppsFlyerConsent } from 'react-native-appsflyer';

useEffect(() => {
    const option = {
        isDebug: true,
        devKey: 'UxXxXxXxXd',
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        timeToWaitForATTUserAuthorization: 10,
    };

    // User has given consent
    const consentData = new AppsFlyerConsent(true, true, true, true);

    // Send consent data to the SDK
    appsFlyer.setConsentData(consentData);

    // Start AppsFlyer SDK
    appsFlyer.initSdk(
        option,
        res => console.log(res),
        err => console.log(err)
    );
}, []);
```

<b>When GDPR Does Not Apply</b>

If GDPR does not apply to the user, simply mark it as such in the AppsFlyerConsent object.
```javascript
import appsFlyer, { AppsFlyerConsent } from 'react-native-appsflyer';

useEffect(() => {
    const option = {
        isDebug: true,
        devKey: 'UxXxXxXxXd',
        onInstallConversionDataListener: true,
        onDeepLinkListener: true,
        timeToWaitForATTUserAuthorization: 10,
    };

    // GDPR does not apply to the user
    const consentData = new AppsFlyerConsent(false);

    // Send consent data to the SDK
    appsFlyer.setConsentData(consentData);

    // Start AppsFlyer SDK
    appsFlyer.initSdk(
        option,
        res => console.log(res),
        err => console.log(err)
    );
}, []);
```

### Consent Object API

```javascript
//AppsFlyerConsent Constructor:

new AppsFlyerConsent(
    isUserSubjectToGDPR,          // Boolean (optional) - Whether GDPR applies to the user
    hasConsentForDataUsage,       // Boolean (optional) - Consent for data usage
    hasConsentForAdsPersonalization, // Boolean (optional) - Consent for ads personalization
    hasConsentForAdStorage        // Boolean (optional) - Consent for ad storage
);

//Example Cases:

// Full consent for GDPR user
const consent1 = new AppsFlyerConsent(true, true, true, true);

// No consent for GDPR user
const consent2 = new AppsFlyerConsent(true, false, false, false);

// Non-GDPR user
const consent3 = new AppsFlyerConsent(false);

// AppsFlyerConsent object support the following cases if they are needed.
const consent4 = new AppsFlyerConsent(true);
const consent5 = new AppsFlyerConsent(true, true);
const consent6 = new AppsFlyerConsent(null, true, true, true);
const consent7 = new AppsFlyerConsent(true, null, true, true);
const consent8 = new AppsFlyerConsent(true, true, null, true);
const consent9 = new AppsFlyerConsent(true, true, true, null);
const consent10 = new AppsFlyerConsent(true, true, false, true);
const consent11 = new AppsFlyerConsent(false, true, false, false);
const consent12 = new AppsFlyerConsent(null, null, null, null);
const consent13 = new AppsFlyerConsent();
```

### Deprecation Notice

The following methods have been deprecated since SDK version 6.16.2 and should no longer be used:
```javascript
// Deprecated since 6.16.2
AppsFlyerConsent.forGDPRUser(true, false);
AppsFlyerConsent.forNonGDPRUser();
```
Instead, use the new AppsFlyerConsent constructor.