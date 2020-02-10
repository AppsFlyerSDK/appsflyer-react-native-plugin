# Versions

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
