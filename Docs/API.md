# API

<img src="https://massets.appsflyer.com/wp-content/uploads/2018/06/20092440/static-ziv_1TP.png"  width="400" >

Te list of available methods for this plugin is described below.


| method name| params| description|
| ----------- |-----------------------------|--------------|
| [`initSdk`](#initSdk) | `(Object options, function success, function error)`  | SDK configuration|
| [`trackAppLaunch`](#trackAppLaunch) | `()`  | Tracking session|
| [`setCustomerUserId`](#setCustomerUserId) | `(String customerUserId, function callback)`  |  Cross-reference your own unique ID|
| [`stopTracking`](#stopTracking)| `(Boolean isStopTracking, function successCallback)` | Shut down all SDK tracking |
| [`setCollectIMEI`](#setCollectIMEI) | `(Boolean isCollect, function successCallback)`  | Collect IMEI for the SDK|
| [`setCollectAndroidID`](#setCollectAndroidID) | `(Boolean isCollect, function successCallback)`  | Collect Android Id for the SDK|
| [`trackEvent`](#trackEvent) | `(String eventName, Object eventValues, function successC, function errorC)` | Track rich in-app events |
| [`track-app-uninstalls`](#track-app-uninstalls) |  | Track app uninstalls|
| [`updateServerUninstallToken`](#updateServerUninstallToken) | `(String token, Callback callback)` | Pass Firebase device token for uninstall measurement on Android|
| [`senddeeplinkdata-android-only`](#senddeeplinkdata-android-only) | `(String url)`  | Report Deep Links for Re-Targeting Attribution (Android)|
| [`onInstallConversionData`](#onInstallConversionData) | `(function callback)`  | Conversion Data from the SDK |
| [`getAppsFlyerUID`](#getAppsFlyerUID) | `(String error, String appsFlyerUID)` | Get AppsFlyer’s proprietary Device ID |
| [`tracklocation`](#tracklocation) | `(float longitude, float latitute, error, function callback)` |Track location of the device |
| [`senddeeplinkdata-android-only`](#senddeeplinkdata-android-only) | `(fString url)` |Re-Targeting Attribution(Android) |
| [`setAdditionalData`](#setAdditionalData) | `(Object customDataMap, function callback)` | Integrate with external partner platforms |
| [`setUserEmails`](#setUserEmails) | `(Object options)` | report device's associated email addresses |
| [`setAppInviteOneLinkID`](#setAppInviteOneLinkID) | `(String OneLinkIDfunction, function callback` | Set AppsFlyer’s OneLink ID |
| [`generateInviteLink`](#generateInviteLink) | `(Object args, function success, function error)` | Invite new user from the app and track the new install |
| [`trackCrossPromotionImpression`](#trackCrossPromotionImpression) | `(String appId, String campaign)` | Track cross promotion impression |
| [`trackAndOpenStore`](#trackAndOpenStore) | `(String appId, String campaign, Object options)` | Launch the app store's app page (via Browser) | 
| [`setCurrencyCode`](#setCurrencyCode) | `(String currencyCode, function callback)` | set the Currency Code for purchases | |



The list of available methods for this plugin is described below.
##### <a id="initSdk">  **`appsFlyer.initSdk(options, callback): void`**

initializes the SDK.

| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `options`   | `Object`                    |   SDK configuration           |


**`options`**

| name       | type    | default | description            |
| -----------|---------|---------|------------------------|
| `devKey`   |`string` |         |   [Appsflyer Dev key](https://support.appsflyer.com/hc/en-us/articles/207032126-AppsFlyer-SDK-Integration-Android)    |
| `appId`    |`string` |        | [Apple Application ID](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS) (for iOS only) |
| `isDebug`  |`boolean`| `false` | debug mode (optional)|

*Example:*

```javascript
const options = {
devKey: "<AF_DEV_KEY>",
isDebug: true
};

if (Platform.OS === 'ios') {
options.appId = "123456789";
}

appsFlyer.initSdk(options,
(result) => {
console.log(result);
},
(error) => {
console.error(error);
}
)
```

*With Promise:*

```javascript
try {
     var result = await appsFlyer.initSdk(options);     
     } catch (error) {
    }
```

---

##### <a id="trackAppLaunch">  **`appsFlyer.trackAppLaunch(): void`**
Necessary for tracking sessions and deep link callbacks in iOS on background-to-foreground transitions.
Should be used with the relevant [AppState](https://facebook.github.io/react-native/docs/appstate.html)  logic.

*Example:*

```javascript
state = {
  appState: AppState.currentState
}

componentDidMount()
{
  AppState.addEventListener('change', this._handleAppStateChange);
}

componentWillUnmount()
{  
  AppState.removeEventListener('change', this._handleAppStateChange);
}

_handleAppStateChange = (nextAppState) =>{
  if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
    if (Platform.OS === 'ios') {
      appsFlyer.trackAppLaunch();
    }
  }
 
  this.setState({appState: nextAppState});
}
```
---

##### <a id="setCustomerUserId"> **`appsFlyer.setCustomerUserId(customerUserId, callback): void`**

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs.

**Note:** The ID must be set during the first launch of the app at the SDK initialization. The best practice is to call this API during the `deviceready` event, where possible.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `customerUserId`   | `String`                      | |

*Example:*

```javascript
const userId = "some_user_id";

appsFlyer.setCustomerUserId(userId,
(response) => {
//..
}
);
```

---

##### <a id="stopTracking"> **`appsFlyer.stopTracking = (isStopTracking, successCallback): void`**

The `stopTracking` API for opting out users as part of the GDPR compliance.

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `isStopTracking`   | `boolean`                      |opt-out of launch and track in-app-event |

*Example:*

```javascript
appsFlyer.stopTracking(true,
        (result) => {
           console.log("stopTracking ...");
         });
```

---

##### <a id="setCollectIMEI"> **`appsFlyer.setCollectIMEI = (isCollect, successCallback): void`**

By default, IMEI and Android ID are not collected by the SDK if the OS version is higher than KitKat (4.4) and the device contains Google Play Services (on SDK versions 4.8.8 and below the specific app needed GPS). 

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `isCollect`   | `boolean`                      |opt-out of collection of IMEI |

*Example:*

```javascript
appsFlyer.setCollectIMEI(false,
        (result) => {
           console.log("setCollectIMEI ...");
         });
```

---

##### <a id="setCollectAndroidID"> **`appsFlyer.setCollectAndroidID = (isCollect, successCallback): void`**

By default, IMEI and Android ID are not collected by the SDK if the OS version is higher than KitKat (4.4) and the device contains Google Play Services (on SDK versions 4.8.8 and below the specific app needed GPS). 

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `isCollect`   | `boolean`                      | opt-out of collection of Android ID|

*Example:*

```javascript
appsFlyer.setCollectAndroidID(false,
        (result) => {
           console.log("setCollectAndroidID ... ");
         });
```

---


##### <a id="trackEvent"> **`appsFlyer.trackEvent(eventName, eventValues, successC, errorC): void`**


- These in-app events help you track how loyal users discover your app, and attribute them to specific
campaigns/media-sources. Please take the time define the event/s you want to measure to allow you
to track ROI (Return on Investment) and LTV (Lifetime Value).
- The `trackEvent` method allows you to send in-app events to AppsFlyer analytics. This method allows you to add events dynamically by adding them directly to the application code.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `eventName` | `String`                    | custom event name, is presented in your dashboard.  See the Event list [HERE](https://github.com/AppsFlyerSDK/react-native-appsflyer/blob/master/ios/AppsFlyerTracker.h)  |
| `eventValues` | `Object`                    | event details (optional) |

*Example:*

```javascript
const eventName = "af_add_to_cart";
const eventValues = {
"af_content_id": "id123",
"af_currency":"USD",
"af_revenue": "2"
};

appsFlyer.trackEvent(eventName, eventValues,
(result) => {
console.log(result);
},
(error) => {
console.error(error);
}
)

```
*With Promise:*

```javascript
try {
     var result = await appsFlyer.trackEvent(eventName, eventValues);     
     } catch (error) {
    }
```


---




### <a id="track-app-uninstalls"> Uninstall Measurement

#### <a id="track-app-uninstalls-ios"> iOS

AppsFlyer enables you to track app uninstalls. To handle notifications it requires  to modify your `AppDelegate.m`. Use [didRegisterForRemoteNotificationsWithDeviceToken](https://developer.apple.com/reference/uikit/uiapplicationdelegate) to register to the uninstall feature.

*Example:*

```objective-c
@import AppsFlyerLib;

...

- (void)application:(UIApplication ​*)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *​)deviceToken {
// notify AppsFlyerTracker
[[AppsFlyerTracker sharedTracker] registerUninstall:deviceToken];
}
```

Read more about Uninstall register: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)


#### <a id="updateServerUninstallToken"> Android

`appsFlyer.updateServerUninstallToken(token, callback): void` (**Android only**)

Updates Firebase device token so it can be sent to AppsFlyer

| parameter     | type                        | description  |
| --------------|-----------------------------|--------------|
| `token`       | `String`                    |              |
| `callback`    | `(successString) => void`   |     Required at the moment, inject a string as parameter upon hook registration success.         |

*Example:*

```javascript

appsFlyer.updateServerUninstallToken(newFirebaseToken,
(success) => {
 //...
})

```

Read more about Android  Uninstall Tracking: [Appsflyer SDK support site](https://support.appsflyer.com/hc/en-us/articles/208004986-Android-Uninstall-Tracking)

---


#####  <a id="onInstallConversionData"> **`appsFlyer.onInstallConversionData(callback): function:unregister`**

Accessing AppsFlyer Attribution / Conversion Data from the SDK (Deferred Deeplinking).
Read more: [Android](http://support.appsflyer.com/entries/69796693-Accessing-AppsFlyer-Attribution-Conversion-Data-from-the-SDK-Deferred-Deep-linking-), [iOS](http://support.appsflyer.com/entries/22904293-Testing-AppsFlyer-iOS-SDK-Integration-Before-Submitting-to-the-App-Store-)


| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `callback`  | `function`                  |  returns [object](#callback-structure)            |


##### callback structure:

- `status`: `"success"`or `"failure"` if SDK returned error on `onInstallConversionData` event handler
- `type`:
- `"onAppOpenAttribution"`  - returns deep linking data (non-organic)
- `"onInstallConversionDataLoaded"` - called on each launch
- `"onAttributionFailure"`
- `"onInstallConversionFailure"`
- `data`: some metadata,

Example of `onInstallConversionDataLoaded`:
```
{
    "status": "success",
    "type": "onInstallConversionDataLoaded",
    "data": {
        "af_status": "Organic",
        "af_message": "organic install"
    }
}

```

Example of `onAppOpenAttribution`:
```
{
    "status": "success",
    "type": "onAppOpenAttribution",
    "data": {
        "af_sub1": "some custom data",
        "link": "https://rndemotest.onelink.me/7y5s/f78c46d5",
        "c": 'my campaign',
        "pid": "my media source" }
        }
}

```

The code implementation for the conversion listener must be made **prior to the initialization** code of the SDK

*Example:*

```javascript
this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
      data => {
        console.log(data);        
      }
    );

    this.onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution(
      data => {
        console.log(data);        
      }
    );


appsFlyer.initSdk(/*...*/);
//...
```

The `appsFlyer.onInstallConversionData` returns function to  unregister this event listener. Actually it calls `NativeAppEventEmitter.remove()`

*Example:*

```javascript
state = {
  appState: AppState.currentState
}

componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
}

componentWillUnmount() {
  AppState.removeEventListener('change', this._handleAppStateChange);
}

_handleAppStateChange = (nextAppState) => {
    
    if (this.state.appState.match(/active|foreground/) && nextAppState === 'background') {
         if(this.onInstallConversionDataCanceller){
           this.onInstallConversionDataCanceller();
           console.log("unregister onInstallConversionDataCanceller");
         } 
         if(this.onAppOpenAttributionCanceller){
           this.onAppOpenAttributionCanceller();
           console.log("unregister onAppOpenAttributionCanceller");
         }  
    }

    this.setState({appState: nextAppState});
  }
```

---

#####  <a id="getAppsFlyerUID"> **`appsFlyer.getAppsFlyerUID(callback): void`**


Get AppsFlyer’s proprietary Device ID. The AppsFlyer Device ID is the main ID used by AppsFlyer in Reports and APIs.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `error` | `String`                    | Error callback - called on `getAppsFlyerUID` failure |
| `appsFlyerUID` | `string`                    | The AppsFlyer Device ID |

*Example:*

```javascript
appsFlyer.getAppsFlyerUID((error, appsFlyerUID) => {
if (error) {
console.error(error);
} else {
console.log("on getAppsFlyerUID: " + appsFlyerUID);
}
});
```

---
##### <a id="trackLocation"> **`appsFlyer.trackLocation(longitude, latitude, callback(error, coords): void`** (**iOS only**)
Track the location (lat,long) of the device / user.


| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `longitude` | `float`                    |Longitude|
| `latitude` | `float`                    | Latitude |
|`callback`| `Object` |Success / Error Callbacks |

*Example:*

```javascript
const latitude = -18.406655;
const longitude = 46.406250;

appsFlyer.trackLocation(longitude, latitude, (error, coords) => {
if (error) {
console.error(error);
} else {
this.setState({ ...this.state, trackLocation: coords });
}
});
```

---

##### <a id="senddeeplinkdata-android-only"> **`appsFlyer.sendDeepLinkData(String url): void`** (**Android only**)

Report Deep Links for Re-Targeting Attribution (Android).
This method should be called when an app is opened using a deep link.

*Example:*
```javascript
componentDidMount() {
Linking.getInitialURL().then((url) => {
if (appsFlyer) {
appsFlyer.sendDeepLinkData(url); // Report Deep Link to AppsFlyer
// Additional Deep Link Logic Here ...
}
}).catch(err => console.error('An error occurred', err));
}
```

More about Deep Links in React-Native: [React-Native Linking](https://facebook.github.io/react-native/docs/linking.html)
More about Deep Links in Android: [Android Deep Linking , Adding Filters](https://developer.android.com/training/app-indexing/deep-linking.html#adding-filters)


---

##### <a id="setAdditionalData"> **`appsFlyer.setAdditionalData(customDataMap, callback): void`**

The `setAdditionalData` API is required to integrate on the SDK level with several external partner platforms, including Segment, Adobe and Urban Airship. Use this API only if the integration article of the platform specifically states setAdditionalData API is needed.


| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `customDataMap`   | `Object`                    |   `setUserEmails` configuration           


*Example:*

```javascript
appsFlyer.setAdditionalData(
    {
      val1: "data1",
      val2: false,
      val3: 23
    },
    (result) => {
       //... SUCCESS
    });

```

---

##### <a id="setUserEmails"> **`appsFlyer.setUserEmails(options, errorC, successC): void`**

AppsFlyer enables you to report one or more of the device’s associated email addresses. You must collect the email addresses and report it to AppsFlyer according to your required encryption method.
More info you can find on [AppsFlyer-SDK-Integration-Android](https://support.appsflyer.com/hc/en-us/articles/207032126-AppsFlyer-SDK-Integration-Android) and [AppsFlyer-SDK-Integration-iOS](https://support.appsflyer.com/hc/en-us/articles/207032066-AppsFlyer-SDK-Integration-iOS)


| parameter   | type                        | description  |
| ----------- |-----------------------------|--------------|
| `options`   | `Object`                    |   `setUserEmails` configuration           |


**`options`**

| name       | type    | default | description            |
| -----------|---------|---------|------------------------|
| `emailsCryptType`   |`int` |    0     |   NONE - `0` (default), SHA1 - `1`, MD5 - `2`    |
| `emails`    |`array` |        | comma separated list of emails |


*Example:*

```javascript
const options = {
"emailsCryptType": 2,
"emails": [
"user1@gmail.com",
"user2@gmail.com"
]
};

appsFlyer.setUserEmails(options,
(response) => {
this.setState({ ...this.state, setUserEmailsResponse: response });
},
(error) => {
console.error(error);
}
);

```
---

##### <a id="setAppInviteOneLinkID"> **`appsFlyer.setAppInviteOneLinkID(oneLinkID, successC): void`** 
Set AppsFlyer’s OneLink ID. Setting a valid OneLink ID will result in shortened User Invite links, when one is generated. The OneLink ID can be obtained on the AppsFlyer Dashboard.

*Example:*

```javascript

appsFlyer.setAppInviteOneLinkID("oneLinkID" , (success)=>{console.log(success)});

```

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `OneLinkID` | `String`                    | OneLink ID |
| `callback` | `function` | returns [object](#callback-structure) |

---
##### <a id="generateInviteLink"> **`appsFlyer.generateInviteLink(args, successC, errorC): void`** 
Allowing your existing users to invite their friends and contacts as new users to your app can be a key growth factor for your app. AppsFlyer allows you to track and attribute new installs originating from user invites within your app.

*Example:*

```javascript

var inviteOptions {
  channel: 'gmail',
  campaign: 'myCampaign',
  customerID: '1234',
  userParams {
    myParam: 'newUser',
    anotherParam: 'fromWeb',
    amount: 1
  }
};

var onInviteLinkSuccess = function(link) {
  console.log(link); // Handle Generated Link Here
}

function onInviteLinkError(err) {
  console.log(err);
}

appsFlyer.generateInviteLink(inviteOptions, onInviteLinkSuccess, onInviteLinkError);

```
| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `inviteOptions` | `Object`                    |Parameters for Invite link  |
| `onInviteLinkSuccess` | `() => void`                | Success callback (generated link) |
| `onInviteLinkError` | `() => void`                | Error callback |

A complete list of supported parameters is available <a href="https://support.appsflyer.com/hc/en-us/articles/115004480866-User-Invite-Tracking">here</a>.
Custom parameters can be passed using a `userParams{}` nested object, as in the example above.

---

##### <a id="trackCrossPromotionImpression"> **`appsFlyer.trackCrossPromotionImpression("appID", "campaign"): void`**  (Cross Promotion)

Use this call to track an impression use the following API call. Make sure to use the promoted App ID as it appears within the AppsFlyer dashboard.

*Example:*
```javascript
appsFlyer.trackCrossPromotionImpression("com.myandroid.app", "myCampaign");
```

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `appID` | `String`                    | Promoted Application ID |
| `campaign` | `String`                    | Promoted Campaign |

For more details about Cross-Promotion tracking please see <a href="https://support.appsflyer.com/hc/en-us/articles/115004481946-Cross-Promotion-Tracking">here</a>.

---

##### <a id="trackAndOpenStore"> **`appsFlyer.trackAndOpenStore("appID","campaign", options): void`**  (Cross Promotion)

Use this call to track the click and launch the app store's app page (via Browser)

*Example:*
```javascript
var crossPromOptions {
  customerID: '1234',
  myCustomParameter: 'newUser'
};

appsFlyer.trackAndOpenStore('com.myandroid.app', 'myCampaign', crossPromOptions);
```

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `appID` | `String`                    | Promoted Application ID |
| `campaign` | `String`                    | Promoted Campaign |
| `options` | `Object`                    | Additional Parameters to track |

For more details about Cross-Promotion tracking please see <a href="https://support.appsflyer.com/hc/en-us/articles/115004481946-Cross-Promotion-Tracking">here</a>.

---  

##### <a id="setCurrencyCode"> **`appsFlyer.setCurrencyCode(currencyCode, callback): void`** 

Setting user local currency code for in-app purchases.
The currency code should be a 3 character ISO 4217 code. (default is USD).
You can set the currency code for all events by calling this method.

*Example:*
```javascript
appsFlyer.setCurrencyCode(currencyCode, ()=>{});
```

| parameter   | type                        | description |
| ----------- |-----------------------------|--------------|
| `currencyCode` | `String`                 | currencyCode |

---  



