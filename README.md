<img src="https://massets.appsflyer.com/wp-content/uploads/2018/06/20092440/static-ziv_1TP.png"  width="400" > 

# appsflyer-react-native-plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/react-native-appsflyer.svg)](https://badge.fury.io/js/react-native-appsflyer)
[![Downloads](https://img.shields.io/npm/dm/react-native-appsflyer.svg)](https://www.npmjs.com/package/react-native-appsflyer)

🛠 In order for us to provide optimal support, we would kindly ask you to submit any issues to support@appsflyer.com

> *When submitting an issue please specify your AppsFlyer sign-up (account) email , your app ID , production steps, logs, code snippets and any additional relevant information.*


### <a id="plugin-build-for"> This plugin is built for

- Android AppsFlyer SDK **v6.9.4**
- iOS AppsFlyer SDK **v6.9.1**

## <a id="breaking-changes"> 	❗❗ Breaking changes when updating to v6.x.x❗❗

- From version `6.3.0`, we use `xcframework` for iOS platform. Then you need to use cocoapods version >= 1.10

- From version `6.2.30`, `logCrossPromotionAndOpenStore`  api will register as `af_cross_promotion` instead of `af_app_invites` in your dashboard.<br>
Click on a link that was generated using `generateInviteLink` api will be register as `af_app_invites`.

- From version `6.0.0` we have renamed the following APIs:

| Old API                       | New API                       |
| ------------------------------|-------------------------------|
| trackEvent                    | logEvent                      |
| trackLocation                 | logLocation                   |
| stopTracking                  | stop                          |
| trackCrossPromotionImpression | logCrossPromotionImpression   |
| trackAndOpenStore             | logCrossPromotionAndOpenStore |
| setDeviceTrackingDisabled     | anonymizeUser                 |
| AppsFlyerTracker    | AppsFlyerLib                 |

And removed the following ones:

- trackAppLaunch -> no longer needed. See new init guide
- sendDeepLinkData -> no longer needed. See new init guide
- enableUninstallTracking -> no longer needed. See new uninstall measurement guide

If you have used 1 of the removed APIs, please check the integration guide for the updated instructions

 ##  📖 Guides
- [Adding the SDK to your project](/Docs/Installation.md)
- [Integrate into an ***Expo*** project](/Docs/Expo.md)
- [Initializing the SDK](/Docs/BasicIntegration.md)
- [In-app Events](/Docs/InAppEvents.md)
- [Deep Linking](/Docs/DeepLink.md)
- [Advanced APIs](/Docs/AdvancedAPI.md)
- [Testing the integration](/Docs/Testing.md)
- [APIs](/Docs/API.md)
- [React-Native Sample App](/demos)

