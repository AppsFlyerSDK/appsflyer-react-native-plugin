---
title: Expo Deep linking integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 8
hidden: false
---

## Getting started

See [Deep Linking Integration](RN_DeepLinkIntegrate.md) for concepts — this doc covers Expo-specific wiring only.

## Implementation for Expo

1. **App.json configuration:** Configure intent filters, URI scheme, and associated domains as described in [Expo's guide](https://docs.expo.dev/guides/linking/#universal-links-on-ios). See the Full app.json example below.

2. **iOS AppDelegate wiring:** The Expo config plugin automatically injects the required AppsFlyer deep-link handlers into your app's AppDelegate at `expo prebuild` time. For both ObjC and Swift templates, it adds:
   - `AppsFlyerLib.shared().handleOpen(url:options:)` into `openURL`
   - `AppsFlyerLib.shared().continue(userActivity:restorationHandler:)` into `continueUserActivity` (forwarding the real `restorationHandler`)
   - `AppsFlyerLib.shared().handleLaunchOptions(launchOptions)` into `didFinishLaunchingWithOptions`
   
   See [Expo Installation](RN_ExpoInstallation.md) for full details.

3. **Android deep-link handling:** You must add `setIntent()` inside the `onNewIntent` method as described [here](https://dev.appsflyer.com/hc/docs/rn_deeplinkintegrate#android-deeplink-setup). This plugin does not add this code automatically, so implement it **manually or with a [custom config plugin](https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/#4-creating-a-new-config-plugin)**.

## Deep linking configuration

The following app.json snippet shows the deep-linking-specific configuration. For the full list of plugin configuration options, see [Expo Installation](RN_ExpoInstallation.md).

```json
{
  "expo": {
    "plugins": [
      "react-native-appsflyer"
    ],
    "scheme": "my-own-scheme",
    "ios": {
      "bundleIdentifier": "com.appsflyer.expoaftest",
      "associatedDomains": ["applinks:expotest.onelink.me"]
    },
    "android": {
      "package": "com.af.expotest",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "expotest.onelink.me",
              "pathPrefix": "/DvWi"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        },
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "my-own-scheme"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```
