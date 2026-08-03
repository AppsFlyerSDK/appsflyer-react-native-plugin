---
title: API reference
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 11
hidden: false
---

## APIs

The list of available methods for this plugin is described below.
- [APIs](#apis)
- [Android and iOS APIs](#android-and-ios-apis)
  - [Initialization Flow](#initialization-flow)
  - [initSdk](#initsdk)
  - [start](#start)
  - [enableDebug](#enabledebug)
  - [logEvent](#logevent)
    - [AFInAppEventType](#afinappeventtype)
  - [setCustomerUserId](#setcustomeruserid)
  - [stop](#stop)
  - [setAppInviteOneLink](#setappinviteonelink)
  - [setAdditionalData](#setadditionaldata)
  - [setResolveDeepLinkURLs](#setresolvedeeplinkurls)
  - [setOneLinkCustomDomain](#setonelinkcustomdomain)
  - [setCurrencyCode](#setcurrencycode)
  - [logLocation](#loglocation)
  - [anonymizeUser](#anonymizeuser)
  - [getAppsFlyerUID](#getappsflyeruid)
  - [getSdkVersion](#getsdkversion)
  - [setHost](#sethost)
  - [setUserEmail](#setuseremail)
  - [setUserEmails *Deprecated*](#setuseremails-deprecated)
  - [setUserPhone](#setuserphone)
  - [setUserFirstName](#setuserfirstname)
  - [setUserLastName](#setuserlastname)
  - [setUserFbLoginId](#setuserfbloginid)
  - [clearUserPii](#clearuserpii)
  - [generateInviteLink](#generateinvitelink)
  - [logInvite](#loginvite)
  - [logCrossPromoteImpression](#logcrosspromoteimpression)
  - [logAndOpenStore](#logandopenstore)
  - [setSharingFilterForAllPartners](#setsharingfilterforallpartners)
  - [setSharingFilter](#setsharingfilter)
  - [setSharingFilterForPartners](#setsharingfilterforpartners)
  - [setPartnerData](#setpartnerdata)
  - [validateAndLogInAppPurchase](#validateandloginapppurchase)
    - [AFPurchaseType Enum](#afpurchasetype-enum)
    - [AFPurchaseDetailsAndroid / AFPurchaseDetailsIOS Interfaces](#afpurchasedetailsandroid--afpurchasedetailsios-interfaces)
    - [Usage Example](#usage-example)
  - [updateServerUninstallToken](#updateserveruninstalltoken)
  - [sendPushNotificationData](#sendpushnotificationdata)
  - [addPushNotificationDeepLinkPath](#addpushnotificationdeeplinkpath)
  - [appendParametersToDeepLinkingURL](#appendparameterstodeeplinkingurl)
  - [setDisableAdvertisingIdentifiers](#setdisableadvertisingidentifiers)
  - [enableTCFDataCollection](#enabletcfdatacollection)
  - [setConsentData](#setconsentdata)
  - [logAdRevenue](#logadrevenue)
  - [setMinTimeBetweenSessions](#setmintimebetweensessions)
  - [setInstallId](#setinstallid)
  - [setDeepLinkTimeout](#setdeeplinktimeout)
  - [enableFacebookDeferredApplinks](#enablefacebookdeferredapplinks)
- [Android Only APIs](#android-only-apis)
  - [setCollectAndroidID](#setcollectandroidid)
  - [setCollectIMEI](#setcollectimei)
  - [setDisableNetworkData `setDisableNetworkData(isDisable)`](#setdisablenetworkdata-setdisablenetworkdataisdisable)
  - [performDeepLinking](#performdeeplinking)
  - [disableAppSetId](#disableappsetid)
  - [getHostName](#gethostname)
  - [getHostPrefix](#gethostprefix)
  - [getOutOfStore](#getoutofstore)
  - [setOutOfStore](#setoutofstore)
  - [getAttributionId](#getattributionid)
  - [isStopped](#isstopped)
  - [isPreInstalledApp](#ispreinstalledapp)
  - [setLogLevel](#setloglevel)
  - [setIsUpdate](#setisupdate)
  - [setAppId](#setappid)
  - [setPreinstallAttribution](#setpreinstallattribution)
  - [logSession](#logsession)
- [iOS Only APIs](#ios-only-apis)
  - [setDisableCollectASA](#setdisablecollectasa)
  - [setDisableIDFVCollection](#setdisableidfvcollection)
  - [setUseReceiptValidationSandbox](#setusereceiptvalidationsandbox)
  - [setUseUninstallSandbox](#setuseuninstallsandbox)
  - [setDisableSKAdNetwork](#setdisableskadnetwork)
  - [setCurrentDeviceLanguage](#setcurrentdevicelanguage)
  - [setShouldCollectDeviceName](#setshouldcollectdevicename)
  - [iOS AppDelegate lifecycle forwarding (native-only)](#ios-appdelegate-lifecycle-forwarding-native-only)
  - [setFacebookDeferredAppLink](#setfacebookdeferredapplink)
- [AppsFlyerConversionData](#appsflyerconversiondata)
  - [registerConversionListener](#registerconversionlistener)
  - [unregisterConversionListener](#unregisterconversionlistener)
  - [onAppOpenAttribution](#onappopenattribution)
  - [onAttributionFailure](#onattributionfailure)
  - [registerDeepLinkListener](#registerdeeplinklistener)
  - [unregisterForDeepLink](#unregisterfordeeplink)
  - [registerSessionReadyListener](#registersessionreadylistener)
  - [isSessionReady](#issessionready)
  - [unregisterSessionReadyListener](#unregistersessionreadylistener)
---

## Android and iOS APIs

### Initialization Flow

Recommended call order for a 7.0.0 (RPC) integration:

1. `init(devKey, appId)`
2. `enableDebug(true)` — not order-critical relative to `init`; call it as early as possible (even before `init`) to get full debug logs from the start of the session
3. Register `registerConversionListener` / `registerDeepLinkListener` — **synchronously**, in the same call stack as `init`, not inside `init()`'s `.then()`
4. `setCustomerUserId(...)` — if you need the CUID associated with the install event
5. `registerSessionReadyListener(...)` — **synchronously**, same rule as step 3
6. Inside the `registerSessionReadyListener` callback: collect consent data (`setConsentData`) / ATT authorization status if your app requires it, then call `start()`

*Example:*

```javascript
import appsFlyer from 'react-native-appsflyer';

appsFlyer.init('K2***********99', '41*****44').then(
  (res) => console.log('init', res),
  (err) => console.error('init failed', err)
);
appsFlyer.enableDebug(true);

appsFlyer.registerConversionListener((res) => {
  // ...
});
appsFlyer.registerDeepLinkListener((res) => {
  // ...
});

// appsFlyer.setCustomerUserId('some_user_id'); // if needed, before start

appsFlyer.registerSessionReadyListener(() => {
  // Collect consent / ATT status here if your app requires it, e.g.:
  // appsFlyer.setConsentData(consent);
  appsFlyer.start().then(
    () => console.log('SDK started'),
    (err) => console.error('start failed', err)
  );
});
```

**Why the order matters:**
- `init` must be issued first. `enableDebug` and the listener registrations below all go over the same native RPC channel in call order — issuing them right after `init` guarantees the native side processes `init` first, even though `init()`'s own JS Promise resolves later, asynchronously.
- `registerConversionListener`, `registerDeepLinkListener`, and `registerSessionReadyListener` must be registered before `init()`'s promise settles. Registration itself is init-order-independent, but dispatch still happens in call order — registering inside `init().then()` delays dispatch and risks missing an event that fires shortly after init.
- `start()` must be called from inside the `registerSessionReadyListener` callback, never chained off `init().then()` — see [start](#start).

---

### initSdk — removed in 7.0.0

`initSdk(options, success, error)` is **removed**. Use `init(devKey, appId)` instead — a Promise-only call. `isDebug`, `onInstallConversionDataListener`, `onDeepLinkListener`, and `manualStart` are no longer options on the init call; see
[MIGRATION.md](../MIGRATION.md#initsdkoptions--replaced-by-initdevkey-appid) for the full
replacement pattern (`enableDebug`, `registerConversionListener`, `registerDeepLinkListener`,
`registerSessionReadyListener` + `start`), and [Initialization Flow](#initialization-flow) above for the recommended call order. 

*Example:*

```javascript
import appsFlyer from 'react-native-appsflyer';

appsFlyer.init('K2***********99', '41*****44').then(
  (res) => console.log(res),
  (err) => console.error(err)
);

appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start();
});
```
---

### start
`start()`

7.0.0 always requires an explicit `start()` call — the native SDK never auto-starts (there is
no `manualStart` option any more, since `initSdk` itself is removed; see
[MIGRATION.md](../MIGRATION.md#initsdkoptions--replaced-by-initdevkey-appid)). `start()` isn't
gated by the bridge — it can technically be called at any point, even before `init()` — but doing
so isn't meaningful: there's no session for the native SDK to start yet. Keep it in the order
shown in [Initialization Flow](#initialization-flow), calling it from inside
`registerSessionReadyListener`'s callback, after any consent/ATT status you need to collect.

*Example:*
```javascript
appsFlyer.init('UsxXxXxed', '75xXxXxXxXx11');

appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start().then(
    () => console.warn('AppsFlyer SDK started!'),
    (err) => { /* handle error */ }
  );
});
```
---

### enableDebug
`enableDebug(enabled)`

Enable native SDK debug logging. Dispatched as its own RPC call, separate from `init`. Not
order-critical relative to `init` — call it as early as possible (even before `init`) to get
full debug logs from the start of the session.

| parameter | type    | description                |
| --------- |---------|----------------------------|
| enabled   | boolean | true to enable debug logs  |

*Example:*

```javascript
appsFlyer.enableDebug(true);
```

---

### logEvent
`logEvent(eventName, eventValues, success, error)`

In-App Events provide insight on what is happening in your app. It is recommended to take the time and define the events you want to measure to allow you to measure ROI (Return on Investment) and LTV (Lifetime Value).

Recording in-app events is performed by calling logEvent with event name and value parameters. See In-App Events documentation for more details.

**Note:** An In-App Event name must be no longer than 45 characters. Events names with more than 45 characters do not appear in the dashboard, but only in the raw Data, Pull and Push APIs.

| parameter    | type     | description                                   |
| -----------  |----------|------------------------------------------     |
| eventName    | string   | The name of the event                         |
| eventValues  | json     | The event values that are sent with the event |
| success      | function | success callback                              |
| error        | function | success callback                              |

*Example:*

```javascript
const eventName = 'af_add_to_cart';
const eventValues = {
  af_content_id: 'id123',
  af_currency: 'USD',
  af_revenue: '2',
};

appsFlyer.logEvent(
  eventName,
  eventValues,
  (res) => {
    console.log(res);
  },
  (err) => {
    console.error(err);
  }
);
```

`awaitResponse` (optional, positional after `eventValues` when no callbacks are passed, or as the trailing arg alongside callbacks): by default resolves once the SDK accepts the event onto its internal queue — not once it's delivered to AppsFlyer's server. Pass `awaitResponse: true` to instead wait for the native SDK's own completion handler (round-trips to AppsFlyer's server).

#### AFInAppEventType

A frozen object of predefined in-app event name constants (e.g. `af_purchase`, `af_login`, `af_add_to_cart`) for use as `eventName`.

```javascript
import appsFlyer, { AFInAppEventType } from 'react-native-appsflyer';

appsFlyer.logEvent(AFInAppEventType.PURCHASE, { af_revenue: 2 });
```

---

### setCustomerUserId
`setCustomerUserId(userId, callback)`

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs.<br>
If you wish to see the CUID (Customer User ID) under your installs raw data reports, it should be called before starting the SDK.<br>
If you simply would like to add additional user id to the events raw data reports, then you can freely call it anytime you need.


| parameter | type     | description      |
| ----------|----------|------------------|
| userId    | string   | user ID          |
| callback  | function | success callback |


*Example:*

```javascript
appsFlyer.setCustomerUserId('some_user_id', (res) => {
  //..
});
```

---

### stop
`stop(shouldStop)`

In some extreme cases you might want to shut down all SDK functions due to legal and privacy compliance. This can be achieved with the stopSDK API. Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.

There are several different scenarios for user opt-out. We highly recommend following the exact instructions for the scenario, that is relevant for your app.

In any event, the SDK can be reactivated by calling the same API, by passing false.

| parameter   | type     | description                                          |
| ----------  |----------|------------------                                    |
| shouldStop  | boolean  | True if the SDK is stopped (default value is false). |

*Example:*

```javascript
appsFlyer.stop(true);
```

---

### setAppInviteOneLink
`setAppInviteOneLink(oneLinkId)`

Set the OneLink ID that should be used for User-Invite-API.<br/>
The link that is generated for the user invite will use this OneLink ID as the base link ID.

| parameter   | type     | description               |
| ----------  |----------|------------------         |
| oneLinkId   | string   | oneLinkId                 |


*Example:*

```javascript
appsFlyer.setAppInviteOneLink('abcd');
```

---

### setAdditionalData
`setAdditionalData(additionalData, callback)`

The setAdditionalData API is required to integrate on the SDK level with several external partner platforms, including Segment, Adobe and Urban Airship. Use this API only if the integration article of the platform specifically states setAdditionalData API is needed.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| additionalData  | json     | additional data           |
| callback        | function | success callback          |


*Example:*

```javascript
appsFlyer.setAdditionalData(
  {
    val1: 'data1',
    val2: false,
    val3: 23,
  },
  (res) => {
    //...
  }
);
```

---

### setResolveDeepLinkURLs
`setResolveDeepLinkURLs(urls, successC, errorC)`

Set domains used by ESP when wrapping your deeplinks.<br/>
Use this API during the SDK Initialization to indicate that links from certain domains should be resolved in order to get original deeplink<br/>
For more information please refer to the [documentation](https://support.appsflyer.com/hc/en-us/articles/360001409618-Email-service-provider-challenges-with-iOS-Universal-links) <br/>

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| urls                        | array    | Comma separated array of ESP domains requiring resolving   |
| successC                    | function | success callback                                           |
| errorC                      | function | error callback                                             |


*Example:*

```javascript
appsFlyer.setResolveDeepLinkURLs(["click.esp-domain.com"],
    (res) => {
        console.log(res);
    }, (error) => {
        console.log(error);
    });
```

---

### setOneLinkCustomDomain
`setOneLinkCustomDomain(domains) : Promise<unknown>`

 Set Onelink custom/branded domains<br/>
 Use this API during the SDK Initialization to indicate branded domains.<br/>
 For more information please refer to the [documentation](https://support.appsflyer.com/hc/en-us/articles/360002329137-Implementing-Branded-Links)

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| domains                     | array    | Comma separated array of branded domains                   |


*Example:*

```javascript
appsFlyer.setOneLinkCustomDomain(["click.mybrand.com"]).then(
    (res) => {
        console.log(res);
    }, (error) => {
        console.log(error);
    });
```

---

### setCurrencyCode
`setCurrencyCode(currencyCode, callback)`

Setting user local currency code for in-app purchases.<br/>
The currency code should be a 3 character ISO 4217 code. (default is USD).<br/>
You can set the currency code for all events by calling the following method.<br/>

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| currencyCode    | string   | currencyCode              |
| callback        | function | success callback          |


*Example:*

```javascript
appsFlyer.setCurrencyCode(currencyCode, () => {});
```

---

### logLocation
`logLocation(longitude, latitude, callback)`

Manually record the location of the user.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| longitude       | float    | longitude                 |
| latitude        | float    | latitude                  |
| callback        | function | Success / Error Callbacks |


*Example:*

```javascript
const latitude = -18.406655;
const longitude = 46.40625;

appsFlyer.logLocation(longitude, latitude, (err, coords) => {
  if (err) {
    console.error(err);
  } else {
    //...
  }
});
```

---

### anonymizeUser
`anonymizeUser(shouldAnonymize, callback)`

It is possible to anonymize specific user identifiers within AppsFlyer analytics.
This complies with both the latest privacy requirements (GDPR, COPPA) and Facebook's data and privacy policies.
To anonymize an app user.

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| shouldAnonymize             | boolean  | True if want Anonymize user Data (default value is false). |
| callback                    | function | success callback                                           |


*Example:*

```javascript
appsFlyer.anonymizeUser(true, () => {});
```

---

### getAppsFlyerUID
`getAppsFlyerUID(callback)`

AppsFlyer's unique device ID is created for every new install of an app. Use the following API to obtain AppsFlyer’s Unique ID.


| parameter | type     | description                     |
| ----------|----------|------------------               |
| callback  | function | returns `(error, appsFlyerUID)` |


*Example:*

```javascript
appsFlyer.getAppsFlyerUID((err, appsFlyerUID) => {
  if (err) {
    console.error(err);
  } else {
    console.log('on getAppsFlyerUID: ' + appsFlyerUID);
  }
});
```

---

### getSdkVersion
`getSdkVersion() : Promise<string>`

Returns the AppsFlyer native SDK version used by the plugin.

*Example:*

```javascript
const version = await appsFlyer.getSdkVersion();
console.log('AppsFlyer SDK version: ' + version);
```

---

### setHost
`setHost(hostPrefix, hostName, successC)`

Set a custom host

| parameter | type     | description      |
| ----------|----------|------------------|
| hostPrefix    | string   | the host prefix |
| hostName  | string | the host name |
| successC  | function | success callback |


*Example:*

```javascript
appsFlyer.setHost('foo', 'bar.appsflyer.com', res => console.log(res));
```
---

### setUserEmail
`setUserEmail(email, success, error)`

Set the user email. The email is hashed by the native SDK before transmission.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| email           | string   | the user's email address  |
| success         | function | success callback          |
| error           | function | error callback            |


*Example:*

```javascript
appsFlyer.setUserEmail(
  'user1@gmail.com',
  (res) => {
    //...
  },
  (err) => {
    console.error(err);
  }
);
```

---

### setUserEmails *Deprecated*
`setUserEmails(options, success, error)`
> **Deprecated!** Use [setUserEmail](#setuseremail).

The native SDK exposes a single-address `setUserEmail` only. Neither the `emails` array nor
`emailsCryptType` has a native counterpart on either platform, so `AF_EMAIL_CRYPT_TYPE` is
meaningless for this call. This method logs a warning and forwards **only the first** address.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| configuration   | json     | email configuration       |
| success         | function | success callback          |
| error           | function | error callback            |


| option          | type  | description  |
| --------------  | ----  |------------- |
| emailsCryptType | int   | ignored |
| emails          | array | only the first address is sent |

---

### setUserPhone
`setUserPhone(countryCode, phoneNumber)`

Set the user phone number. The number is hashed by the native SDK before transmission.<br>
The native SDK reads a split country code and subscriber number — a single combined string is not supported.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| countryCode     | string   | country code, e.g. `'1'` or `'+1'` |
| phoneNumber     | string   | subscriber number, without the country code |


*Example:*

```javascript
appsFlyer.setUserPhone('1', '5551234567');
```

---

### setUserFirstName
`setUserFirstName(firstName)`

Set the user's first name. Hashed by the native SDK before transmission.

| parameter | type   | description       |
| --------- |--------|-------------------|
| firstName | string | the user's first name |

*Example:*

```javascript
appsFlyer.setUserFirstName('Jane');
```

---

### setUserLastName
`setUserLastName(lastName)`

Set the user's last name. Hashed by the native SDK before transmission.

| parameter | type   | description       |
| --------- |--------|-------------------|
| lastName  | string | the user's last name |

*Example:*

```javascript
appsFlyer.setUserLastName('Doe');
```

---

### setUserFbLoginId
`setUserFbLoginId(fbLoginId)`

Set the user's Facebook login ID. The ID is sent as a JSON number — iOS parses it with `requireInt64` and rejects a JSON string, so a numeric string is coerced for you.

| parameter       | type              | description                |
| ----------      |-------------------|------------------          |
| fbLoginId       | string \| number  | numeric Facebook login ID  |


*Example:*

```javascript
appsFlyer.setUserFbLoginId(1234567890);
appsFlyer.setUserFbLoginId('1234567890'); // coerced to a number
```

---

### clearUserPii
`clearUserPii()`

Clear all previously set hashed PII (phone, first/last name, Facebook login ID, emails).

*Example:*

```javascript
appsFlyer.clearUserPii();
```

---

### generateInviteLink
`generateInviteLink(parameters, success, error)`


| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| parameters      | json     | parameters for Invite link       |
| success         | function | success callback (generated link)|
| error           | function | error callback                   |


*Example:*

```javascript
appsFlyer.generateInviteLink(
 {
   channel: 'gmail',
   campaign: 'myCampaign',
   customerID: '1234',
   userParams: {
     myParam: 'newUser',
     anotherParam: 'fromWeb',
     amount: 1,
   },
 },
 (link) => {
   console.log(link);
 },
 (err) => {
   console.log(err);
 }
);
```

A complete list of supported parameters is available [here](https://support.appsflyer.com/hc/en-us/articles/115004480866-User-Invite-Tracking). Custom parameters can be passed using a userParams{} nested object, as in the example above.

Note:<br>
1. `customerID` and `baseDeeplink` are supported. The plugin translates them to the native key names for you (iOS `referrerCustomerId`, Android `customerId`, both `baseDeepLink`).

---

### logInvite
`logInvite(channel, eventParameters)`

Log a user invite event.

| parameter       | type   | description                                    |
| --------------- |--------|--------------------------------------------------|
| channel         | string | the channel through which the invite was sent. Optional. |
| eventParameters | object | additional event parameters. Optional.            |

*Example:*

```javascript
appsFlyer.logInvite('facebook', { af_content_id: 'id123' });
```

---

### logCrossPromoteImpression
`logCrossPromoteImpression(appId, campaign, userParams)`

Attribute an impression for a cross-promotion. Use the promoted App ID as it appears within the AppsFlyer dashboard.

| parameter  | type   | description                                          |
| ---------- |--------|--------------------------------------------------------|
| appId      | string | promoted App ID                                        |
| campaign   | string | cross promotion campaign                                |
| userParams | object | additional params to be added to the attribution link  |

*Example:*

```javascript
appsFlyer.logCrossPromoteImpression('123456789', 'myCampaign', { af_sub1: 'value' });
```

---

### logAndOpenStore
`logAndOpenStore(promotedAppId, campaign, userParams)`

Attribute a cross-promotion click and launch the app store's app page.

| parameter     | type   | description                    |
| ------------- |--------|-----------------------------------|
| promotedAppId | string | promoted App ID                   |
| campaign      | string | cross promotion campaign          |
| userParams    | object | additional user params            |

*Example:*

```javascript
appsFlyer.logAndOpenStore('123456789', 'myCampaign', { af_sub1: 'value' });
```

---

### setSharingFilterForAllPartners / setSharingFilter — removed in 7.0.0

Both were deprecated since 6.4.0 in favor of `setSharingFilterForPartners` and are now
**removed** with no adapter. See
[MIGRATION.md](../MIGRATION.md#setsharingfilterforallpartners--setsharingfilter--removed).
Use `setSharingFilterForPartners(['all'])` or `setSharingFilterForPartners([...partners])`
instead (documented below).
---

### setSharingFilterForPartners
`setSharingFilterForPartners(partners)`

Used by advertisers to exclude networks/integrated partners from getting data.

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| partners                    | array    | Comma separated array of partners that need to be excluded |

*Example:*

```javascript
appsFlyer.setSharingFilterForPartners([]);                                        // Reset list (default)
appsFlyer.setSharingFilterForPartners(null);                                      // Reset list (default)
appsFlyer.setSharingFilterForPartners(['facebook_int']);                          // Single partner
appsFlyer.setSharingFilterForPartners(['facebook_int', 'googleadwords_int']);     // Multiple partners
appsFlyer.setSharingFilterForPartners(['all']);                                   // All partners
appsFlyer.setSharingFilterForPartners(['googleadwords_int', 'all']);              // All partners
```
---

### setPartnerData
`setPartnerData(partnerId, partnerData)`

Allows sending custom data for partner integration purposes.

| parameter    | type   | description                                             |
| ------------ |--------|----------------------------------------------------------|
| partnerId    | string | ID of the partner (usually suffixed with `_int`)          |
| partnerData  | object | customer data, depends on the integration configuration with the specific partner |

*Example:*

```javascript
appsFlyer.setPartnerData('example_partner_int', { key: 'value' });
```

---

### validateAndLogInAppPurchase
`validateAndLogInAppPurchase(purchaseDetails, additionalParameters, callback): void`

> ⚠️ **`callback` is currently inert**: no native event delivers a validation result yet — this
> call only dispatches the RPC (fire-and-forget). A 401/500 response logged via `console.warn`
> is an expected server-side rejection when the app isn't registered for purchase validation,
> not a bridge failure. The pre-7.0.0 `(purchaseInfo, successC, errorC)` signature was removed
> with no adapter — see [MIGRATION.md](/MIGRATION.md).

Receipt validation is a secure mechanism whereby the payment platform (e.g. Apple or Google) validates that an in-app purchase indeed occurred as reported.
Learn more - https://support.appsflyer.com/hc/en-us/articles/207032106-Receipt-validation-for-in-app-purchases
❗Important❗ for iOS - set SandBox to ```true```
```appsFlyer.setUseReceiptValidationSandbox(true);```

The `validateAndLogInAppPurchase` API uses `AFPurchaseDetails` (a union of `AFPurchaseDetailsAndroid` and `AFPurchaseDetailsIOS`) and `AFPurchaseType` enum for structured purchase validation. The two platforms report different native purchase identifiers — Android's `purchaseToken` vs. iOS's `transactionId` — so the shape is now split per platform instead of conflating both fields into one.

#### AFPurchaseType Enum

```javascript
import { AFPurchaseType } from 'react-native-appsflyer';

AFPurchaseType.SUBSCRIPTION        // "subscription"
AFPurchaseType.ONE_TIME_PURCHASE   // "one_time_purchase"
```

#### AFPurchaseDetailsAndroid / AFPurchaseDetailsIOS Interfaces

```typescript
interface AFPurchaseDetailsAndroid {
  productId: string;               // Product identifier
  purchaseToken: string;           // Android purchase token
  purchaseType: AFPurchaseType;    // Type of purchase
}

interface AFPurchaseDetailsIOS {
  productId: string;               // Product identifier
  transactionId: string;           // iOS transaction identifier
  purchaseType: AFPurchaseType;    // Type of purchase
}

type AFPurchaseDetails = AFPurchaseDetailsAndroid | AFPurchaseDetailsIOS;
```

#### Usage Example

```javascript
import appsFlyer, { AFPurchaseType } from 'react-native-appsflyer';

const additionalParams = {
  revenue: 9.99,
  currency: "USD"
};

// iOS
appsFlyer.validateAndLogInAppPurchase({
  productId: "deviceIdconsumableid",
  transactionId: "2000000569065806",
  purchaseType: AFPurchaseType.ONE_TIME_PURCHASE,
}, additionalParams);

// Android
appsFlyer.validateAndLogInAppPurchase({
  productId: "deviceIdconsumableid",
  purchaseToken: "purchase-token-from-billing-client",
  purchaseType: AFPurchaseType.ONE_TIME_PURCHASE,
}, additionalParams);
```

**Important Notes:**

- The third `callback` argument is accepted for signature compatibility but is currently never
  invoked — no native event delivers a validation result yet. Don't rely on it.
- A 401/500 logged via `console.warn` after calling this means the app isn't registered for
  purchase validation on the server side — expected, not a bridge failure.

---

### updateServerUninstallToken
`updateServerUninstallToken(token, callback)`

Manually pass the Firebase / GCM Device Token for Uninstall measurement.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| token           | string   | FCM Token                 |
| callback        | function | success callback          |


*Example:*

```javascript
appsFlyer.updateServerUninstallToken('token', (res) => {
  //...
});
```

---

### sendPushNotificationData
`sendPushNotificationData(pushPayload, ErrorCB, androidCampaignData): void`
Push-notification campaigns are used to create fast re-engagements with existing users.<br>
[Learn more](https://support.appsflyer.com/hc/en-us/articles/207364076-Measuring-Push-Notification-Re-Engagement-Campaigns)<br>
For Android platform, AppsFlyer SDK uses the activity in order to process the push payload. Make sure you call this api when the app's activity is available (NOT dead state).<br>
From version ***6.6.0*** we added an error callback that returns an error message.<br>
The platforms read different parts of the call: iOS takes the raw notification payload and locates the `af` block itself, while Android builds an `AFPushData` from the explicit fields in `androidCampaignData`.<br>
If `androidCampaignData` is omitted, a warning is logged and Android reports an empty re-engagement. iOS is unaffected.<br>

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| pushPayload      | json     | push notification payload (read by iOS)      |
| ErrorCB      | function     | returns an error msg when the payload has not been sent      |
| androidCampaignData | json | Android campaign fields — see below      |


| androidCampaignData  | type    | description  |
| -------------------  | ----    |------------- |
| campaign             | string  | campaign name |
| pid                  | string  | media source identifier |
| isRetargeting        | boolean | true for a re-engagement |
| additionalParameters | json    | additional campaign parameters |


*Example:*

```javascript
const pushPayload = {
            af:{
                c:"test_campaign",
                is_retargeting:true,
                pid:"push_provider_int",
            },
            aps:{
                alert:"Get 5000 Coins",
                badge:"37",
                sound:"default"
            }
        };
        appsFlyer.sendPushNotificationData(
          pushPayload,
          err => console.log(err),
          {
            campaign: 'test_campaign',
            pid: 'push_provider_int',
            isRetargeting: true,
          }
        );
```

---
### addPushNotificationDeepLinkPath
`addPushNotificationDeepLinkPath(path, SuccessCB, ErrorCB): void`

Adds array of keys, which are used to compose key path to resolve deeplink from push notification payload.

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| path      | array     | array of Strings that corresponds to the JSON path of the deep link.       |
| successCB         | function | success callback |
| errorCB           | function | error callback                   |

*Example:*

```javascript
let path = ['deeply', 'nested', 'deep_link'];
appsFlyer.addPushNotificationDeepLinkPath(
  path,
  res => console.log(res),
  error => console.log(error),
);
```
This call matches the following payload structure:
```javascript
{
  ...
  "deeply": {
    "nested": {
      "deep_link": "https://yourdeeplink2.onelink.me"
    }
  }
  ...
}
```

---
### appendParametersToDeepLinkingURL
`appendParametersToDeepLinkingURL(contains, parameters): void`

Matches URLs that contain `contains` as a substring and appends query parameters to them. In case the URL does not match, parameters are not appended to it.<br>
Note:<br>
1. The `parameters` object must be consisted of `string` key and `string` value
2. Call this api *before* calling `appsFlyer.initSDK()`
3. You must provide the following parameters:
  `pid`, `is_retargeting` most be set to `'true'`

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| contains        | string   | The string to check in URL |
| parameters      | object   | Parameters to append to the deeplink url after it passed validation |

*Example:*

```javascript
appsFlyer.appendParametersToDeepLinkingURL('substring-of-url', {param1: 'value', pid: 'value2', is_retargeting: 'true'});
```

---
### setDisableAdvertisingIdentifiers
`setDisableAdvertisingIdentifiers(disable): void`

Disables collection of various Advertising IDs by the SDK.<br>
**Anroid:** Google Advertising ID (GAID), OAID and Amazon Advertising ID (AAID)<br>
**iOS:** Apple's advertisingIdentifier (IDFA)

| parameter | type     | description                      |
| --------- |----------|------------------                |
| disable   | boolean  | Flag that disable/enable Advertising ID collection       |

*Example:*

```javascript
appsFlyer.setDisableAdvertisingIdentifiers(true);
```

---
### enableTCFDataCollection
`enableTCFDataCollection(enabled): void`

instruct the SDK to collect the TCF data from the device.


| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| enabled  | boolean  |   enable/disable TCF data collection      |

*Example:*

```javascript
appsFlyer.enableTCFDataCollection(true);
```

---
### setConsentData
`setConsentData(consentObject): void`

When GDPR applies to the user and your app does not use a CMP compatible with TCF v2.2/2.3, use this API to provide the consent data directly to the SDK.

Use the `AppsFlyerConsent` constructor:

```javascript
import appsFlyer, {AppsFlyerConsent} from 'react-native-appsflyer';

// Full consent for GDPR user
const consent1 = new AppsFlyerConsent(true, true, true, true);

// No consent for GDPR user
const consent2 = new AppsFlyerConsent(true, false, false, false);

// Non-GDPR user
const consent3 = new AppsFlyerConsent(false);

appsFlyer.setConsentData(consent1);
```

**Constructor parameters:**
| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| isUserSubjectToGDPR  | boolean  | Whether GDPR applies to the user (required)       |
| hasConsentForDataUsage  | boolean  | Consent for data usage (optional)       |
| hasConsentForAdsPersonalization  | boolean  | Consent for ads personalization (optional)       |
| hasConsentForAdStorage  | boolean  | Consent for ad storage (optional)       |

### logAdRevenue
`logAdRevenue(data): void`

Use this method to log your ad revenue.</br>
By attributing ad revenue, app owners gain the complete view of user LTV and campaign ROI.
Ad revenue is generated by displaying ads on rewarded videos, offer walls, interstitials, and banners in an app.

| Param      | Type                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **`data`** | `{ monetizationNetwork, mediationNetwork, currencyIso4217Code, revenue, additionalParameters? }` |

*Example:*

```javascript
const adRevenueData = {
  monetizationNetwork: 'AF-AdNetwork',
  mediationNetwork: MEDIATION_NETWORK.IRONSOURCE,
  currencyIso4217Code: 'USD',
  revenue: 1.23,
  additionalParameters: {
    customParam1: 'value1',
    customParam2: 'value2',
  }
};

appsFlyer.logAdRevenue(adRevenueData);
```

Here's how you use `appsFlyer.logAdRevenue` within a React Native app:

1. Prepare the `adRevenueData` object as shown, including any additional parameters you wish to track along with the ad revenue event.
2. Call the `appsFlyer.logAdRevenue` method with the `adRevenueData` object.

By passing all the required fields (`monetizationNetwork`, `mediationNetwork`, `currencyIso4217Code`, `revenue`), you help ensure accurate tracking within the AppsFlyer platform. This enables you to analyze your ad revenue alongside other user acquisition data to optimize your app's overall monetization strategy.

**Note:** The `additionalParameters` object is optional. You can add any additional data you want to log with the ad revenue event in this object. This can be useful for detailed analytics or specific event tracking later on. Make sure that the custom parameters follow the data types and structures specified by AppsFlyer in their documentation.

---

### setMinTimeBetweenSessions
`setMinTimeBetweenSessions(seconds) : Promise<void>`

Set the minimum time that must elapse between app launches for a new session to be counted.

| parameter | type   | description                                   |
| --------- |--------|------------------------------------------------|
| seconds   | number | minimum number of seconds between sessions     |

*Example:*

```javascript
appsFlyer.setMinTimeBetweenSessions(10);
```

---

### setInstallId
`setInstallId(installId) : Promise<void>`

Override the AppsFlyer-generated install ID with a custom identifier.

| parameter | type   | description       |
| --------- |--------|-------------------|
| installId | string | custom install ID |

*Example:*

```javascript
appsFlyer.setInstallId('custom-install-id');
```

---

### setDeepLinkTimeout
`setDeepLinkTimeout(timeout) : Promise<void>`

Set how long the SDK waits to resolve a deep link before giving up.

| parameter | type   | description                                    |
| --------- |--------|-------------------------------------------------|
| timeout   | number | deep link resolution timeout, in milliseconds   |

*Example:*

```javascript
appsFlyer.setDeepLinkTimeout(5000);
```

---

### enableFacebookDeferredApplinks
`enableFacebookDeferredApplinks(isEnabled) : Promise<void>`

Enable or disable resolution of Facebook deferred app links.

| parameter | type    | description                                       |
| --------- |---------|----------------------------------------------------|
| isEnabled | boolean | true to enable Facebook deferred app link resolution |

*Example:*

```javascript
appsFlyer.enableFacebookDeferredApplinks(true);
```

## Android Only APIs

### setCollectAndroidID 
`setCollectAndroidID(isCollect, callback)`

Opt-out of collection of Android ID.<br/>
If the app does NOT contain Google Play Services, Android ID is collected by the SDK.<br/>
However, apps with Google play services should avoid Android ID collection as this is in violation of the Google Play policy.<br/>

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| isCollect       | boolean  | opt-in boolean            |
| callback        | function | success callback          |


*Example:*

```javascript
if (Platform.OS == 'android') {
appsFlyer.setCollectAndroidID(true, (res) => {
   //...
});
}
```

---

### setCollectIMEI — removed in 7.0.0

Android IMEI-collection opt-out has no RPC equivalent and is **removed** with no adapter
(IMEI collection has also been phased out at the OS level on modern Android versions). See
[MIGRATION.md](../MIGRATION.md#setcollectimei--removed).

### setDisableNetworkData `setDisableNetworkData(isDisable)`

Use to opt-out of collecting the network operator name (carrier) and sim operator name from the device.

| parameter  | type     | description               |
| ---------- |----------|------------------         |
| isDisable  | boolean  | Defaults to false.        |


*Example:*
```javascript
if (Platform.OS == 'android') {
appsFlyer.setDisableNetworkData(true);
}
```

### performDeepLinking 
`performDeepLinking(url, shouldTriggerSession)`

Enables manual triggering of deep link resolution for a given URL. This method allows apps that are delaying the call to `appsFlyer.start()` to resolve deep links before the SDK starts.<br>
Note:<br>This API will trigger the `appsFlyer.registerDeepLinkListener` callback. In the following example, we check if `res.deepLinkStatus` is equal to “FOUND” inside `appsFlyer.registerDeepLinkListener` callback to extract the deeplink parameters.

| parameter            | type     | description               |
| ----------           |----------|------------------         |
| url                  | string   | the deep link URL to resolve |
| shouldTriggerSession  | boolean  | whether resolution should also start a session. Defaults to false. |

*Example:*
```javascript
// Let's say we want the resolve a deeplink and get the deeplink params when the user clicks on it but delay the actual 'start' of the sdk (not sending launch to appsflyer). 

const onDeepLink = appsFlyer.registerDeepLinkListener(res => {
  if (res.deepLinkStatus == 'FOUND') {
      // here we will get the deeplink params after resolving it.
      // more flow...
  }
});

appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start(); // <--- Here we send launch, only once the session is ready
});

appsFlyer.init('UsxXxXxed', '75xXxXxXxXx11');

if (Platform.OS == 'android') {
  appsFlyer.performDeepLinking(deepLinkUrl);
}

// more app flow...
```

### disableAppSetId 
`disableAppSetId()`

**Disable the collection of AppSet ID.**<br/>
**Must be called before calling start.**<br/>

*Example:*
```javascript
if (Platform.OS == 'android') {
  appsFlyer.disableAppSetId();
  appsFlyer.init('K2***********99', '41*****44');
}
```

---

### getHostName
`getHostName() : Promise<string>`

Returns the currently configured custom host name (see [setHost](#sethost)).

*Example:*

```javascript
if (Platform.OS == 'android') {
  const hostName = await appsFlyer.getHostName();
}
```

---

### getHostPrefix
`getHostPrefix() : Promise<string>`

Returns the currently configured custom host prefix (see [setHost](#sethost)).

*Example:*

```javascript
if (Platform.OS == 'android') {
  const hostPrefix = await appsFlyer.getHostPrefix();
}
```

---

### getOutOfStore
`getOutOfStore() : Promise<string>`

Returns the currently configured out-of-store source name.

*Example:*

```javascript
if (Platform.OS == 'android') {
  const outOfStore = await appsFlyer.getOutOfStore();
}
```

---

### setOutOfStore
`setOutOfStore(sourceName) : Promise<void>`

Report an out-of-store source (e.g. an alternative app store) for attribution.

| parameter  | type   | description                |
| ---------- |--------|-----------------------------|
| sourceName | string | the out-of-store source name |

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.setOutOfStore('my-app-store');
}
```

---

### getAttributionId
`getAttributionId() : Promise<string>`

Returns the Google Play install referrer attribution ID.

*Example:*

```javascript
if (Platform.OS == 'android') {
  const attributionId = await appsFlyer.getAttributionId();
}
```

---

### isStopped
`isStopped() : Promise<boolean>`

Returns whether the SDK is currently stopped (see [stop](#stop)).

*Example:*

```javascript
if (Platform.OS == 'android') {
  const stopped = await appsFlyer.isStopped();
}
```

---

### isPreInstalledApp
`isPreInstalledApp() : Promise<boolean>`

Returns whether the app was pre-installed on the device.

*Example:*

```javascript
if (Platform.OS == 'android') {
  const isPreInstalled = await appsFlyer.isPreInstalledApp();
}
```

---

### setLogLevel
`setLogLevel(logLevel) : Promise<void>`

Set the native SDK's log verbosity.

| parameter | type   | description                                                  |
| --------- |--------|----------------------------------------------------------------|
| logLevel  | string | one of the native SDK's log level names (e.g. `"NONE"`, `"DEBUG"`, `"VERBOSE"`) |

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.setLogLevel('DEBUG');
}
```

---

### setIsUpdate
`setIsUpdate(isUpdate) : Promise<void>`

Mark the current install as an update rather than a fresh install (testing aid).

| parameter | type    | description       |
| --------- |---------|-------------------|
| isUpdate  | boolean | true to mark as an update |

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.setIsUpdate(true);
}
```

---

### setAppId
`setAppId(appId) : Promise<void>`

Override the app ID reported to AppsFlyer (for apps whose package name differs from their store listing ID).

| parameter | type   | description |
| --------- |--------|-------------|
| appId     | string | the app ID  |

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.setAppId('com.example.app');
}
```

---

### setPreinstallAttribution
`setPreinstallAttribution(mediaSource, campaign, siteId) : Promise<void>`

Report pre-install attribution for apps bundled directly onto a device (OEM deals).

| parameter   | type   | description       |
| ----------- |--------|--------------------|
| mediaSource | string | the media source   |
| campaign    | string | the campaign name  |
| siteId      | string | the site ID        |

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.setPreinstallAttribution('mediaSource', 'campaign', 'siteId');
}
```

---

### logSession
`logSession() : Promise<void>`

Explicitly log a new session.

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.logSession();
}
```

---

## iOS Only APIs

### setDisableCollectASA 
`setDisableCollectASA(disable)`

Disables Apple Search Ads collecting

| parameter    | type     | description                                                |
| ------------ |----------|------------------                                          |
| disable      | boolean  | Flag to disable/enable Apple Search Ads data collection    |

*Example:*

```javascript
if (Platform.OS == 'ios') {
appsFlyer.setDisableCollectASA(true);
}
```

---

### setDisableIDFVCollection 
`setDisableIDFVCollection(disable)`

Disables app vendor identifier (IDFV) collection in iOS.<br>
Default is false (the SDK will collect IDFV).

| parameter    | type     | description                                                |
| ------------ |----------|------------------                                          |
| disable      | boolean  | Flag to disable/enable IDFV collection    |

*Example:*

```javascript
if (Platform.OS == 'ios') {
appsFlyer.setDisableIDFVCollection(true);
}
```

---

### setUseReceiptValidationSandbox 
`void setUseReceiptValidationSandbox(bool useReceiptValidationSandbox)`

In app purchase receipt validation Apple environment(production or sandbox). The default value is false.

| parameter                     | type      | description                                  |
| ----------------------------  |---------- |--------------------------------------------- |
| setUseReceiptValidationSandbox | boolean    | true if In app purchase is done with sandbox |

*Example:*

```javascript
appsFlyer.setUseReceiptValidationSandbox(true);
```

---

### setUseUninstallSandbox
`setUseUninstallSandbox(sandbox): void`

Use the sandbox endpoint for uninstall-token registration.

| parameter | type     | description                                    |
| --------- |----------|-------------------------------------------------|
| sandbox   | boolean  | true to use the sandbox uninstall-token endpoint |

*Example:*

```javascript
if (Platform.OS == 'ios') {
  appsFlyer.setUseUninstallSandbox(true);
}
```

---

### setDisableSKAdNetwork 
`setDisableSKAdNetwork(disable)`

❗Important❗ `setDisableSKAdNetwork` must be called before calling `initSDK` and for iOS ONLY!

| parameter | type     | description      |
| ----------|----------|------------------|
| disable   | boolean  | true if you want to disable SKADNetwork |


*Example:*

```javascript
if (Platform.OS == 'ios') {
    appsFlyer.setDisableSKAdNetwork(true);
}
```

---

### setCurrentDeviceLanguage 
`setCurrentDeviceLanguage(language)`

Set the language of the device. The data will be displayed in Raw Data Reports<br>
If you want to clear this property, set an empty string. ("")

| parameter | type     | description      |
| ----------|----------|------------------|
| language    | string   | language of the device |


*Example:*

```javascript
if (Platform.OS == 'ios') {
    appsFlyer.setCurrentDeviceLanguage("EN");
}
```

---

### setShouldCollectDeviceName
`setShouldCollectDeviceName(collect): void`

Enable or disable collection of the device's name.

| parameter | type     | description                          |
| --------- |----------|----------------------------------------|
| collect   | boolean  | true to enable device-name collection |

*Example:*

```javascript
if (Platform.OS == 'ios') {
  appsFlyer.setShouldCollectDeviceName(true);
}
```

---

### iOS AppDelegate lifecycle forwarding (native-only)

`handleOpenURL`/`handleOpenUrl`/`continueUserActivity`/`handleLaunchOptions` are **not**
JS APIs — call `AppsFlyerLib.shared()` directly from your app's native `AppDelegate`
instead. See [Deep Linking integration](/Docs/RN_DeepLinkIntegrate.md#ios-deeplink-setup)
for the exact code. Expo apps get the `openURL`/`continueUserActivity` forwarding
auto-injected by the config plugin at `expo prebuild` time — see
[Expo Deep Link Integration](/Docs/RN_ExpoDeepLinkIntegration.md).

---

### setFacebookDeferredAppLink
`setFacebookDeferredAppLink(options) : Promise<void>`

Explicitly resolve a Facebook deferred app link from the app's `open(url:options:)` payload.

| parameter | type   | description                                                       |
| --------- |--------|--------------------------------------------------------------------|
| options   | object | iOS open-URL options dictionary containing the Facebook app link data. Optional. |

*Example:*

```javascript
if (Platform.OS == 'ios') {
  appsFlyer.setFacebookDeferredAppLink(options);
}
```

## AppsFlyerConversionData

### registerConversionListener 
`registerConversionListener(onConversionDataSuccess, onConversionDataFail?) : function:unregister`

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking).<br/>

The code implementation for the conversion listener must be made prior to the initialization code of the SDK.


| parameter                | type     | description                               |
| ------------------------ |----------|------------------------------------------ |
| onConversionDataSuccess  | function | conversion data result                    |
| onConversionDataFail     | function | optional; failed conversion data result   |

*Example:*

```javascript
const removeConversionListener = appsFlyer.registerConversionListener(
  (res) => {
    if (JSON.parse(res.data.is_first_launch) == true) {
      if (res.data.af_status === 'Non-organic') {
        var media_source = res.data.media_source;
        var campaign = res.data.campaign;
        alert('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
      } else if (res.data.af_status === 'Organic') {
        alert('This is first launch and a Organic Install');
      }
    } else {
      alert('This is not first launch');
    }
  },
  (res) => {
    console.log(JSON.stringify(res, null, 2));
  }
);

appsFlyer.init(/*...*/);
```

*Example onConversionDataSuccess payload:*

```javascript
{
  "data": {
    "af_message": "organic install",
    "af_status": "Organic",
    "is_first_launch": "true"
  },
  "status": "success",
  "type": "onInstallConversionDataLoaded"
}
```

*Example onConversionDataFail payload:*

```javascript
{
  "status": "failure",
  "type": "onConversionDataFail",
  "data": "DevKey is incorrect"
}
```

 Note** is_first_launch will be "true" (string) on Android and true (boolean) on iOS. To solve this issue wrap is_first_launch with JSON.parse(res.data.is_first_launch) as in the example above.

`appsFlyer.registerConversionListener` returns a function that unregisters just this pair of callbacks (e.g. from `componentWillUnmount`). To also stop the underlying native listener, call `unregisterConversionListener()`.

---

### unregisterConversionListener
`unregisterConversionListener() : void`

Stop the native conversion listener and clear all registered callbacks.

*Example:*

```javascript
appsFlyer.unregisterConversionListener();
```

---

### onAppOpenAttribution / onAttributionFailure — removed in 7.0.0

Both are **removed**, along with `performOnAppAttribution`. Attribution data is now delivered
through `registerDeepLinkListener` instead (documented below), matching what `registerConversionListener`
already does for deferred deep links. See
[MIGRATION.md](../MIGRATION.md#onappopenattribution--onattributionfailure--performonappattribution--merged-into-ondeeplinking).

---

### registerDeepLinkListener
`registerDeepLinkListener(callback) : function:unregister`
 
 This API is related to DeepLinks. Please read more [here](https://dev.appsflyer.com/hc/docs/rn_deeplinkintegrate)

| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | UDL data error                    |

*Example:*

```javascript
const onDeepLinkCanceller = appsFlyer.registerDeepLinkListener(res => {
  if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const DLValue = res?.data.deep_link_value;
        const mediaSrc = res?.data.media_source;
        const param1 = res?.data.af_sub1;
        console.log(JSON.stringify(res?.data, null, 2));
      }
})

appsFlyer.init(/*...*/);
```

`appsFlyer.registerDeepLinkListener` returns a function that unregisters just this callback (e.g. from `componentWillUnmount`). To also stop the underlying native listener, call `unregisterForDeepLink()`.

---

### unregisterForDeepLink
`unregisterForDeepLink() : void`

Stop the native deep-link listener and clear all registered callbacks. Android only.

*Example:*

```javascript
if (Platform.OS == 'android') {
  appsFlyer.unregisterForDeepLink();
}
```

---

### registerSessionReadyListener
`registerSessionReadyListener(callback) : function:unregister`

Fires once the native SDK's session becomes ready to serve attribution/deep-link data. Net-new
in 7.0.0 — no 6.x equivalent. Must be registered synchronously, before `init()`'s promise
settles — see [Initialization Flow](#initialization-flow).

| parameter | type     | description                                  |
| --------- |----------|-----------------------------------------------|
| callback  | function | invoked with no arguments when the session becomes ready |

*Example:*

```javascript
appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start();
});
```

---

### isSessionReady
`isSessionReady() : Promise<boolean>`

Query whether the native SDK's session is ready to serve attribution/deep-link data. A
one-off Promise query for the current state — not a replacement for
[`registerSessionReadyListener`](#registersessionreadylistener). Net-new in 7.0.0 — no 6.x
equivalent.

*Example:*

```javascript
const ready = await appsFlyer.isSessionReady();
```

---

### unregisterSessionReadyListener
`unregisterSessionReadyListener()`

Remove a previously registered session-ready listener. Net-new in 7.0.0 — no 6.x equivalent.

*Example:*

```javascript
appsFlyer.unregisterSessionReadyListener();
```

---
