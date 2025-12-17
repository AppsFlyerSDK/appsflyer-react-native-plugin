<img src="https://massets.appsflyer.com/wp-content/uploads/2018/06/20092440/static-ziv_1TP.png"  width="400" >

# appsflyer-react-native-plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer)
[![Downloads](https://img.shields.io/npm/dm/react-native-appsflyer.svg)](https://www.npmjs.com/package/react-native-appsflyer)

🛠 In order for us to provide optimal support, please contact AppsFlyer support through the Customer Assistant Chatbot for assistance with troubleshooting issues or product guidance. </br>
To do so, please follow [this article](https://support.appsflyer.com/hc/en-us/articles/23583984402193-Using-the-Customer-Assistant-Chatbot)


### <a id="plugin-build-for"> This plugin is built for

- Android AppsFlyer SDK **v6.17.5**
- iOS AppsFlyer SDK **v6.17.8**
- Minimum tested with React-Native **v0.62.0** (older versions might be supported)

## <a id="release-updates"> Release Updates

- Starting with version `6.17.1` the plugin supports the Purchase Connector for validating and measuring Subscription and In-app purchase events. Integration guide can be found [here](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/blob/master/Docs/RN_PurchaseConnector.md).

- Starting with version `6.17.1` the TypeScript interfaces for Purchase Connector data sources have been simplified and are now **breaking changes**:
    - `PurchaseRevenueDataSource.purchaseRevenueAdditionalParametersForProducts()` function has been replaced with `additionalParameters` object
    - `PurchaseRevenueDataSourceStoreKit2.purchaseRevenueAdditionalParametersStoreKit2ForProducts()` function has been replaced with `additionalParameters` object

- Starting with version `6.16.2`, `AppsFlyerConsent.forGDPRUser` and `AppsFlyerConsent.forNonGDPRUser` have been **deprecated**. Use the new `AppsFlyerConsent` constructor instead. See [Deprecation Notice](/Docs/RN_CMP.md#deprecation-notice).

- Starting with version `6.15.1`, upgraded to targetSDKVersion 34, Java 17, and Gradle 8.7 in [AppsFlyer Android SDK v6.15.1](https://support.appsflyer.com/hc/en-us/articles/115001256006-AppsFlyer-Android-SDK-release-notes).

- Starting with version `6.15.1`, iOS Minimum deployment target is set to 12.0.

---

## 🚀 Getting Started

- [Installation](/Docs/RN_Installation.md)
- [**_Expo_** Installation](/Docs/RN_ExpoInstallation.md)
- [Integration](/Docs/RN_Integration.md)
- [Test integration](/Docs/RN_Testing.md)
- [In-app events](/Docs/RN_InAppEvents.md)
- [Uninstall measurement](/Docs/RN_UninstallMeasurement.md)
- [Send consent for DMA compliance](/Docs/RN_CMP.md)
- [Purchase Connector](/Docs/RN_PurchaseConnector.md)
##  🔗 Deep Linking
- [Integration](/Docs/RN_DeepLinkIntegrate.md)
- [**_Expo_** Integration](/Docs/RN_ExpoDeepLinkIntegration.md)
- [Unified Deep Link (UDL)](/Docs/RN_UnifiedDeepLink.md)
- [User Invite](/Docs/RN_UserInvite.md)

## 🧪 Sample Apps

- [React-Native Sample App](/demos/appsflyer-react-native-app)
- [🆕 Expo Sample App](https://github.com/AppsFlyerSDK/appsflyer-expo-sample-app)

### [API reference](/Docs/RN_API.md)
