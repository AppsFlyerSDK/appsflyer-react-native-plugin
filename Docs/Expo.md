# 🚀 Integrate AppsFlyer into an Expo managed project
1. Install `expo-dev-client`:
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
4. In order to use AppsFlyer's deeplinks you need to configure intent filters/scheme/associatedDomains as described in [Expo's guide](https://docs.expo.dev/guides/linking/#universal-links-on-ios).

### Full app.json example
```
{
  "expo": {
    "name": "expoAppsFlyer",
    "slug": "expoAppsFlyer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/atom.png",
    "plugins": [
      [
        "react-native-appsflyer",
        {"shouldUseStrictMode": true} // <<-- for strict mode
      ]
    ],
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "scheme": "my-own-scheme", // <<-- uri scheme as configured on AF dashboard
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.appsflyer.expoaftest",
      "associatedDomains": ["applinks:expotest.onelink.me"] // <<-- important in order to use universal links
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
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
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        },
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "my-own-scheme" // <<-- uri scheme as configured on AF dashboard
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}

```
