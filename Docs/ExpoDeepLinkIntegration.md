### In order to use AppsFlyer's deeplinks you need to configure intent filters/scheme/associatedDomains as described in [Expo's guide](https://docs.expo.dev/guides/linking/#universal-links-on-ios).

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