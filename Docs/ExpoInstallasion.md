# Install AppsFlyer in an Expo managed project
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
## The AD_ID permission for android apps
In v6.8.0 of the AppsFlyer SDK, we added the normal permission com.google.android.gms.permission.AD_ID to the SDK's AndroidManifest, 
to allow the SDK to collect the Android Advertising ID on apps targeting API 33.
If your app is targeting children, you need to revoke this permission to comply with Google's Data policy.
You can read more about it [here](https://docs.expo.dev/guides/permissions/#android).
