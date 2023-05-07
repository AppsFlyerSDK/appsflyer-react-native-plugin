---
title: Deep linking integration
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 7
hidden: true
---

# Getting started
    
![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


## Deep Linking Types:
1. **Deferred Deep Linking** - Serving personalized content to new or former users, directly after the installation. 
2. **Direct Deep Linking** - Directly serving personalized content to existing users, which already have the mobile app installed.

** Unified deep linking (UDL) ** - an  API which enables you to send new and existing users to a specific in-app activity as soon as the app is opened.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro) and [developer guide](https://dev.appsflyer.com/hc/docs/getting-started-1).

---

## Android Deeplink Setup

AppsFlyer SDK inspects activity intent object during onResume(). Because of that, for each activity that may be configured or launched with any [non-standard launch mode](https://developer.android.com/guide/topics/manifest/activity-element#lmode) please make sure to add the following code to `MainActivity.java` in `android/app/src/main/java/com...`:
```
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

    
#### <a id="uri-scheme"> URI Scheme
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
For more on URI Scheme check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-for-deep-linking-and-deferred-deep-linking#deciding-on-a-uri-scheme).

#### <a id="app-links"> App Links
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
For more on App Links check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-for-deep-linking-and-deferred-deep-linking#procedures-for-android-app-links).

##  iOS Deeplink Setup
In order to record retargeting and use the onAppOpenAttribution/UDL callbacks in iOS,  the developer needs to pass the User Activity / URL to our SDK, via the following methods in the **AppDelegate.m** file:

#### import
```objectivec
#import <RNAppsFlyer.h>
```
```objectivec
// Deep linking
// Open URI-scheme for iOS 9 and above
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary *) options {
  [[AppsFlyerAttribution shared] handleOpenUrl:url options:options];
    return YES;
}
// Open URI-scheme for iOS 8 and below
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation {
  [[AppsFlyerAttribution shared] handleOpenUrl:url sourceApplication:sourceApplication annotation:annotation];
  return YES;
}
// Open Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler {
    [[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
    return YES;
}
```

#### Universal Links
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

For more on Universal Links check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-2#getting-the-app-bundle-id-and-prefix-id).

#### URI Scheme
A URI scheme is a URL that leads users directly to the mobile app.
When an app user enters a URI scheme in a browser address bar box, or clicks on a link based on a URI scheme, the app launches and the user is deep-linked.

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

For more on URI Scheme check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-2#procedures-for-uri-scheme).
