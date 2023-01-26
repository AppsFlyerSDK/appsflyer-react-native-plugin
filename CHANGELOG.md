## 6.9.4
 Release date: *2022-12-27*

- React Native > Change implementation to api when importing native android sdk
- Update React Native Plugin to v6.9.4

## 6.9.2
 Release date: *2022-10-20*

- React Native Plugin - add support for the disableIDFVCollection API

## 6.9.1
 Release date: *2022-09-22*

- React Native >> Support Deep Linking without calling startSDK()
- React Native >> Separate between initSDK and startSDK

## 6.8.2
 Release date: *2022-08-30*

- React Native > update android native SDK to v6.8.2

## 6.8.0
 Release date: *2022-07-24*

- Update React Native Plugin to v6.8.0

## 6.6.1
Release date: *2022-June-21*

- React Native > add support for the appendParametersToDeepLinkingURL API

## 6.6.0
Release date: *2022-May-18*

- React Native > Expo
- React Native > Fix app crash when activity is null on sendPushNotificationData

## 6.5.21
Release date: *2022-February-16*

- React Native > remove ActivityEventListener

## 6.5.20
Release date: *2022-January-30*

- React Native > Update native SDK to v6.5.2
- React Native > show the ATT in didBecomeActive of the plugin's sample app
- React Native > Android > userEmails defaults to None
- React Native > iOS > Deeplink not working when app is in killed state and restorationHandler is nil
- React Native > Android & iOS DeepLinkResult inconsistencies
- React Native > add typescript declarations

## 6.4.40
Release date: *2021-December-12*

- React Native Plugin - add support for the setPartnerData API
- React Native > fix WARN new NativeEventEmitter() for RN 0.66
- React Native > Update native sdk to 6.4.4
- React Native > remove jCenter from build.gradle

## 6.4.0
- Android SDK 6.4.0
- iOS SDK 6.4.0
- new setSharingFilterForPartners api

## 6.3.50
- iOS SDK 6.3.5
- `setCurrentDeviceLanguage` api for iOS

## 6.3.20
### *Bug*
- RN Android >> Exception in UDL callback parsing
### *Technical Story*
- React Native > update native sdk to 6.3.2
- React Native > add Strict flag to Podfile

## 6.3.0
### *Technical Story*
- React Native > update native sdk to 6.3.0

## 6.2.60
- iOS SDK 6.2.6
- Remove get SKAD rules manually


## 6.2.42
- `isDebug` and `appId` optional validation
- Fix sendPushNotification api [Android]
- add types to `package.json`


## 6.2.41
- Fix SKAD rules


## 6.2.40
- iOS SDK 6.2.4
- Validate initSdk `isDebug` and `appId`


## 6.2.31
- Update readme for iOS 14.5
- Send a session manually on launch (Android)
- Add 'isDeferred' boolean in onDeepLinking


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
