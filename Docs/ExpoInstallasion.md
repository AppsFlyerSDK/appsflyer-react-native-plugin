# 🚀 Integrate AppsFlyer into an Expo managed project
1. Install `expo-dev-client`:
```
expo install expo-dev-client
```
You can read more about expo development builds [here.](https://docs.expo.dev/development/introduction/)
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
If you are developing a kids app and you wish to use our strict mode, you should add `"shouldUseStrictMode": true` as followed:
```
...
"plugins": [
      [
        "react-native-appsflyer",{"shouldUseStrictMode": true}
      ]
    ],
...
```
