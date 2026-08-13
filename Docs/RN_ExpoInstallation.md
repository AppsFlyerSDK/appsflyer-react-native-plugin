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

4. ___optional___ If you are developing a kids app and you wish to use our strict mode, you should add `"shouldUseStrictMode": true` as followed:
```
...
"plugins": [
      [
        "react-native-appsflyer",{"shouldUseStrictMode": true}
      ]
    ],
...
```
### Automatic iOS AppDelegate integration

Running `expo prebuild` with the plugin installed automatically modifies your `AppDelegate` (both
the Swift template used by Expo SDK 52+ and the legacy Objective-C template) to wire up deep
linking and attribution. You do not need to add these calls yourself. The plugin injects:

- `AppsFlyerLib.shared().handleLaunchOptions(launchOptions)` in `didFinishLaunchingWithOptions`
- `AppsFlyerLib.shared().handleOpen(url, options:)` in the `openURL` method
- `AppsFlyerLib.shared().continue(userActivity, restorationHandler:)` in the `continueUserActivity` method

This only works if your `AppDelegate` matches the Expo SDK default template. If the plugin logs a warning during `expo prebuild`, add the three calls above manually.

To verify the injection landed, after `expo prebuild --clean`:
```bash
grep -n "AppsFlyerLib" ios/*/AppDelegate.swift   # or AppDelegate.m/.mm for the ObjC template
```

### Backup Rules Configuration (Android)

The AppsFlyer SDK includes built-in backup rules in its Android manifest to ensure accurate install/reinstall detection. By default, the plugin respects your app's backup rules and does not modify them.

**Default Behavior** (`preferAppsFlyerBackupRules: false` or omitted):
- Your app's `android:dataExtractionRules` and `android:fullBackupContent` attributes are left untouched
- You maintain full control over your app's backup policy
- No manifest merge conflicts occur

**Opt-in Behavior** (`preferAppsFlyerBackupRules: true`):
- If your app defines backup rules, they will be removed to let AppsFlyer SDK's built-in rules take precedence
- This ensures AppsFlyer SDK's backup rules are used, which may improve install/reinstall detection accuracy
- Use this flag if you want AppsFlyer SDK to manage backup rules for you

**When to use `preferAppsFlyerBackupRules: true`:**
- You want AppsFlyer SDK to handle backup rules automatically
- You're experiencing issues with install/reinstall detection that may be related to backup rules
- You don't have specific backup requirements for your app

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

### Handling dataExtractionRules Conflict

This conflict is now handled automatically — see the `preferAppsFlyerBackupRules` option in the Backup Rules Configuration section above.

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
