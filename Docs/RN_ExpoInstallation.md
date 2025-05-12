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
        "react-native-appsflyer",{}
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
### Fix for build failure with RN 0.76 and Expo 52
To ensure seamless integration of the AppsFlyer plugin in your Expo-managed project, it’s essential to handle modifications to the AndroidManifest.xml correctly. Since direct edits to the AndroidManifest.xml aren’t feasible in the managed workflow, you’ll need to create a custom configuration to include the necessary changes.

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
