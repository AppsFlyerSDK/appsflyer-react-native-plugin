---
title: Deep linking integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 7
hidden: false
---

## Getting started
    
![Deep link intro](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png)

## Deep Linking Types
1. **Deferred Deep Linking** - Serving personalized content to new or former users, directly after the installation. 
2. **Direct Deep Linking** - Directly serving personalized content to existing users, which already have the mobile app installed.

**Unified deep linking (UDL)** - an API which enables you to send new and existing users to a specific in-app activity as soon as the app is opened.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro) and [developer guide](https://dev.appsflyer.com/hc/docs/dl_getting_started).

## Android Deeplink Setup

AppsFlyer SDK inspects activity intent object during onResume(). Because of that, for each activity that may be configured or launched with any [non-standard launch mode](https://developer.android.com/guide/topics/manifest/activity-element#lmode) please make sure to add the following code to `MainActivity.java` in `android/app/src/main/java/com...`:

```java
...
import android.content.Intent;
...
public class MainActivity extends ReactActivity {
...
    @Override
    public void onNewIntent(Intent intent) {
         super.onNewIntent(intent);
         setIntent(intent);
    }
 }
```

**Cold-start deep links**: The native SDK inspects the launch Intent only after `init()` completes. For cold-start deep links (app not running when link is clicked), re-deliver them via `Linking.getInitialURL()` and `appsFlyer.performDeepLinking()` inside `init().then()`:

```javascript
appsFlyer.init(devKey, appId)
  .then(async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      await appsFlyer.performDeepLinking(url, true);
    }
  });
```

### App Links
First, you need to generate SHA256 fingerprint, then add the following intent-filter to the relevant activity in your app’s manifest:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />

    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:host="onelink-basic-app.onelink.me"
        android:scheme="https" />
</intent-filter>
```
See the [guide](https://dev.appsflyer.com/hc/docs/dl_android_init_setup#procedures-for-android-app-links) for App Links setup.

### URI Scheme
A URI scheme is a URL that leads users directly to the mobile app. When an app user enters a URI scheme in a browser address bar or clicks on a link based on a URI scheme, the app launches and the user is deep-linked.

In your app’s manifest add the following intent-filter to your relevant activity:
```xml 
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data
        android:host="mainactivity"
        android:scheme="afshopapp" />
</intent-filter>
```
For URI Scheme setup, see the [guide](https://dev.appsflyer.com/hc/docs/dl_android_init_setup#procedures-for-uri-scheme).

##  iOS Deeplink Setup
In order to record retargeting and use the `registerDeepLinkListener`/UDL callback in iOS (`onAppOpenAttribution` was removed in 7.0.0 and merged into `onDeepLink`, which was later renamed to `registerDeepLinkListener` — see MIGRATION.md), the app needs to forward opened URLs / Universal Links / cold-start launch options to the native SDK. This is done entirely in your app's native **AppDelegate** — there is no JavaScript API for this (`handleOpenURL`/`handleOpenUrl`/`continueUserActivity`/`handleLaunchOptions` are not exposed by this plugin's JS surface):

```swift
import AppsFlyerLib
import react_native_appsflyer

// Open Universal Links
func application(
  _ application: UIApplication,
  continue userActivity: NSUserActivity,
  restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
) -> Bool {
  AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: nil)
  return true
}

func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey: Any] = [:]
) -> Bool {
  AppsFlyerAttribution.shared.handleOpen(url, options: options)
  return true
}

func application(_ application: UIApplication,
                  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  AppsFlyerLib.shared().handleLaunchOptions(launchOptions)
  // ... rest of your launch setup ...
  return true
}
```

`AppsFlyerLib` is already available as a transitive dependency of this plugin (via the vendored `AppsFlyerRPC` pod) — no extra `pod` entry is needed to `import AppsFlyerLib` in your own AppDelegate.

Route `continueUserActivity`/`handleOpen` through `AppsFlyerAttribution.shared` (exported by `react_native_appsflyer`), not `AppsFlyerLib.shared()` directly. A cold-start Universal Link reaches these AppDelegate callbacks before RN's JS thread has run `initSdk`, i.e. before `AppsFlyerLib` has a devKey/appId — calling it directly at that point can misfire the same way an early `registerDeepLinkListener` call does (see `known-issues-kb.md`). `AppsFlyerAttribution` buffers the call and replays it once `initSdk`'s native `init` RPC completes.

**Expo apps**: the `openURL`/`continueUserActivity` and `handleLaunchOptions` forwarding above is auto-injected into your generated AppDelegate by this plugin's config plugin at `expo prebuild` time (see [Expo Deep Link Integration](/Docs/RN_ExpoDeepLinkIntegration.md)) — you don't need to add it by hand for either ObjC or Swift AppDelegate templates.

### Universal Links
Universal Links link between an iOS mobile app and an associate website/domain, such as AppsFlyer’s OneLink domain (xxx.onelink.me). To do so, it is required to:

1. Configure OneLink sub-domain and link to mobile app (by hosting the ‘apple-app-site-association’ file - AppsFlyer takes care of this part in the onelink setup on your dashboard)
2. Configure the mobile app to register approved domains:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>com.apple.developer.associated-domains</key>
        <array>
            <string>applinks:test.onelink.me</string>
        </array>
    </dict>
</plist>
```

For more on Universal Links, check the [guide](https://dev.appsflyer.com/hc/docs/dl_ios_init_setup#procedures-for-ios-universal-links).

### URI Scheme
To configure it you will have to:

1. Add a unique url identifier in the URL types entry in the app's `info.plist`
2. Add URL Scheme as a value.

example of a URL scheme configuration in the `info.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  ...
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>YOUR.URL.IDENTIFIER</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>YOUR-URL-SCHEME</string>
			</array>
		</dict>
	</array>
	...
</dict>
</plist>
```

For URI Scheme configuration, see the [guide](https://dev.appsflyer.com/hc/docs/dl_ios_init_setup#procedures-for-uri-scheme).
