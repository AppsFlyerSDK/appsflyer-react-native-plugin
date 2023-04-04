
# Getting started

    
![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


## Deep Linking Types:
1. **Deferred Deep Linking** - Serving personalized content to new or former users, directly after the installation. 
2. **Direct Deep Linking** - Directly serving personalized content to existing users, which already have the mobile app installed.

** Unified deep linking (UDL) ** - an  API which enables you to send new and existing users to a specific in-app activity as soon as the app is opened.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro) and [developer guide](https://dev.appsflyer.com/hc/docs/getting-started-1).

---
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
        {"shouldUseStrictMode": true} // <<-- only for strict mode
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
              "host": "expotest.onelink.me", // <<-- important for android App Links
              "pathPrefix": "/DvWi" // <<-- set your onelink template id
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