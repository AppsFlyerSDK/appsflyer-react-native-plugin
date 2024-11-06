# React Native Purchase Connector
**At a glance:** Automatically validate and measure revenue from in-app purchases and auto-renewable subscriptions to get the full picture of your customers' life cycles and accurate ROAS measurements.
For more information please check the following pages:
*  [ROI360 in-app purchase (IAP) and subscription revenue measurement](https://support.appsflyer.com/hc/en-us/articles/7459048170769-ROI360-in-app-purchase-IAP-and-subscription-revenue-measurement?query=purchase)
* [Android Purchase Connector](https://dev.appsflyer.com/hc/docs/purchase-connector-android)
* [iOS Purchase Connector](https://dev.appsflyer.com/hc/docs/purchase-connector-ios)

🛠 You can contact AppsFlyer support through the Customer Assistant Chatbot for assistance with troubleshooting issues or product guidance. To do so, please follow this article: https://support.appsflyer.com/hc/en-us/articles/23583984402193-Using-the-Customer-Assistant-Chatbot.

> *When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

## Table Of Content
* [Important Note](#important-note)
* [Adding The Connector To Your Project](#adding-the-connector-to-your-project)
  - [How to Opt-In](#how-to-opt-in)
  - [What Happens if You Use PurchaseConnector Files Without Opting In?](#important-callout-what-happens-if-you-use-the-purchase-connector-files-without-opting-in)
* [Basic Integration Of The Connector](#basic-integration-of-the-connector)
  - [Create PurchaseConnector Instance](#create-purchaseconnector-instance)
  - [Start Observing Transactions](#start-observing-transactions)
  - [Stop Observing Transactions](#stop-observing-transactions)
  - [Log Subscriptions](#log-subscriptions)
  - [Log In App Purchases](#log-in-app-purchases)
* [Register Validation Results Listeners](#register-validation-results-listeners)
  - [Cross-Platform Considerations](#cross-platform-considerations)
  - [Android Callback Types](#android-callback-types)
  - [Android - Subscription and In Apps Validation Result Listener](#android---subscription-and-inapps-validation-result-listener)
  - [iOS Combined Validation Result Listener](#ios-combined-validation-result-listener)
* [Testing the Integration](#testing-the-integration)
  - [Android](#android)
  - [iOS](#ios)
* [ProGuard Rules for Android](#proguard-rules-for-android)
* [Full Code Example](#full-code-example)

## <a id="important-note"></a>Important Note ⚠️ ⚠️

The Purchase Connector feature of the AppsFlyer SDK depends on specific libraries provided by Google and Apple for managing in-app purchases:

-   For Android, it depends on the  [Google Play Billing Library](https://developer.android.com/google/play/billing/integrate) (Supported versions: 5.x.x - 6.x.x).
-   For iOS, it depends on  [StoreKit](https://developer.apple.com/documentation/storekit).

However, these dependencies aren't actively included with the SDK. This means that the responsibility of managing these dependencies and including the necessary libraries in your project falls on you as the consumer of the SDK.

If you're implementing in-app purchases in your app, you'll need to ensure that the Google Play Billing Library (for Android) or StoreKit (for iOS) are included in your project. You can include these libraries manually in your native code, or you can use a third-party React Native plugin, such as the  [`react-native-iap`](https://www.npmjs.com/package/react-native-iap) plugin.

Remember to appropriately manage these dependencies when implementing the Purchase Validation feature in your app. Failing to include the necessary libraries might result in failures when attempting to conduct in-app purchases or validate purchases.

## <a id="adding-the-connector-to-your-project"></a>Adding The Connector To Your Project

The Purchase Connector feature in AppsFlyer SDK React Native Plugin is an optional enhancement that you can choose to use based on your requirements. This feature is not included by default and you'll have to opt-in if you wish to use it.

### <a id="how-to-opt-in"></a>How to Opt-In

To opt-in and include this feature in your app, you need to set specific properties based on your platform:

For **iOS**, in your Podfile located within the `iOS` folder of your React Native project, set `$AppsFlyerPurchaseConnector` to `true`.
```ruby
$AppsFlyerPurchaseConnector = true
```
For **Android**, in your `gradle.properties` file located within the `Android` folder of your React Native project, set `appsflyer.enable_purchase_connector` to `true`.
```groovy
appsflyer.enable_purchase_connector=true
```
Once you set these properties, the Purchase Validation feature will be integrated into your project and you can utilize its functionality in your app.

### <a id="important-callout-what-happens-if-you-use-the-purchase-connector-files-without-opting-in"></a>Important Callout: What Happens if You Use the Purchase Connector Files Without Opting In?

The files for the Purchase Validation feature are always included in the plugin. If you try to use these JS APIs without opting into the feature, the APIs will not have effect because the corresponding native code necessary for them to function will not be included in your project.

In such cases, you'll likely experience errors or exceptions when trying to use functionalities provided by the Purchase Validation feature. To avoid these issues, ensure that you opt-in to the feature if you intend to use any related APIs.

## <a id="basic-integration-of-the-connector"></a>Basic Integration Of The Connector
### <a id="create-purchaseconnector-instance"></a>Create PurchaseConnector Instance
The `PurchaseConnector` requires a configuration object of type `PurchaseConnectorConfig` at instantiation time. This configuration object governs how the `PurchaseConnector` behaves in your application.

To properly set up the configuration object, you must specify certain parameters:

- `logSubscriptions`: If set to `true`, the connector logs all subscription events.
- `logInApps`: If set to `true`, the connector logs all in-app purchase events.
- `sandbox`: If set to `true`, transactions are tested in a sandbox environment. Be sure to set this to `false` in production.

Here's an example usage:

```javascript
import appsFlyer, {
  AppsFlyerPurchaseConnector,
  AppsFlyerPurchaseConnectorConfig,
} from 'react-native-appsflyer';

const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
    logSubscriptions: true,
    logInApps: true,
    sandbox: true,
  });

//Create the object
AppsFlyerPurchaseConnector.create(purchaseConnectorConfig);

// Continue with your application logic...
```

**IMPORTANT**: The `PurchaseConnectorConfig` is required only the first time you instantiate `PurchaseConnector`. If you attempt to create a `PurchaseConnector` instance and no instance has been initialized yet, you must provide a `PurchaseConnectorConfig`. If an instance already exists, the system will ignore the configuration provided and will return the existing instance to enforce the singleton pattern.

For example:

```javascript
  // Correct usage: Providing configuration at first instantiation
  const purchaseConnectorConfig1: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
    logSubscriptions: true,
    logInApps: true,
    sandbox: true,
  });

  // Additional instantiations will ignore the provided configuration
  // and will return the previously created instance.
  const purchaseConnectorConfig2: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
    logSubscriptions: true,
    logInApps: true,
    sandbox: true,
  });

  // purchaseConnector1 and purchaseConnector2 point to the same instance
  assert(purchaseConnectorConfig1 == purchaseConnectorConfig2);
```

Thus, always ensure that the initial configuration fully suits your requirements, as subsequent changes are not considered.

Remember to set `sandbox` to `false` before releasing your app to production. If the production purchase event is sent in sandbox mode, your event won't be validated properly by AppsFlyer.
### <a id="start-observing-transactions"></a>Start Observing Transactions
Start the SDK instance to observe transactions. </br>

**⚠️ Please Note**
> This should be called right after calling the `appsFlyer.startSdk()` [start](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/blob/master/Docs/RN_API.md#startsdk).
>  Calling `startObservingTransactions` activates a listener that automatically observes new billing transactions. This includes new and existing subscriptions and new in app purchases.
>  The best practice is to activate the listener as early as possible.
```javascript
        import appsFlyer, {
        AppsFlyerPurchaseConnector,
        AppsFlyerPurchaseConnectorConfig,
        } from 'react-native-appsflyer';

        appsFlyer.startSdk();
        const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
            logSubscriptions: true,
            logInApps: true,
            sandbox: true,
        });

        //Create the object
        AppsFlyerPurchaseConnector.create(purchaseConnectorConfig);
        //Start listening to transactions
        AppsFlyerPurchaseConnector.startObservingTransactions();
```

### <a id="stop-observing-transactions"></a>Stop Observing Transactions
Stop the SDK instance from observing transactions. </br>
**⚠️ Please Note**
> This should be called if you would like to stop the Connector from listening to billing transactions. This removes the listener and stops observing new transactions.
> An example for using this API is if the app wishes to stop sending data to AppsFlyer due to changes in the user's consent (opt-out from data sharing). Otherwise, there is no reason to call this method.
> If you do decide to use it, it should be called right before calling the Android SDK's [`stop`](https://dev.appsflyer.com/hc/docs/android-sdk-reference-appsflyerlib#stop) API

```javascript
        //Stop listening to transactions after startSDK and after creating the AppsFlyerPurchaseConnector
        AppsFlyerPurchaseConnector.startObservingTransactions();
```

### <a id="log-subscriptions"></a>Log Subscriptions
Enables automatic logging of subscription events.  
Set `true` to enable, `false` to disable.  
If this field is not used, by default, the connector will not record Subscriptions.

```javascript
const purchaseConnectorConfig = {
  logSubscriptions: true, // Set to true to enable logging of subscriptions
  // ... other configuration options
};
```

### <a id="log-in-app-purchases"></a>Log In App Purchases
Enables automatic logging of In-App purchase events  
Set `true` to enable, `false` to disable.  
If this field is not used, by default, the connector will not record In App Purchases.

```javascript
const purchaseConnectorConfig = {
  logInApps: true, // Set to true to enable logging of in-app purchases
  // ... other configuration options
};
```

And integrating both options into the example you provided would look like this:

```javascript
const purchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
  logSubscriptions: true, // Enable automatic logging of subscription events
  logInApps: true,        // Enable automatic logging of in-app purchase events
  sandbox: true,          // Additional configuration option
});
```

## <a id="register-validation-results-listeners"></a>Register Validation Results Listeners
You can register listeners to get the validation results once getting a response from AppsFlyer servers to let you know if the purchase was validated successfully.</br>

### <a id="cross-platform-considerations"></a>Cross-Platform Considerations

The AppsFlyer SDK React Native plugin acts as a bridge between your React Native app and the underlying native SDKs provided by AppsFlyer. It's crucial to understand that the native infrastructure of iOS and Android is quite different, and so is the AppsFlyer SDK built on top of them. These differences are reflected in how you would handle callbacks separately for each platform.

In the iOS environment, there is a single callback method  `didReceivePurchaseRevenueValidationInfo`  to handle both subscriptions and in-app purchases. You set this callback using  `OnReceivePurchaseRevenueValidationInfo`.

On the other hand, Android segregates callbacks for subscriptions and in-app purchases. It provides two separate listener methods -  `onSubscriptionValidationResultSuccess` and `onSubscriptionValidationResultFailure`  for subscriptions and  `onInAppValidationResultSuccess` and `onInAppValidationResultFailure`  for in-app purchases. These listener methods register callback handlers for  `OnResponse`  (executed when a successful response is received) and  `OnFailure`  (executed when a failure occurs, including due to a network exception or non-200/OK response from the server).

By splitting the callbacks, you can ensure platform-specific responses and tailor your app's behavior accordingly. It's crucial to consider these nuances to ensure a smooth integration of AppsFlyer SDK into your React Native application.

### <a id="android-callback-types"></a>Android Callback Types

| Listener Method               | Description  |
|-------------------------------|--------------|
| `onResponse(result: Result?)` | Invoked when we got 200 OK response from the server (INVALID purchase is considered to be successful response and will be returned to this callback) |
|`onFailure(result: String, error: Throwable?)`|Invoked when we got some network exception or non 200/OK response from the server.|

### <a id="android---subscription-and-inapps-validation-result-listener"></a>Android - Subscription Validation Result Listener and In Apps Validation Result Listener

```javascript   
import appsFlyer , {AppsFlyerPurchaseConnector} from 'react-native-appsflyer';

  const handleValidationSuccess = (validationResult) => {
    console.log('>> ValidationSuccess: ', validationResult);
  };

  const handleValidationFailure = (validationResult) => {
    console.log('>> ValidationFailure: ', validationResult);
  }

  const handleSubscriptionValidationSuccess = (subscriptionValidationResult) => {
    console.log('>> handleSubscriptionValidationSuccess: ', subscriptionValidationResult);
  };

  const handleSubscriptionValidationFailure = (subscriptionValidationResult) => {
    console.log('>> handleSubscriptionValidationFailure: ', subscriptionValidationResult);
  }

  useEffect(() => {
    let validationSuccessListener;
    let validationFailureListener;
    let subscriptionValidationSuccessListener;
    let subscriptionValidationFailureListener;
  
    if (Platform.OS === 'android') {
      validationSuccessListener = AppsFlyerPurchaseConnector.onInAppValidationResultSuccess(handleValidationSuccess);
      validationFailureListener = AppsFlyerPurchaseConnector.onInAppValidationResultFailure(handleValidationFailure);
      subscriptionValidationSuccessListener = AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess(handleSubscriptionValidationSuccess);
      subscriptionValidationFailureListener = AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure(handleSubscriptionValidationFailure);
    }

  }, []);
```

### <a id="ios-combined-validation-result-listener"></a>iOS Combined Validation Result Listener
```javascript
import appsFlyer , {AppsFlyerPurchaseConnector} from 'react-native-appsflyer';

const handleOnReceivePurchaseRevenueValidationInfo = (validationResult) => {
    console.log('>> handleOnReceivePurchaseRevenueValidationInfo: ', validationResult);
  }
  
  useEffect(() => {
    let purchaseRevenueValidationListener;
  
    if (Platform.OS === 'ios') {
      purchaseRevenueValidationListener = AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo(handleOnReceivePurchaseRevenueValidationInfo);
    }
    };
  }, []);
```


## <a id="testing-the-integration"></a>Testing the Integration

With the AppsFlyer SDK, you can select which environment will be used for validation - either **production** or **sandbox**. By default, the environment is set to production. However, while testing your app, you should use the sandbox environment.

### <a id="android"></a>Android

For Android, testing your integration with the [Google Play Billing Library](https://developer.android.com/google/play/billing/test) should use the sandbox environment.

To set the environment to sandbox in React Native, just set the `sandbox` parameter in the `PurchaseConnectorConfig` to `true` when instantiating `PurchaseConnector`.

Remember to switch the environment back to production (set `sandbox` to `false`) before uploading your app to the Google Play Store.

### <a id="ios"></a>iOS

To test purchases in an iOS environment on a real device with a TestFlight sandbox account, you also need to set `sandbox` to `true`.

> *IMPORTANT NOTE: Before releasing your app to production please be sure to set `sandbox` to `false`. If a production purchase event is sent in sandbox mode, your event will not be validated properly! *

## <a id="proguard-rules-for-android"></a>ProGuard Rules for Android

If you are using ProGuard to obfuscate your APK for Android, you need to ensure that it doesn't interfere with the functionality of AppsFlyer SDK and its Purchase Connector feature.

Add following keep rules to your  `proguard-rules.pro`  file:

```groovy
-keep  class  com.appsflyer.** { *; }  
-keep  class  kotlin.jvm.internal.Intrinsics{ *; }  
-keep  class  kotlin.collections.**{ *; }
```

## <a id="full-code-example"></a>Full Code Example
```javascript
const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
    logSubscriptions: true,
    logInApps: true,
    sandbox: true,
  });
  
  AppsFlyerPurchaseConnector.create(
    purchaseConnectorConfig,
  );
    
const handleValidationSuccess = (validationResult) => {
    console.log('>> ValidationSuccess: ', validationResult);
  };

  const handleValidationFailure = (validationResult) => {
    console.log('>> ValidationFailure: ', validationResult);
  }

  const handleSubscriptionValidationSuccess = (subscriptionValidationResult) => {
    console.log('>> handleSubscriptionValidationSuccess: ', subscriptionValidationResult);
  };

  const handleSubscriptionValidationFailure = (subscriptionValidationResult) => {
    console.log('>> handleSubscriptionValidationFailure: ', subscriptionValidationResult);
  }

  const handleOnReceivePurchaseRevenueValidationInfo = (validationResult) => {
    console.log('>> handleOnReceivePurchaseRevenueValidationInfo: ', validationResult);
  }

  
  useEffect(() => {
    let validationSuccessListener;
    let validationFailureListener;
    let subscriptionValidationSuccessListener;
    let subscriptionValidationFailureListener;
    let purchaseRevenueValidationListener;
  
    if (Platform.OS === 'android') {
      validationSuccessListener = AppsFlyerPurchaseConnector.onInAppValidationResultSuccess(handleValidationSuccess);
      validationFailureListener = AppsFlyerPurchaseConnector.onInAppValidationResultFailure(handleValidationFailure);
      subscriptionValidationSuccessListener = AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess(handleSubscriptionValidationSuccess);
      subscriptionValidationFailureListener = AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure(handleSubscriptionValidationFailure);
    } else {
      console.log('>> Creating purchaseRevenueValidationListener ');
      purchaseRevenueValidationListener = AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo(handleOnReceivePurchaseRevenueValidationInfo);
    }
  
    // Cleanup function
    return () => {
      if (Platform.OS === 'android') {
        if (validationSuccessListener) validationSuccessListener.remove();
        if (validationFailureListener) validationFailureListener.remove();
        if (subscriptionValidationSuccessListener) subscriptionValidationSuccessListener.remove();
        if (subscriptionValidationFailureListener) subscriptionValidationFailureListener.remove();
      } else {
        if (purchaseRevenueValidationListener) purchaseRevenueValidationListener.remove();
      }
    };
  }, []);

  AppsFlyerPurchaseConnector.startObservingTransactions();

//AppsFlyerPurchaseConnector.stopObservingTransactions();
```