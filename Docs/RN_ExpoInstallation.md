---
title: Expo Installation
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 2
hidden: false
---

## Install AppsFlyer in an Expo managed project
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
4. ___optional___ If you want SKAdNetwork tracking, add AppsFlyer postbacks to the infoPlist configuration
5. ```
   ios: {
     infoPlist: {
       NSAdvertisingAttributionReportEndpoint:'https://appsflyer-skadnetwork.com/',
     }
   }
   ```
6. ___optional___ If you are developing a kids app and you wish to use our strict mode, you should add `"shouldUseStrictMode": true` as followed:
```
...
"plugins": [
      [
        "react-native-appsflyer",{"shouldUseStrictMode": true}
      ]
    ],
...
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

When building your Expo app with the AppsFlyer plugin, you might encounter a build error related to the `dataExtractionRules` attribute. This issue arises due to a conflict between the `dataExtractionRules `defined in your project’s `AndroidManifest.xml` and the one included in the AppsFlyer SDK.

<b>Solution:</b> Creating a Custom Plugin to Modify `AndroidManifest.xml`

To resolve this, you can create a custom Expo config plugin that modifies the AndroidManifest.xml during the build process. This approach allows you to adjust the manifest without directly editing it, maintaining compatibility with the managed workflow.

Steps to Implement the Custom Plugin:
1. Create the Plugin File:
    -	In your project’s root directory, create a file named withCustomAndroidManifest.js.
2.	Define the Plugin Function:
	  -	In withCustomAndroidManifest.js, define a function that uses Expo’s withAndroidManifest to modify the manifest. This function will remove the conflicting dataExtractionRules attribute.

```js
// withCustomAndroidManifest.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;
    
    // Ensure xmlns:tools is present in the <manifest> tag
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = manifest.application[0];

    // Add tools:replace attribute for dataExtractionRules and fullBackupContent
    application['$']['tools:replace'] = 'android:dataExtractionRules, android:fullBackupContent';

    // Set dataExtractionRules and fullBackupContent as attributes within <application>
    application['$']['android:dataExtractionRules'] = '@xml/secure_store_data_extraction_rules';
    application['$']['android:fullBackupContent'] = '@xml/secure_store_backup_rules';

    return config;
  });
};

```

3.	Update app.json or app.config.js:
	  -	In your app configuration file, include the custom plugin to ensure it’s executed during the build process.

```json
// app.json
{
  "expo": {
    // ... other configurations ...
    "plugins": [
      "./withCustomAndroidManifest.js",
      [
        "react-native-appsflyer",
        {
          "shouldUseStrictMode": true
        }
      ]
    ]
  }
}
```

By implementing this custom plugin, you can resolve the dataExtractionRules conflict without directly modifying the AndroidManifest.xml.

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
