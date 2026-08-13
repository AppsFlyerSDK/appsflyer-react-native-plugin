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
2. `init(devKey, appId)` and register listeners as usual (see [Initialization Flow](RN_API.md#initialization-flow)).
3. Use the CMP to decide if you need the consent dialog in the current session to acquire the consent data. If you need the consent dialog move to step 4; otherwise move to step 5
4. Get confirmation from the CMP that the user has made their consent decision and the data is available in NSUserDefaults/SharedPreferences
5. Call `appsFlyer.start()` from inside `registerSessionReadyListener`'s callback, after the CMP decision is resolved
```javascript
useEffect(() => {
  // TCF data collection
  appsFlyer.enableTCFDataCollection(true);

  appsFlyer.init('UxXxXxXxXd', '41*****44').then(
    (res) => console.log(res),
    (err) => console.log(err)
  );
  appsFlyer.enableDebug(true);

  appsFlyer.registerSessionReadyListener(() => {
    // CMP Pseudocode
    if (cmpManager.hasConsent()) {
      appsFlyer.start();
    } else {
      cmpManager.presentConsentDialog(res => {
        appsFlyer.start();
      });
    }
  });
}, [])
```

### Manually Collecting Consent Data

If your app does not use a TCF v2.2/2.3-compatible CMP, you must manually provide the consent data using the SDK API.

How to Set Consent Data:

1. Determine GDPR Applicability:
   - If GDPR applies, check whether consent data is already stored.
   - If not stored, show a consent dialog to obtain user consent.
2. Build a plain consent data object with the relevant parameters (see [Consent Data API](#consent-data-api) below).
3. Pass the consent data to the SDK using appsFlyer.setConsentData(consentData) inside `registerSessionReadyListener`'s callback, before calling `start()`.
4. Initialize the SDK with `appsFlyer.init(devKey, appId)` (see [Initialization Flow](RN_API.md#initialization-flow)).

#### Setting Consent Data for Users

##### When GDPR Applies

If GDPR applies to the user, pass a plain object with the user's preferences.
```javascript
import appsFlyer from 'react-native-appsflyer';

useEffect(() => {
    appsFlyer.init('UxXxXxXxXd', '41*****44').then(
        res => console.log(res),
        err => console.log(err)
    );
    appsFlyer.enableDebug(true);

    appsFlyer.registerSessionReadyListener(() => {
        // User has given consent
        const consentData = {
            isUserSubjectToGDPR: true,
            hasConsentForDataUsage: true,
            hasConsentForAdsPersonalization: true,
            hasConsentForAdStorage: true,
        };

        // Send consent data to the SDK
        appsFlyer.setConsentData(consentData);

        appsFlyer.start();
    });
}, []);
```

##### When GDPR Does Not Apply

If GDPR does not apply to the user, set `isUserSubjectToGDPR: false` and omit the rest. Use the same initialization flow as above:

```javascript
// GDPR does not apply to the user
const consentData = { isUserSubjectToGDPR: false };

appsFlyer.setConsentData(consentData);
appsFlyer.start();
```

### Consent Data API

`setConsentData` takes a plain object — there is no `AppsFlyerConsent` constructor class in this
plugin's current version.

```javascript
appsFlyer.setConsentData({
    isUserSubjectToGDPR,             // Boolean (required) - whether GDPR applies to the user; no client-side default
    hasConsentForDataUsage,          // Boolean (optional) - Consent for data usage
    hasConsentForAdsPersonalization, // Boolean (optional) - Consent for ads personalization
    hasConsentForAdStorage,          // Boolean (optional) - Consent for ad storage
});

//Example Cases:

// Full consent for GDPR user
appsFlyer.setConsentData({ isUserSubjectToGDPR: true, hasConsentForDataUsage: true, hasConsentForAdsPersonalization: true, hasConsentForAdStorage: true });

// No consent for GDPR user
appsFlyer.setConsentData({ isUserSubjectToGDPR: true, hasConsentForDataUsage: false, hasConsentForAdsPersonalization: false, hasConsentForAdStorage: false });

// Non-GDPR user
appsFlyer.setConsentData({ isUserSubjectToGDPR: false });

// Partial consent (only GDPR flag required, other fields optional)
appsFlyer.setConsentData({ isUserSubjectToGDPR: true });
```

### Removed API

The `AppsFlyerConsent` constructor class (including its deprecated `forGDPRUser(...)`/
`forNonGDPRUser()` static helpers) is **no longer exported by this plugin** — build and pass the
plain object shown above directly to `setConsentData` instead.