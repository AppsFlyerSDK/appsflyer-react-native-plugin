# 📑 API
<img src="https://massets.appsflyer.com/wp-content/uploads/2018/06/20092440/static-ziv_1TP.png"  width="400" >

The list of available methods for this plugin is described below.
- [Android & iOS APIs](#allAPI)
    - [initSDK](#initSDK)
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
- [Android Only APIs](#androidOnly)
    - [setCollectAndroidID](#setCollectAndroidID)
    - [setCollectIMEI](#setCollectIMEI)
- [iOS Only APIs](#iOSOnly)
    - [disableCollectASA](#disableCollectASA)
    - [setUseReceiptValidationSandbox](#setUseReceiptValidationSandbox)
    - [disableSKAD](#disableSKAD)
    - [setCurrentDeviceLanguage](#setCurrentDeviceLanguage)
- [AppsFlyerConversionData](#AppsFlyerConversionData)
    - [onInstallConversionData](#onInstallConversionData)
    - [onInstallConversionFailure](#onInstallConversionFailure)
    - [onAppOpenAttribution](#onAppOpenAttribution)
    - [onAttributionFailure](#onAttributionFailure)
- [AppsFlyerUserInvite](#AppsFlyerUserInvite)
    - [onInviteLinkGenerated](#onInviteLinkGenerated)
    - [onInviteLinkGeneratedFailure](#onInviteLinkGeneratedFailure)
    - [onOpenStoreLinkGenerated](#onOpenStoreLinkGenerated)
- [AppsFlyerValidateReceipt](IAppsFlyerValidateReceipt)
    - [didFinishValidateReceipt](#didFinishValidateReceipt)
    - [didFinishValidateReceiptWithError](#didFinishValidateReceiptWithError)
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
    timeToWaitForATTUserAuthorization: 10 //for iOS 14.5
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

##### <a id="logEvent"> **`logEvent(eventName, eventValues, success, error)`**

In-App Events provide insight on what is happening in your app. It is recommended to take the time and define the events you want to measure to allow you to measure ROI (Return on Investment) and LTV (Lifetime Value).

Recording in-app events is performed by calling sendEvent with event name and value parameters. See In-App Events documentation for more details.

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

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs. NOTE: This must be set before `initSdk` is called.


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

Set the user emails and encrypt them.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| configuration   | json     | email configuration       |
| success         | function | success callback          |
| error           | function | error callback             |


| option          | type  | description   |
| --------------  | ----  |------------- |
| emailsCryptType | int   | none - 0 (default), SHA1 - 1, MD5 - 2, SHA256 - 3 |
| emails          | array | comma separated list of emails |


*Example:*

```javascript
const options = {
  emailsCryptType: 2,
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
if (Platform.OS == 'android') {
    
} else if (Platform.OS == 'ios') {
     info = {
         
     };
}
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

##### <a id="sendPushNotificationData"> **`sendPushNotificationData(pushPayload): void`**
Push-notification campaigns are used to create fast re-engagements with existing users.
AppsFlyer supplies an open-for-all solution, that enables measuring the success of push-notification campaigns, for both iOS and Android platforms.<br>
Learn more - https://support.appsflyer.com/hc/en-us/articles/207364076-Measuring-Push-Notification-Re-Engagement-Campaigns

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| pushPayload      | json     | push notification payload      |


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
        appsFlyer.sendPushNotificationData(pushPayload);
```

## <a id="androidOnly"> Android Only APIs
---

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

## <a id="iOSOnly"> iOS Only APIs
---

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
---