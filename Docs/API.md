# API

- [initSdk](#initSdk)
- [appId](#appId)
- [onInstallConversionData](#onInstallConversionData) 
- [onAppOpenAttribution](#onAppOpenAttribution) 
- [logEvent](#logEvent)
- [setCustomerUserId](#setCustomerUserId) 
- [getAppsFlyerUID](#getAppsFlyerUID) 
- [stop](#stop) 
- [logLocation](#logLocation) 
- [setUserEmails](#setUserEmails) 
- [setAdditionalData](#setAdditionalData)  
- [updateServerUninstallToken](#updateServerUninstallToken) 
- [setCollectIMEI](#setCollectIMEI) 
- [setCollectAndroidID](#setCollectAndroidID) 
- [setAppInviteOneLinkID](#setAppInviteOneLinkID) 
- [generateInviteLink](#generateInviteLink) 
- [logCrossPromotionImpression](#logCrossPromotionImpression) 
- [logCrossPromotionAndOpenStore](#logCrossPromotionAndOpenStore) 
- [setCurrencyCode](#setCurrencyCode) 
- [anonymizeUser](#anonymizeUser)
- [setOneLinkCustomDomains](#setOneLinkCustomDomains)
- [setResolveDeepLinkURLs](#setResolveDeepLinkURLs)
- [performOnAppAttribution](#performOnAppAttribution)
- [setSharingFilterForAllPartners](#setSharingFilterForAllPartners)
- [setSharingFilter](#setSharingFilter)
- [disableCollectASA](#disableCollectASA)
- [disableAdvertisingIdentifier](#disableAdvertisingIdentifier)
- [validateAndLogInAppPurchase](#validateAndLogInAppPurchase)
- [sendPushNotificationData](#sendPushNotificationData)
- [setHost](#setHost)
- [addPushNotificationDeepLinkPath](#addPushNotificationDeepLinkPath)
- [disableSKAD](#disableSKAD)

---

##### <a id="initSdk"> **`initSdk(options, success, error)`**

Initialize the AppsFlyer SDK with the devKey and appID.<br/>
The dev key is required for all apps and the appID is required only for iOS.<br/>
(you may pass the appID on Android as well, and it will be ignored)<br/>

| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| options      | json     | init options                              |
| success      | function | success callback                          |
| error        | function | error callback                          |


| Option  | Description   |
| -------- | ------------- |
| devKey   | Your application [devKey](https://support.appsflyer.com/hc/en-us/articles/211719806-Global-app-settings-#sdk-dev-key) provided by AppsFlyer (required)  |
| appId      | Your iTunes [application ID](https://support.appsflyer.com/hc/en-us/articles/207377436-Adding-a-new-app#available-in-the-app-store-google-play-store-windows-phone-store)  (iOS only)  |
| isDebug    | Debug mode - set to `true` for testing only  |
|onInstallConversionDataListener| Set listener for SDK init response (Optional. default=true) |
|onDeepLinkListener| Set listener for DDL response (Optional. default=false) |
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
  },
  (res) => {
    console.log(res);
  },
  (err) => {
    console.error(err);
  }
);
```

With Promise:
```javascript
try {
  var res = await appsFlyer.initSdk(options);
} catch (err) {}
```
---

##### <a id="appId"> **`appId`**

AppsFlyer app ID property populated from `options` passed in the `initSdk` function. Can be used to read appId back later in the app

*Example:*

```javascript
var appId = appsFlyer.appId;
```

---
##### <a id="onInstallConversionData"> **`onInstallConversionData(callback) : function:unregister`**

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking).<br/>

The code implementation for the conversion listener must be made prior to the initialization code of the SDK.


| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | conversion data result                    |

*Example:*

```javascript
this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
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
Therefore it is required to call the canceller method in the next [appStateChange](https://facebook.github.io/react-native/docs/appstate.html) callback. <br/>This is required for both the `onInstallConversionData` and `onAppOpenAttribution` callbacks.

*Example:*

```javascript
 _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/active|foreground/) && nextAppState === 'background') {
      if (this.onInstallConversionDataCanceller) {
        this.onInstallConversionDataCanceller();
        this.onInstallConversionDataCanceller = null;
      }
      if (this.onAppOpenAttributionCanceller) {
        this.onAppOpenAttributionCanceller();
        this.onAppOpenAttributionCanceller = null;
      }
    }
```



---

##### <a id="onAppOpenAttribution"> **`onAppOpenAttribution(callback) : function:unregister`**


| parameter    | type     | description                               |
| -----------  |----------|------------------------------------------ |
| callback     | function | deeplink data result                    |

*Example:*

```javascript
this.onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

appsFlyer.initSdk(/*...*/);
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

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs.


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

##### <a id="updateServerUninstallToken"> **`updateServerUninstallToken(token, callback)`**
  
(Android only)

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

##### <a id="setCollectIMEI"> **`setCollectIMEI(isCollect, callback)`**
  
❗(Android only)

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

---

##### <a id="setCollectAndroidID"> **`setCollectAndroidID(isCollect, callback)`**
  
❗(Android only)

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

##### <a id="logCrossPromotionImpression"> **`logCrossPromotionImpression(appId, campaign)`**

To attribute an impression use the following API call.<br/>
Make sure to use the promoted App ID as it appears within the AppsFlyer dashboard.

| parameter       | type      | description               |
| ----------      |---------- |------------------         |
| appId           | string    | promoted application ID   |
| campaign        | string    | Promoted Campaign         |
| params          | json     | additional parameters     |


*Example:*

```javascript
if (Platform.OS == 'ios') {
    appsFlyer.logCrossPromotionImpression('456789456', 'cross_promotion_and_store', {
            custom_param: 'just_an_impression',
        });
}else{
    appsFlyer.logCrossPromotionImpression('com.cool.RNApp', 'cross_promotion_and_store', {
            custom_param: 'just_an_impression',
        });
}
```

For more details about Cross-Promotion logging please see the relevent doc [here](https://support.appsflyer.com/hc/en-us/articles/115004481946-Cross-Promotion-Tracking).

---

##### <a id="logCrossPromotionAndOpenStore"> **`logCrossPromotionAndOpenStore(appId, campaign, params)`**

Use the following API to attribute the click and launch the app store's app page.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| appId           | string   | promoted application ID   |
| campaign        | string   | promoted campaign         |
| params          | json     | additional parameters     |


*Example:*

```javascript
let crossPromOptions = {
  customerID: '1234',
  myCustomParameter: 'newUser',
};
if(Platform.OS == 'ios'){
    appsFlyer.logCrossPromotionAndOpenStore('456789456', 'myCampaign', crossPromOptions);
}else {
    appsFlyer.logCrossPromotionAndOpenStore('com.cool.RNApp', 'myCampaign', crossPromOptions);
}

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

##### <a id="performOnAppAttribution"> **`performOnAppAttribution(url, callback)`**

This function allows developers to manually re-trigger onAppOpenAttribution with a specific link (URI or URL), **without recording a new re-engagement**.<br>
This method may be required if the app needs to redirect users based on the given link, or resolve the AppsFlyer short URL while staying in the foreground/opened. This might be needed because regular onAppOpenAttribution callback is only called if the app was opened with the deep link.

| parameter                   | type     | description                                                                                          |
| ----------                  |----------|------------------                                                                                    |
| url                         | string   | String representing the URL that needs to be resolved/returned in the onAppOpenAttribution callback  |
| success callback                    | function | Result callback                                                                                             |
| failure callback                    | function | error callback                                                                                             |


*Example:*

```javascript
appsFlyer.performOnAppAttribution(url, res => console.log(res) , err => console.error(err));
```
---
##### <a id="setSharingFilterForAllPartners"> **`setSharingFilterForAllPartners()`**

Used by advertisers to exclude **all** networks/integrated partners from getting data. Learn more [here](https://support.appsflyer.com/hc/en-us/articles/207032126#additional-apis-exclude-partners-from-getting-data)

*Example:*

```javascript
appsFlyer.setSharingFilterForAllPartners()
```
---
##### <a id="setSharingFilter"> **`setSharingFilter(partners, sucessC, errorC)`**

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

##### <a id="disableCollectASA"> **`disableCollectASA(shouldDisable)`**
  
❗(iOS only)

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

##### <a id="disableAdvertisingIdentifier"> **`disableAdvertisingIdentifier(shouldDisable)`**
  
❗(iOS only)

Disables IDFA collecting

| parameter                   | type     | description                                                |
| ----------                  |----------|------------------                                          |
| shouldDisable               | boolean  | Flag to disable/enable IDFA collection    |

*Example:*

```javascript
if (Platform.OS == 'ios') {
appsFlyer.disableAdvertisingIdentifier(true);
}
```

---

##### <a id="validateAndLogInAppPurchase"> **`validateAndLogInAppPurchase(purchaseInfo, successC, errorC): Response<string>`**
Receipt validation is a secure mechanism whereby the payment platform (e.g. Apple or Google) validates that an in-app purchase indeed occurred as reported.<br>
Learn more - https://support.appsflyer.com/hc/en-us/articles/207032106-Receipt-validation-for-in-app-purchases
❗Important❗ for iOS - set SandBox to ```true```<br>
```appsFlyer.setUseReceiptValidationSandbox(true);```


| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| purchaseInfo      | json     | In-App Purchase parameters      |
| successC         | function | success callback (generated link)|
| errorC           | function | error callback                   |


*Example:*

```javascript
let info = {};
if (Platform.OS == 'android') {
    info = {
        publicKey: 'key',
        currency: 'biz',
        signature: 'sig',
        purchaseData: 'data',
        price: '123',
        additionalParameters: {'foo': 'bar'},
    };
} else if (Platform.OS == 'ios') {
     info = {
         productIdentifier: 'identifier',
         currency: 'USD',
         transactionId: '1000000614252747',
         price: '0.99',
         additionalParameters: {'foo': 'bar'},
     };
}
appsFlyer.validateAndLogInAppPurchase(info, res => console.log(res), err => console.log(err));
```

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

##### <a id="addPushNotificationDeepLinkPath"> **`addPushNotificationDeepLinkPath(path, successC, errorC)`**
The addPushNotificationDeepLinkPath method provides app owners with a flexible interface for configuring how deep links are extracted from push notification payloads.
for more information: https://support.appsflyer.com/hc/en-us/articles/207032126-Android-SDK-integration-for-developers#core-apis-65-configure-push-notification-deep-link-resolution <br>
❗Important❗ `addPushNotificationDeepLinkPath` must be called before calling `initSDK`

| parameter | type     | description      |
| ----------|----------|------------------|
| path    | strings array   | the desired path separated into an array |
| successC  | function | success callback |
| errorC  | function | error callback |


*Example:*

```javascript
appsFlyer.addPushNotificationDeepLinkPath(["deeply", "nested", "deep_link"], res => console.log(res), error => console.log(error));
```

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
