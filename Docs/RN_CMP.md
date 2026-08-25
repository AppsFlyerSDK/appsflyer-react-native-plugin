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

1. Call `AppsFlyer.enableTCFDataCollection(true)`
2. `init(devKey, appId)` and register listeners as usual (see [Initialization Flow](RN_API.md#initialization-flow)).
3. Use the CMP to decide if you need the consent dialog in the current session to acquire the consent data. If you need the consent dialog move to step 4; otherwise move to step 5
4. Get confirmation from the CMP that the user has made their consent decision and the data is available in NSUserDefaults/SharedPreferences
5. Call `AppsFlyer.start()` from inside `registerSessionReadyListener`'s callback, after the CMP decision is resolved
```javascript
useEffect(() => {
  // TCF data collection
  AppsFlyer.enableTCFDataCollection(true);

  AppsFlyer.init('UxXxXxXxXd', '41*****44').then(
    (res) => console.log(res),
    (err) => console.log(err)
  );
  AppsFlyer.enableDebug(true);

  AppsFlyer.registerSessionReadyListener(() => {
    // CMP Pseudocode
    if (cmpManager.hasConsent()) {
      AppsFlyer.start();
    } else {
      cmpManager.presentConsentDialog(res => {
        AppsFlyer.start();
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
3. Pass the consent data to the SDK using AppsFlyer.setConsentData(consentData) inside `registerSessionReadyListener`'s callback, before calling `start()`.
4. Initialize the SDK with `AppsFlyer.init(devKey, appId)` (see [Initialization Flow](RN_API.md#initialization-flow)).

#### Setting Consent Data for Users

##### When GDPR Applies

If GDPR applies to the user, pass a plain object with the user's preferences.
```javascript
import AppsFlyer from 'react-native-appsflyer';

useEffect(() => {
    AppsFlyer.init('UxXxXxXxXd', '41*****44').then(
        res => console.log(res),
        err => console.log(err)
    );
    AppsFlyer.enableDebug(true);

    AppsFlyer.registerSessionReadyListener(() => {
        // User has given consent
        const consentData = {
            isUserSubjectToGDPR: true,
            hasConsentForDataUsage: true,
            hasConsentForAdsPersonalization: true,
            hasConsentForAdStorage: true,
        };

        // Send consent data to the SDK
        AppsFlyer.setConsentData(consentData);

        AppsFlyer.start();
    });
}, []);
```

##### When GDPR Does Not Apply

If GDPR does not apply to the user, set `isUserSubjectToGDPR: false` and omit the rest. Use the same initialization flow as above:

```javascript
// GDPR does not apply to the user
const consentData = { isUserSubjectToGDPR: false };

AppsFlyer.setConsentData(consentData);
AppsFlyer.start();
```

### Consent Data API

`setConsentData` takes a plain object — there is no `AppsFlyerConsent` constructor class in this
plugin's current version.

```javascript
AppsFlyer.setConsentData({
    isUserSubjectToGDPR,             // Boolean (required) - whether GDPR applies to the user; no client-side default
    hasConsentForDataUsage,          // Boolean (optional) - Consent for data usage
    hasConsentForAdsPersonalization, // Boolean (optional) - Consent for ads personalization
    hasConsentForAdStorage,          // Boolean (optional) - Consent for ad storage
});

//Example Cases:

// Full consent for GDPR user
AppsFlyer.setConsentData({ isUserSubjectToGDPR: true, hasConsentForDataUsage: true, hasConsentForAdsPersonalization: true, hasConsentForAdStorage: true });

// No consent for GDPR user
AppsFlyer.setConsentData({ isUserSubjectToGDPR: true, hasConsentForDataUsage: false, hasConsentForAdsPersonalization: false, hasConsentForAdStorage: false });

// Non-GDPR user
AppsFlyer.setConsentData({ isUserSubjectToGDPR: false });

// Partial consent (only GDPR flag required, other fields optional)
AppsFlyer.setConsentData({ isUserSubjectToGDPR: true });
```

### Removed API

The `AppsFlyerConsent` constructor class (including its deprecated `forGDPRUser(...)`/
`forNonGDPRUser()` static helpers) is **no longer exported by this plugin** — build and pass the
plain object shown above directly to `setConsentData` instead.