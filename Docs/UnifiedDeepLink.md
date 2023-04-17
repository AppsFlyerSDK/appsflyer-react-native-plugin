### UDL flow

1. The SDK is triggered by:
   - **Deferred Deep Linking** - using a dedicated API
   - **Direct Deep Linking** - triggered by the OS via Android App Link, iOS Universal Links or URI scheme.
2. The SDK triggers the `OnDeepLink` listener, and passes the deep link result object to the user.
3. The `OnDeepLink` listener uses the deep link result object that includes the `deep_link_value` and other parameters to create the personalized experience for the users, which is the main goal of OneLink.

> Check out the Unified Deep Linking docs for [Android](https://dev.appsflyer.com/docs/android-unified-deep-linking) and [iOS](https://dev.appsflyer.com/docs/ios-unified-deep-linking).

### Considerations:

* Requires AppsFlyer Android SDK V6.1.3 or later.
* Does not support SRN campaigns.
* Does not provide af_dp in the API response.
* onAppOpenAttribution will not be called. All code should migrate to `onDeepLink`.

### Implementation:

___Important___  The code implementation for `onDeepLink` must be made **prior to the initialization** code of the SDK.

Example:

```javascript
const onDeepLinkCanceller = appsFlyer.onDeepLink(res => {
  if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const DLValue = res?.data.deep_link_value;
        const mediaSrc = res?.data.media_source;
        const deepLinkSub1 = res?.data.deep_link_sub1; // get up to 10 custom OneLink params
	
	[...]
	
	const deepLinkSub10 = res?.data.deep_link_sub10; // get up to 10 custom OneLink params
        console.log(JSON.stringify(res?.data, null, 2));
      }
})

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true // -->  you must set the onDeepLinkListener to true to get onDeepLink callbacks
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);
```
---
    
# <a id="setup"> Set-up

###  <a id="android-deeplink"> Android Deeplink Setup

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


###  <a id="ios-deeplink"> iOS Deeplink Setup
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
