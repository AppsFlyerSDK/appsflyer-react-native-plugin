# Versions
## 6.2.30
- iOS SDK 6.2.3
- FIx logAndOpenStore generates user invite link

## 6.2.10
- Android SDK 6.2.0
- iOS SDK 6.2.1
- In-App events callback from the native sdk
- onDeepLink result data is string instead of an object [Android]
- `AppsFlyerAttribution` object for handling deep links

## 6.1.41
- Add onAttributionFailure listener
- fix event listeners error handling

## 6.1.40
- fix onAppOpenAttribution on iOS. PLEASE check out the Docs [here](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/blob/releases/6.x.x/6.1.x/6.1.40/Docs/Guides.md#-ios-deep-links---universal-links-and-url-schemes)

## 6.1.30
- Android SDK 6.1.3
- iOS SDK 6.1.3
- setHost API
- addPushNotificationDeepLinkPath API

## 6.1.20
- Unified deep linking

## 6.1.10
- iOS SDK 6.1.1
- Android SDK 6.1.0
- Add script for switching between Strict and Regular mode

## 6.1.0
- iOS SDK 6.1.0
- Android SDK 6.1.0

## 6.0.50
- iOS SDK 6.0.5
- Android SDK 5.4.4

## 6.0.33
- Send Push Notification API
- Fix TypeScript types for initSdk and logEvent

## 6.0.31
- In-App purchase validation
- Add parameters type check to public api
- Fix crash on null callbacks
- Install Referrer v2.1

## 6.0.30

- iOS SDK 6.0.3

_init options properties renamed:_

| Old API                       | New API                           |
| ------------------------------|-----------------------------------|
| timeToWaitForAdvertiserID     | timeToWaitForATTUserAuthorization |

## 6.0.20

- iOS SDK 6.0.2

_APIs renamed:_

| Old API                       | New API                       |
| ------------------------------|-------------------------------|
| trackEvent                    | logEvent                      |
| trackLocation                 | logLocation                   |
| stopTracking                  | stop                          |
| trackCrossPromotionImpression | logCrossPromotionImpression   |
| trackAndOpenStore             | logCrossPromotionAndOpenStore |
| setDeviceTrackingDisabled     | anonymizeUser                 |
| disableAdvertiserIdentifier   | disableAdvertisingIdentifier  |


_APIs removed:_

- trackAppLaunch
- enableUninstallTracking
- sendDeepLinkData


## 5.4.40
- Android SDK v5.4.3
- iOS SDK v5.4.4 
- Install Referrer v1.1.2

_New APIs:_

- disableAdvertiserIdentifier
- disableCollectASA

## 5.4.1
- Android and iOS SDK 5.4.1
- iOS lifecycle now handled natively and not from _handleAppStateChange

_New APIs:_

- setOneLinkCustomDomains  
- setResolveDeepLinkURLs  
- performOnAppAttribute  
- setSharingFilterForAllPartners  
- setSharingFilter  


## 5.2.0
Android AppsFlyer SDK 5.2.0
iOS SDK AppsFlyer 5.2.0
Added brandDomain support for iOS & Android

## 5.1.3
Downgrade installReferrer to 1.0 due to bug in installReferrer 1.1

## 5.1.2
Add support for iOS for updateServerUninstallToken api 

## 5.1.1
Added setDeviceTrackingDisabled api 

## 5.1.0

Android AppsFlyer SDK 5.1.0
iOS SDK AppsFlyer 5.1.0

## 5.0.0

Android AppsFlyer SDK 5.0.0
iOS SDK AppsFlyer 5.0.0

## 1.4.7

Added Support for autolinking

## 1.4.6

Fixed issue #111 - https://github.com/AppsFlyerSDK/react-native-appsflyer/issues/111
See - https://github.com/AppsFlyerSDK/react-native-appsflyer/pull/112

## 1.4.5

Updated Android AppsFlyer SDK to 4.10.2
Updated iOS AppsFlyer SDK to 4.10.4

Changes and fixes: 
 - Update for iOS 13 push token retrieval needed for Uninstall Measurement
 - replaced NativeAppEventEmitter with NativeEventEmitter  - https://github.com/AppsFlyerSDK/react-native-appsflyer/issues/105

## 1.4.4

Changes and fixes: 

 - added setCurrencyCode API
 - fixed is_first_launch issue

## 1.4.3

Changes and fixes: 

 - fixed getCurrentActivity - https://github.com/AppsFlyerSDK/react-native-appsflyer/issues/82
 - fixed generateInviteLink - https://github.com/AppsFlyerSDK/react-native-appsflyer/issues/78

## 1.4.2

Added User Invite Tracking 
Added Cross-Promotion Tracking

Changes and fixes: 

 - added `setAppInviteOneLinkID` API
 - added `generateInviteLink` API
 - added `trackCrossPromotionImpression` API
 - added `trackAndOpenStore` API

## 1.4.1

Android AppsFlyer SDK 4.8.20
iOS SDK AppsFlyer 4.8.12
Release date: Feb 20, 2018
Release type: Major / **Minor** / Hotfix
Release scope: Public

Changes and fixes: 

 - added `setAdditionalData` API

## 1.4.0

Android AppsFlyer SDK 4.8.20
iOS SDK AppsFlyer 4.8.12
Release date: Feb 18, 2018
Release type: Major / **Minor** / Hotfix
Release scope: Public

Changes and fixes: 

 - Separated callbacks for `onAppOpenAttribution` and `getConversionData`.
 - [[#53](https://github.com/AppsFlyerSDK/react-native-appsflyer/issues/53)] onInstallConversionData doesn't return onAppOpenAttribution when mounting
