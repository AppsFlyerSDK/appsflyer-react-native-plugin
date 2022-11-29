# 📑 APIs
<img src="https://massets.appsflyer.com/wp-content/uploads/2018/06/20092440/static-ziv_1TP.png"  width="400" >

The list of available methods for this plugin is described below.
- [Android & iOS APIs](#allAPI)
    - [initSDK](#initSDK)
    - [startSdk](#startSdk)
    - [logEvent](#logEvent)
    - [setCustomerUserId](#setCustomerUserId)
    - [stop](#stop)
    - [setAppInviteOneLinkID](#setAppInviteOneLinkID)
    - [setAdditionalData](#setAdditionalData)
    - [setResolveDeepLinkURLs](#setResolveDeepLinkURLs)
    - [setOneLinkCustomDomain](#setOneLinkCustomDomain)
    - [setCurrencyCode](#setCurrencyCode)
    - [logLocation](#logLocation)
    - [anonymizeUser](#anonymizeUser)
    - [getAppsFlyerUID](#getAppsFlyerUID)
    - [setHost](#setHost)
    - [setUserEmails](#setUserEmails)
    - [generateInviteLink](#generateInviteLink)
    - [setSharingFilterForAllPartners](#setSharingFilterForAllPartners)[Deprecated]
    - [setSharingFilter](#setSharingFilter)[Deprecated]
    - [setSharingFilterForPartners](#setSharingFilterForPartners)
    - [validateAndLogInAppPurchase](#validateAndLogInAppPurchase)
    - [updateServerUninstallToken](#updateServerUninstallToken)
    - [sendPushNotificationData](#sendPushNotificationData)
    - [addPushNotificationDeepLinkPath](#addPushNotificationDeepLinkPath)
    - [appendParametersToDeepLinkingURL](#appendParametersToDeepLinkingURL)
- [Android Only APIs](#androidOnly)
    - [setCollectAndroidID](#setCollectAndroidID)
    - [setCollectIMEI](#setCollectIMEI)
    - [setDisableNetworkData](#setDisableNetworkData)
    - [performOnDeepLinking](#performOnDeepLinking)
- [iOS Only APIs](#iOSOnly)
    - [disableCollectASA](#disableCollectASA)
    - [setUseReceiptValidationSandbox](#setUseReceiptValidationSandbox)
    - [disableSKAD](#disableSKAD)
    - [setCurrentDeviceLanguage](#setCurrentDeviceLanguage)
    - [disableIDFVCollection](#disableIDFVCollection)
- [AppsFlyerConversionData](#AppsFlyerConversionData)
    - [onInstallConversionData](#onInstallConversionData)
    - [onInstallConversionFailure](#onInstallConversionFailure)
    - [onAppOpenAttribution](#onAppOpenAttribution)
    - [onAttributionFailure](#onAttributionFailure)
    - [onDeepLink](#onDeepLink)
---

##### <a id="initSDK"> **`initSdk(options, success, error)`**

Initialize the AppsFlyer SDK with the devKey and appID.<br/>
The dev key is required for all apps and the appID is required only for iOS.<br/>
(you may pass the appID on Android as well, and it will be ignored)<br/>

| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| options      | json     | init options                              |
| success      | function | success callback                          |
| error        | function | error callback                          |


| Setting  | Description   |
| -------- | ------------- |
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/207032066-Basic-SDK-integration-guide#retrieving-the-dev-key) provided by AppsFlyer (required)  |
| appId      | [App ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store)  (iOS only) you configured in your AppsFlyer dashboard  |
| isDebug    | Debug mode - set to `true` for testing only  |
|onInstallConversionDataListener| Set listener for [GCD](https://dev.appsflyer.com/hc/docs/conversion-data) response (Optional. default=true) |
|onDeepLinkListener| Set listener for [UDL](https://dev.appsflyer.com/hc/docs/unified-deep-linking-udl) response (Optional. default=false) |
|timeToWaitForATTUserAuthorization| Waits for request user authorization to access app-related data. please read more [Here](https://dev.appsflyer.com/hc/docs/ios-sdk-reference-appsflyerlib#waitforattuserauthorization) |
|manualStart| Prevents from the SDK from sending the launch request after using appsFlyer.initSdk(...). When using this property, the apps needs to manually trigger the appsFlyer.startSdk() API to report the app launch. read more [here](#startSdk). (Optional, default=false) |
*Example:*

```javascript
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: false, //Optional
    onDeepLinkListener: true, //Optional
    timeToWaitForATTUserAuthorization: 10, //for iOS 14.5
    manualStart: true, //Optional
  },
  (res) => {
    console.log(res);
  },
  (err) => {
    console.error(err);
  }
);
```

---

##### <a id="startSdk"> **`startSdk()`**

In version 6.9.1 of the react-native-appslfyer SDK we added the option of splitting between the initialization stage and start stage. All you need to do is add the property manualStart: true to the init object, and later call appsFlyer.startSdk() whenever you decide. If this property is set to false or doesn’t exist, the sdk will start after calling `appsFlyer.initSdk(...)`.

*Example:*
```javascript
const option = {
  isDebug: true,
  devKey: 'UsxXxXxed',
  appId: '75xXxXxXxXx11',
  onInstallConversionDataListener: true,
  onDeepLinkListener: true,
  timeToWaitForATTUserAuthorization: 5,
  manualStart: true, // <--- for manual start.
};

appsFlyer.initSdk(
  option,
  () => {
    if (!option.manualStart) {
      console.warn('AppsFlyer SDK started!');
    } else {
      console.warn('AppsFlyer SDK init, didn\'t send launch yet');
      }
    },
      err => {
        // handle error
      },
    );
    //...
    // app flow
    //...

  appsFlyer.startSdk(); // <--- Here we send launch
```
---

##### <a id="logEvent"> **`logEvent(eventName, eventValues, success, error)`**

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

---

##### <a id="setCustomerUserId"> **`setCustomerUserId(userId, callback)`**

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

##### <a id="stop"> **`stop(isStopped, callback)`**

In some extreme cases you might want to shut down all SDK functions due to legal and privacy compliance. This can be achieved with the stopSDK API. Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.

There are several different scenarios for user opt-out. We highly recommend following the exact instructions for the scenario, that is relevant for your app.

In any event, the SDK can be reactivated by calling the same API, by passing false.

| parameter       | type     | description                                          |
| ----------      |----------|------------------                                    |
| isStopped  | boolean  | True if the SDK is stopped (default value is false). |
| callback        | function | success callback                                     |


*Example:*

```javascript
appsFlyer.stop(true, (res) => {
  //...
});
```

---

##### <a id="setAppInviteOneLinkID"> **`setAppInviteOneLinkID(oneLinkID, callback)`**

Set the OneLink ID that should be used for User-Invite-API.<br/>
The link that is generated for the user invite will use this OneLink ID as the base link ID.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| oneLinkID       | string   | oneLinkID                 |
| callback        | function | success callback          |


*Example:*

```javascript
appsFlyer.setAppInviteOneLinkID('abcd', (res) => {
  //...
});
```

---

##### <a id="setAdditionalData"> **`setAdditionalData(additionalData, callback)`**

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

##### <a id="setResolveDeepLinkURLs"> **`setResolveDeepLinkURLs(urls, successC, errorC)`**

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

##### <a id="setOneLinkCustomDomains"> **`setOneLinkCustomDomains(domains, successC, errorC)`**

 Set Onelink custom/branded domains<br/>
 Use this API during the SDK Initialization to indicate branded domains.<br/>
 For more information please refer to the [documentation](https://support.appsflyer.com/hc/en-us/articles/360002329137-Implementing-Branded-Links)

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| domains                     | array    | Comma separated array of branded domains                   |
| successC                    | function | success callback                                           |
| errorC                      | function | error callback                                             |


*Example:*

```javascript
appsFlyer.setOneLinkCustomDomains(["click.mybrand.com"],
    (res) => {
        console.log(res);
    }, (error) => {
        console.log(error);
    });
```

---

##### <a id="setCurrencyCode"> **`setCurrencyCode(currencyCode, callback)`**

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

##### <a id="logLocation"> **`logLocation(longitude, latitude, callback)`**

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

##### <a id="anonymizeUser"> **`anonymizeUser(shouldAnonymize, callback)`**

It is possible to anonymize specific user identifiers within AppsFlyer analytics.<br/>
This complies with both the latest privacy requirements (GDPR, COPPA) and Facebook's data and privacy policies.<br/>
To anonymize an app user:<br/>

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| shouldAnonymize             | boolean  | True if want Anonymize user Data (default value is false). |
| callback                    | function | success callback                                           |


*Example:*

```javascript
appsFlyer.anonymizeUser(true, () => {});
```

---

##### <a id="getAppsFlyerUID"> **`getAppsFlyerUID(callback)`**

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

##### <a id="setHost"> **`setHost(hostPrefix, hostName, successC)`**

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

##### <a id="setUserEmails"> **`setUserEmails(options, success, error)`**

Set the user emails and encrypt them.<br>
**Note:** Android platform supports only 0 (none) and 3 (SHA256) emailsCryptType. iOS platform support all (0-3) emailsCryptType.<br>
When unsupported emailsCryptType is passed, the SDK will use the default (none).

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| configuration   | json     | email configuration       |
| success         | function | success callback          |
| error           | function | error callback             |


| option          | type  | description   |
| --------------  | ----  |------------- |
| emailsCryptType | int   | **iOS**: none - 0 (default), SHA1 - 1, MD5 - 2, SHA256 - 3<br>**Android**: none - 0 (default), SHA256 - 3|
| emails          | array | comma separated list of emails |


*Example:*

```javascript
const options = {
  // In this case iOS platform will encrypt emails usind MD5 and android with SHA256. If you want both platform to encrypt with the same method, just write 0 or 3.
  emailsCryptType: Platform.OS === 'ios' ? 2 : 3, 
  emails: ['user1@gmail.com', 'user2@gmail.com'],
};

appsFlyer.setUserEmails(
  options,
  (res) => {
    //...
  },
  (err) => {
    console.error(err);
  }
);
```

---

##### <a id="generateInviteLink"> **`generateInviteLink(parameters, success, error)`**


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

---

##### <a id="setSharingFilterForAllPartners"> **`setSharingFilterForAllPartners()`**
##### Deprecated! Start from version 6.4.0 please use [setSharingFilterForPartners](#setSharingFilterForPartners)
Used by advertisers to exclude **all** networks/integrated partners from getting data. Learn more [here](https://support.appsflyer.com/hc/en-us/articles/207032126#additional-apis-exclude-partners-from-getting-data)

*Example:*

```javascript
appsFlyer.setSharingFilterForAllPartners()
```
---

##### <a id="setSharingFilter"> **`setSharingFilter(partners, sucessC, errorC)`**
##### Deprecated! Start from version 6.4.0 please use [setSharingFilterForPartners](#setSharingFilterForPartners)
Used by advertisers to exclude **specified** networks/integrated partners from getting data. Learn more [here](https://support.appsflyer.com/hc/en-us/articles/207032126#additional-apis-exclude-partners-from-getting-data)

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| partners                    | array    | Comma separated array of partners that need to be excluded |
| successC                    | function | success callback                                           |
| errorC                      | function | error callback                                             |
*Example:*

```javascript
let partners = ["facebook_int","googleadwords_int","snapchat_int","doubleclick_int"]
appsFlyer.setSharingFilterForAllPartners(partners,
        (res) => {
            console.log(res);
        }, (error) => {
            console.log(error);
        })
```
---

##### <a id="setSharingFilterForPartners"> **`setSharingFilterForPartners(partners)`**

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

##### <a id="validateAndLogInAppPurchase"> **`validateAndLogInAppPurchase(purchaseInfo, successC, errorC): Response<string>`**
Receipt validation is a secure mechanism whereby the payment platform (e.g. Apple or Google) validates that an in-app purchase indeed occurred as reported.<br>
Learn more - https://support.appsflyer.com/hc/en-us/articles/207032106-Receipt-validation-for-in-app-purchases<br>
❗Important❗ for iOS - set SandBox to ```true```<br>
```appsFlyer.setUseReceiptValidationSandbox(true);```


| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| purchaseInfo      | json     | In-App Purchase parameters      |
| successC         | function | success callback (generated link)|
| errorC           | function | error callback                   |


*Example:*

```javascript
let info = {
        publicKey: 'key',
        currency: 'biz',
        signature: 'sig',
        purchaseData: 'data',
        price: '123',
        productIdentifier: 'identifier',
        currency: 'USD',
        transactionId: '1000000614252747',
        additionalParameters: {'foo': 'bar'},
    };

appsFlyer.validateAndLogInAppPurchase(info, res => console.log(res), err => console.log(err));
```

---

##### <a id="updateServerUninstallToken"> **`updateServerUninstallToken(token, callback)`**

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

##### <a id="sendPushNotificationData"> **`sendPushNotificationData(pushPayload, ErrorCB): void`**
Push-notification campaigns are used to create fast re-engagements with existing users.<br>
[Learn more](https://support.appsflyer.com/hc/en-us/articles/207364076-Measuring-Push-Notification-Re-Engagement-Campaigns)<br>
For Android platform, AppsFlyer SDK uses the activity in order to process the push payload. Make sure you call this api when the app's activity is available (NOT dead state).<br>
From version ***6.6.0*** we added an error callback that returns an error message.<br>

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| pushPayload      | json     | push notification payload      |
| ErrorCB      | function     | returns an error msg when the payload has not been sent      |


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
        appsFlyer.sendPushNotificationData(pushPayload, err => console.log(err));
```

---
##### <a id="addPushNotificationDeepLinkPath"> **`addPushNotificationDeepLinkPath(path, SuccessCB, ErrorCB): void`**

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
##### <a id="appendParametersToDeepLinkingURL"> **`appendParametersToDeepLinkingURL(contains, parameters): void`**

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

## <a id="androidOnly"> Android Only APIs

##### <a id="setCollectAndroidID"> **`setCollectAndroidID(isCollect, callback)`**

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

##### <a id="setCollectIMEI"> **`setCollectIMEI(isCollect, callback)`**

Opt-out of collection of IMEI.<br/>
If the app does NOT contain Google Play Services, device IMEI is collected by the SDK.<br/>
However, apps with Google play services should avoid IMEI collection as this is in violation of the Google Play policy.<br/>

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| isCollect       | boolean  | opt-in boolean            |
| callback        | function | success callback          |


*Example:*

```javascript
if (Platform.OS == 'android') {
appsFlyer.setCollectIMEI(false, (res) => {
   //...
});
}
```

##### <a id="setDisableNetworkData"> **`setDisableNetworkData(disable)`**

Use to opt-out of collecting the network operator name (carrier) and sim operator name from the device.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| disable         | boolean  | Defaults to false.        |


*Example:*
```javascript
if (Platform.OS == 'android') {
appsFlyer.setDisableNetworkData(true);
}
```

##### <a id="performOnDeepLinking"> **`performOnDeepLinking()`**

Enables manual triggering of deep link resolution. This method allows apps that are delaying the call to `appsFlyer.startSdk()` to resolve deep links before the SDK starts.<br>
Note:<br>This API will trigger the `appsFlyer.onDeepLink` callback. In the following example, we check if `res.deepLinkStatus` is equal to “FOUND” inside `appsFlyer.onDeepLink` callback to extract the deeplink parameters.

*Example:*
```javascript
// Let's say we want the resolve a deeplink and get the deeplink params when the user clicks on it but delay the actual 'start' of the sdk (not sending launch to appsflyer). 

const option = {
  isDebug: true,
  devKey: 'UsxXxXxed',
  appId: '75xXxXxXxXx11',
  onInstallConversionDataListener: true,
  onDeepLinkListener: true,
  manualStart: true, // <--- for manual start.
};

const onDeepLink = appsFlyer.onDeepLink(res => {
  if (res.deepLinkStatus == 'FOUND') {
      // here we will get the deeplink params after resolving it.
      // more flow...
  }
});

appsFlyer.initSdk(
  option,
  () => {
    if (!option.manualStart) {
      console.warn('AppsFlyer SDK started!');
    } else {
      console.warn('AppsFlyer SDK init, didn\'t send launch yet');
      }
    },
  () => {},
);

if (Platform.OS == 'android') {
  appsFlyer.performOnDeepLinking();
}

// more app flow...

appsFlyer.startSdk(); // <--- Here we send launch
```
## <a id="iOSOnly"> iOS Only APIs

##### <a id="disableCollectASA"> **`disableCollectASA(shouldDisable)`**

Disables Apple Search Ads collecting

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| shouldDisable               | boolean  | Flag to disable/enable Apple Search Ads data collection    |

*Example:*

```javascript
if (Platform.OS == 'ios') {
appsFlyer.disableCollectASA(true);
}
```

---

##### <a id="disableIDFVCollection"> **`disableIDFVCollection(shouldDisable)`**

Disables app vendor identifier (IDFV) collection in iOS.<br>
Default is false (the SDK will collect IDFV).

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| shouldDisable               | boolean  | Flag to disable/enable IDFV collection    |

*Example:*

```javascript
if (Platform.OS == 'ios') {
appsFlyer.disableIDFVCollection(true);
}
```

---

##### <a id="setUseReceiptValidationSandbox"> **`void setUseReceiptValidationSandbox(bool useReceiptValidationSandbox)`**
 

In app purchase receipt validation Apple environment(production or sandbox). The default value is false.

| parameter                     | type      | description                                  |
| ----------------------------  |---------- |--------------------------------------------- |
| setUseReceiptValidationSandbox | boolean    | true if In app purchase is done with sandbox |

*Example:*

```javascript
appsFlyer.setUseReceiptValidationSandbox(true);
```

---

##### <a id="disableSKAD"> **`disableSKAD(disableSkad)`**

❗Important❗ `disableSKAD` must be called before calling `initSDK` and for iOS ONLY!

| parameter | type     | description      |
| ----------|----------|------------------|
| disableSkad    | boolean   | true if you want to disable SKADNetwork |


*Example:*

```javascript
if (Platform.OS == 'ios') {
    appsFlyer.disableSKAD(true);
}
```

---

##### <a id="setCurrentDeviceLanguage"> **`setCurrentDeviceLanguage(language)`**

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

## <a id="AppsFlyerConversionData"> AppsFlyerConversionData
##### <a id="onInstallConversionData"> **`onInstallConversionData(callback) : function:unregister`**

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking).<br/>

The code implementation for the conversion listener must be made prior to the initialization code of the SDK.


| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | conversion data result                    |

*Example:*

```javascript
const onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
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
  }
);

appsFlyer.initSdk(/*...*/);
```

*Example onInstallConversionData:*

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

> **Note** is_first_launch will be "true" (string) on Android and true (boolean) on iOS. To solve this issue wrap is_first_launch with JSON.parse(res.data.is_first_launch) as in the example above.

`appsFlyer.onInstallConversionData` returns a function the will allow us to call `NativeAppEventEmitter.remove()`.<br/>

---

##### <a id="onInstallConversionFailure"> **`onInstallConversionFailure(callback) : function:unregister`**
 

| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | Failed conversion data result                    |


*Example:*

```javascript
    const onInstallGCDFailure = appsFlyer.onInstallConversionFailure(res => {
      console.log(JSON.stringify(res, null, 2));
    });
```
*Example onInstallConversionFailure:*

```javascript
{
  "status": "failure",
  "type": "onInstallConversionFailure",
  "data": "DevKey is incorrect"
}
```
---

##### <a id="onAppOpenAttribution"> **`onAppOpenAttribution(callback) : function:unregister`**

This API is related to DeepLinks. Please read more [here](./DeepLink.md)
 
| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | onAppOpenAttribution data result                    |

*Example:*

```javascript
const onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

appsFlyer.initSdk(/*...*/);
```

---

##### <a id="onAttributionFailure"> **`onAttributionFailure(callback) : function:unregister`**

This API is related to DeepLinks. Please read more [here](./DeepLink.md)
 
| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | onAppOpenAttribution data error                    |

*Example:*

```javascript
const onAppOpenAttributionCanceller = appsFlyer.onAttributionFailure((res) => {
  console.log(res);
});

appsFlyer.initSdk(/*...*/);
```

---

##### <a id="onDeepLink"> **`onDeepLink(callback) : function:unregister`**
 
 This API is related to DeepLinks. Please read more [here](./DeepLink.md)

| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | UDL data error                    |

*Example:*

```javascript
const onDeepLinkCanceller = appsFlyer.onDeepLink(res => {
  if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const DLValue = res?.data.deep_link_value;
        const mediaSrc = res?.data.media_source;
        const param1 = res?.data.af_sub1;
        console.log(JSON.stringify(res?.data, null, 2));
      }
})

appsFlyer.initSdk(/*...*/);
```

---
