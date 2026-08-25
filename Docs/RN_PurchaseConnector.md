---
title: Purchase Connector
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 13
hidden: false
---

**At a glance:** Automatically validate and measure revenue from in-app purchases and auto-renewable subscriptions to get the full picture of your customers' life cycles and accurate ROAS measurements.
For more information please check the following pages:
*  [ROI360 in-app purchase (IAP) and subscription revenue measurement](https://support.appsflyer.com/hc/en-us/articles/7459048170769-ROI360-in-app-purchase-IAP-and-subscription-revenue-measurement?query=purchase)
* [Android Purchase Connector](https://dev.appsflyer.com/hc/docs/purchase-connector-android)
* [iOS Purchase Connector](https://dev.appsflyer.com/hc/docs/purchase-connector-ios)

🛠 You can contact AppsFlyer support through the Customer Assistant Chatbot for assistance with troubleshooting issues or product guidance. To do so, please follow this article: https://support.appsflyer.com/hc/en-us/articles/23583984402193-Using-the-Customer-Assistant-Chatbot.

> *When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*

## <a id="important-note"></a>Important Note

The Purchase Connector feature of the AppsFlyer SDK depends on specific libraries provided by Google and Apple for managing in-app purchases:

-   For Android, it depends on the  [Google Play Billing Library](https://developer.android.com/google/play/billing/integrate) (Supported versions: 5.x.x - 7.x.x).
-   For iOS, it depends on  [StoreKit](https://developer.apple.com/documentation/storekit) (Supported versions: StoreKit1 and StoreKit2).

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


## <a id="proguard-rules-for-android"></a>ProGuard Rules for Android

If you are using ProGuard to obfuscate your APK for Android, you need to ensure that it doesn't interfere with the functionality of AppsFlyer SDK and its Purchase Connector feature.

Add following keep rules to your  `proguard-rules.pro`  file:

```groovy
-keep  class  com.appsflyer.** { *; }  
-keep  class  kotlin.jvm.internal.Intrinsics{ *; }  
-keep  class  kotlin.collections.**{ *; }
```

## <a id="basic-integration-of-the-connector"></a>Basic Integration Of The Connector
### <a id="create-purchaseconnector-instance"></a>Create PurchaseConnector Instance
The `PurchaseConnector` requires a configuration object of type `PurchaseConnectorConfig` at instantiation time. This configuration object governs how the `PurchaseConnector` behaves in your application.

To properly set up the configuration object, you must specify certain parameters:

- `logSubscriptions` (required): Set to `true` to enable logging of subscription events, or `false` to disable.
- `logInApps` (required): Set to `true` to enable logging of in-app purchase events, or `false` to disable.
- `sandbox`: If set to `true`, transactions are tested in a sandbox environment. Be sure to set this to `false` in production.
- `storeKitVersion`: (iOS only) Specifies which StoreKit version to use. Defaults to `StoreKitVersion.SK1` if not specified. Use `StoreKitVersion.SK2` for iOS 15.0+ features.

Here's an example usage:

```javascript
import AppsFlyer, {
  AppsFlyerPurchaseConnector,
  AppsFlyerPurchaseConnectorConfig,
  StoreKitVersion,
} from 'react-native-appsflyer';

// StoreKit1 (default - storeKitVersion is not required)
const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
  logSubscriptions: true,
  logInApps: true,
  sandbox: true,
});

// For StoreKit2 (iOS 15.0+), specify the storeKitVersion:
// const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
//   logSubscriptions: true,
//   logInApps: true,
//   sandbox: true,
//   storeKitVersion: StoreKitVersion.SK2
// });

// Create the connector instance
AppsFlyerPurchaseConnector.create(purchaseConnectorConfig);

// Continue with your application logic...
```

**IMPORTANT**: The `PurchaseConnectorConfig` is required only the first time you instantiate `PurchaseConnector`. If you attempt to create a `PurchaseConnector` instance and no instance has been initialized yet, you must provide a `PurchaseConnectorConfig`. If an instance already exists, the system will ignore the configuration provided and will return the existing instance to enforce the singleton pattern.

If you call `create()` multiple times, only the first configuration is used. Subsequent calls return the existing instance without creating a new one. Thus, always ensure that the initial configuration fully suits your requirements, as subsequent changes are not considered.

Remember to set `sandbox` to `false` before releasing your app to production. If the production purchase event is sent in sandbox mode, your event won't be validated properly by AppsFlyer.
### <a id="start-observing-transactions"></a>Start Observing Transactions
Start the SDK instance to observe transactions. </br>

**⚠️ Please Note**
> This should be called right after `AppsFlyer.start()` fires inside `registerSessionReadyListener` — see [start](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/blob/master/Docs/RN_API.md#start). `start()` must not be called standalone; it only resolves correctly once the session-ready callback has fired.
>  Calling `startObservingTransactions` activates a listener that automatically observes new billing transactions. This includes new and existing subscriptions and new in app purchases.
>  The best practice is to activate the listener as early as possible.
```javascript
        import AppsFlyer, {
        AppsFlyerPurchaseConnector,
        AppsFlyerPurchaseConnectorConfig,
        StoreKitVersion,
        } from 'react-native-appsflyer';

        AppsFlyer.init(devKey, appId).then(...);

        AppsFlyer.registerSessionReadyListener(() => {
          AppsFlyer.start();
        });

        // StoreKit1 example (default behavior)
        const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
          logSubscriptions: true,
          logInApps: true,
          sandbox: true,
          // storeKitVersion: StoreKitVersion.SK1 // Optional - SK1 is default
        });

        // StoreKit2 example (iOS 15.0+)
        // const purchaseConnectorConfig: PurchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
        //   logSubscriptions: true,
        //   logInApps: true,
        //   sandbox: true,
        //   storeKitVersion: StoreKitVersion.SK2
        // });

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
        //Stop listening to transactions after start and after creating the AppsFlyerPurchaseConnector
        AppsFlyerPurchaseConnector.stopObservingTransactions();
```


### <a id="logging-consumable-transactions"></a>Logging Consumable Transactions

On iOS 15 and above, consumable in-app purchases are handled via StoreKit 2. The behavior depends on your iOS version:

- **On iOS 18 and later:**  
  Apple introduced a new Info.plist flag: `SKIncludeConsumableInAppPurchaseHistory`.  
  - If you set `SKIncludeConsumableInAppPurchaseHistory` to `YES` in your Info.plist, automatic collection will happen.
  - If the flag is not present or is set to `NO`, you must manually log consumable transactions as shown below.

- **On iOS 15–17:**  
  Consumable purchases must always be logged manually.

To manually log consumable transactions, use the `logConsumableTransaction` method after finishing the transaction:

```javascript
import { Platform } from 'react-native';
import { AppsFlyerPurchaseConnector } from 'react-native-appsflyer';

// Purchase update listener
purchaseUpdatedListener((purchase) => {
  console.log("🛒 Purchase updated:", purchase.productId, "Transaction ID:", purchase.transactionId);
  const isConsumable = consumablesItems.includes(purchase.productId);
  
  finishTransaction({ purchase, isConsumable })
    .then((res) => {
      console.log("✅ finishTransaction success:", res);
      console.log("🔍 Expecting AppsFlyer validation callback for:", purchase.productId);
      
      // Log consumable transaction for iOS
      if (Platform.OS === 'ios' && isConsumable && purchase.transactionId) {
        AppsFlyerPurchaseConnector.logConsumableTransaction(purchase.transactionId);
        console.log("📝 Consumable transaction logged:", purchase.transactionId);
      }
    })
    .catch((error) => {
      console.warn("❌ Error finishing transaction:", error);
    });
});
```

### Method Signature

```javascript
AppsFlyerPurchaseConnector.logConsumableTransaction(transactionId: string): void
```

**Parameters:**
- `transactionId` (string): The unique transaction identifier from the App Store transaction

**Note:** This method is iOS-specific and should only be called on iOS devices. On Android, consumable transactions are automatically handled by the Purchase Connector.


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
import AppsFlyer , {AppsFlyerPurchaseConnector} from 'react-native-appsflyer';

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
import AppsFlyer , {AppsFlyerPurchaseConnector} from 'react-native-appsflyer';

const handleOnReceivePurchaseRevenueValidationInfo = (validationInfo, error) => {
    if (error) {
      console.error("Error during purchase validation:", error);
    } else {
      console.log("Validation Info:", validationInfo);
    }
  }
  
  useEffect(() => {
    let purchaseRevenueValidationListener;
  
    if (Platform.OS === 'ios') {
      purchaseRevenueValidationListener = AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo(handleOnReceivePurchaseRevenueValidationInfo);
    }
    };
  }, []);
```

## <a id="full-code-example"></a>Full Code Example
```javascript
import AppsFlyer, {
  StoreKitVersion,
  AppsFlyerPurchaseConnector,
  AppsFlyerPurchaseConnectorConfig,
} from 'react-native-appsflyer';

const purchaseConnectorConfig = AppsFlyerPurchaseConnectorConfig.setConfig({
    logSubscriptions: true,
    logInApps: true,
    sandbox: true,
    storeKitVersion: StoreKitVersion.SK2
  });
  
  AppsFlyerPurchaseConnector.create(purchaseConnectorConfig);
    
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

  const handleOnReceivePurchaseRevenueValidationInfo = (validationInfo, error) => {
    if (error) {
      console.error("Error during purchase validation:", error);
    } else {
      console.log("Validation Info:", validationInfo);
    }
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

## <a id="purchase-revenue-data-sources"></a>Purchase Revenue Data Sources

The Purchase Connector allows you to add additional parameters to your purchase events through data sources. These parameters will be included in the purchase events sent to AppsFlyer.

### <a id="ios-data-sources"></a>iOS Data Sources

For iOS, there are two types of data sources:

1. **StoreKit1 Data Source**: For traditional in-app purchases
2. **StoreKit2 Data Source**: For iOS 15.0 and later, supporting the newer StoreKit2 framework

#### StoreKit1 Data Source
```javascript
// Set additional parameters for StoreKit1 purchases
AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource({
  additionalParameters: {
    user_id: '12345',
    user_type: 'premium',
    purchase_source: 'app_store',
    custom_param1: 'value1',
    custom_param2: 'value2'
  }
});
```

#### StoreKit2 Data Source
```javascript
// Set additional parameters for StoreKit2 purchases
AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2({
  additionalParameters: {
    user_id: '12345',
    user_type: 'premium',
    purchase_source: 'app_store',
    custom_param1: 'value1',
    custom_param2: 'value2'
  }
});
```

### <a id="android-data-sources"></a>Android Data Sources

For Android, there are two types of data sources:

1. **Subscription Purchase Data Source**: For subscription purchases
2. **In-App Purchase Data Source**: For one-time in-app purchases

#### Subscription Purchase Data Source
```javascript
// Set callback for subscription purchase events
AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource({
  onNewPurchases: (purchaseEvents) => {
    console.log('Subscription purchase events:', purchaseEvents);
  }
});
```

#### In-App Purchase Data Source
```javascript
// Set callback for in-app purchase events
AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource({
  onNewPurchases: (purchaseEvents) => {
    console.log('In-app purchase events:', purchaseEvents);
  }
});
```

### <a id="platform-specific-implementation"></a>Platform-Specific Implementation

When implementing these data sources in your app, you should consider the platform differences:

```javascript
import { Platform } from 'react-native';
import { AppsFlyerPurchaseConnector } from 'react-native-appsflyer';

const setupPurchaseDataSources = () => {
  if (Platform.OS === 'ios') {
    // iOS StoreKit1 data source
    AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource({
      additionalParameters: {
        user_id: '12345',
        user_type: 'premium',
        purchase_source: 'app_store'
      }
    });

    // iOS StoreKit2 data source (iOS 15.0+)
    AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2({
      additionalParameters: {
        user_id: '12345',
        user_type: 'premium',
        purchase_source: 'app_store'
      }
    });
  } else if (Platform.OS === 'android') {
    // Android subscription data source
    AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource({
      onNewPurchases: (purchaseEvents) => {
        console.log('Subscription purchase events:', purchaseEvents);
      }
    });

    // Android in-app purchase data source
    AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource({
      onNewPurchases: (purchaseEvents) => {
        console.log('In-app purchase events:', purchaseEvents);
      }
    });
  }
};
```

### <a id="important-notes"></a>Important Notes

1. **iOS StoreKit2**: The StoreKit2 data source is only available on iOS 15.0 and later. Make sure to check the iOS version before using it.

2. **Parameter Structure**: 
   - For iOS StoreKit1 and StoreKit2, use the `additionalParameters` object to add custom parameters
   - For Android, use the `onNewPurchases` callback to handle purchase events

3. **Timing**: Initialization order is: (1) Create the Purchase Connector instance with configuration, (2) Set up any data sources, (3) Call `startObservingTransactions()`. See the "Create PurchaseConnector Instance" and "Platform-Specific Implementation" sections above for configuration and data source examples.

## <a id="testing-the-integration"></a>Testing the Integration

With the AppsFlyer SDK, you can select which environment will be used for validation - either **production** or **sandbox**. By default, the environment is set to production. However, while testing your app, you should use the sandbox environment.

### <a id="android"></a>Android

For Android, testing your integration with the [Google Play Billing Library](https://developer.android.com/google/play/billing/test) should use the sandbox environment.

To set the environment to sandbox in React Native, just set the `sandbox` parameter in the `PurchaseConnectorConfig` to `true` when instantiating `PurchaseConnector`.

Remember to switch the environment back to production (set `sandbox` to `false`) before uploading your app to the Google Play Store.

### <a id="ios"></a>iOS

To test purchases in an iOS environment on a real device with a TestFlight sandbox account, you also need to set `sandbox` to `true`.

> *IMPORTANT NOTE: Before releasing your app to production please be sure to set `sandbox` to `false`. If a production purchase event is sent in sandbox mode, your event will not be validated properly! *
