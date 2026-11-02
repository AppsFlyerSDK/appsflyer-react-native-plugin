---
title: Expo Installation
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 2
hidden: false
---

## Install AppsFlyer in an Expo managed project

**Prerequisite:** react-native-appsflyer 7.0.0+ requires React Native ≥ 0.76 with the New Architecture (TurboModules) enabled — see [Installation](RN_Installation.md). On Expo, that means SDK 52+ with a development build (New Architecture is on by default from SDK 52).

1. Install `expo-dev-client`. You can read more about expo development builds [here](https://docs.expo.dev/development/introduction/):
```
expo install expo-dev-client
```

2. Install react-native-appsflyer:
```
expo install react-native-appsflyer
```

3. Add `react-native-appsflyer` into the `plugins` array inside the `app.json` file of your app:
```
...
"plugins": [
      [
        "react-native-appsflyer",
        {
          "shouldUseStrictMode": false,          // optional – kids-apps strict mode
          "shouldUsePurchaseConnector": true,    // optional – enables Purchase Connector
          "preferAppsFlyerBackupRules": false    // optional – use AppsFlyer SDK backup rules (default: false)
        }
      ]
    ],
...
```

4. ___optional___ (iOS only) If you want SKAdNetwork postbacks sent to AppsFlyer, add `NSAdvertisingAttributionReportEndpoint` under the top-level `expo` object in `app.json`. The plugin does **not** set this key for you. Merge carefully if `NSAdvertisingAttributionReportEndpoint` is already present — this value overwrites it:
```
"ios": {
  "infoPlist": {
    "NSAdvertisingAttributionReportEndpoint": "https://appsflyer-skadnetwork.com/"
  }
}
```

### Automatic iOS AppDelegate integration

Running `expo prebuild` with the plugin installed automatically modifies your `AppDelegate` (both
the Swift templates used by Expo SDK 54, 57, and 58, and the legacy Objective-C template) to wire up deep
linking and attribution. You do not need to add these calls yourself. The plugin injects, all via
`AppsFlyerAttribution.shared` (one import: `react_native_appsflyer`):

- `AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)` in `didFinishLaunchingWithOptions`
- `AppsFlyerAttribution.shared.handleOpen(url, options: options)` in the `openURL` method
- `AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: nil)` in the `continueUserActivity` method

On Expo SDK 54 and 57, the plugin adds these calls to the methods that already exist.
On Expo SDK 58, the template can omit `openURL` and `continueUserActivity`.
Then the plugin creates those overrides, calls `super`, and adds the AppsFlyer calls.

This works only if your `AppDelegate` matches the Expo SDK default template.
If the plugin can't add all three calls, it logs a warning during `expo prebuild`.
Add the three calls above by hand when you see that warning.

To verify the injection landed, after `expo prebuild --clean`:
```bash
grep -n "AppsFlyerAttribution" ios/*/AppDelegate.swift   # expect 3 calls; or AppDelegate.m/.mm for ObjC
```

### Backup Rules Configuration (Android)

The AppsFlyer SDK includes built-in backup rules in its Android manifest to ensure accurate install/reinstall detection. By default, the plugin respects your app's backup rules and does not modify them.

**Default Behavior** (`preferAppsFlyerBackupRules: false` or omitted):
- Your app's `android:dataExtractionRules` and `android:fullBackupContent` attributes are left untouched
- You maintain full control over your app's backup policy
- If your app or another plugin (for example `expo-secure-store`) sets these attributes, the merge with the AppsFlyer SDK manifest can conflict; set `preferAppsFlyerBackupRules: true` to resolve it

**Opt-in Behavior** (`preferAppsFlyerBackupRules: true`):
- If your app defines backup rules, they will be removed to let AppsFlyer SDK's built-in rules take precedence
- Matching entries in the `<application>` tag's `tools:replace` are removed too, so no stale entry is left behind
- This ensures AppsFlyer SDK's backup rules are used, which may improve install/reinstall detection accuracy
- Use this flag if you want AppsFlyer SDK to manage backup rules for you
- List `react-native-appsflyer` **before** any plugin that adds backup attributes (for example `expo-secure-store`) — see [Plugin order](#plugin-order)

**Example configuration:**
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-appsflyer",
        {
          "preferAppsFlyerBackupRules": true
        }
      ]
    ]
  }
}
```

#### Plugin order

Expo applies manifest changes in the reverse order of the `plugins` array. A plugin listed later runs first. If `react-native-appsflyer` is listed after the plugin that adds the backup attributes, its change runs first and finds nothing to remove. `preferAppsFlyerBackupRules` then warns via Expo's `WarningAggregator`.

```json
"plugins": [
  ["react-native-appsflyer", { "preferAppsFlyerBackupRules": true }],
  "expo-secure-store"
]
```

## The AD_ID permission for android apps
In v6.8.0 of the AppsFlyer SDK, we added the normal permission com.google.android.gms.permission.AD_ID to the SDK's AndroidManifest, 
to allow the SDK to collect the Android Advertising ID on apps targeting API 33.
If your app is targeting children, you need to revoke this permission to comply with Google's Data policy.
You can read more about it [here](https://docs.expo.dev/guides/permissions/#android).

### Purchase Connector (optional)

Setting `"shouldUsePurchaseConnector": true` will:

* **iOS** – add the `PurchaseConnector` CocoaPod automatically  
* **Android** – add `appsflyer.enable_purchase_connector=true` to `gradle.properties`

### Plugin Options Summary

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| `shouldUseStrictMode` | boolean | `false` | Enable strict mode for kids apps |
| `shouldUsePurchaseConnector` | boolean | `false` | Enable Purchase Connector support |
| `preferAppsFlyerBackupRules` | boolean | `false` | Remove app's backup rules to use AppsFlyer SDK's built-in rules (Android only) |
