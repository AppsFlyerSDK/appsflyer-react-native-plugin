# Deep linking

Deep Linking vs Deferred Deep Linking:

A deep link is a special URL that routes to a specific spot, whether that’s on a website or in an app. A “mobile deep link” then, is a link that contains all the information needed to take a user directly into an app or a particular location within an app instead of just launching the app’s home page.

If the app is installed on the user's device - the deep link routes them to the correct location in the app. But what if the app isn't installed? This is where Deferred Deep Linking is used.When the app isn't installed, clicking on the link routes the user to the store to download the app. Deferred Deep linking defer or delay the deep linking process until after the app has been downloaded, and ensures that after they install, the user gets to the right location in the app.

[Android and iOS set-up](#setup)

![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


#### <a id="Deep-Linking"> The 3 Deep Linking Types:
Since users may or may not have the mobile app installed, there are 3 types of deep linking:

1. Deferred Deep Linking - Serving personalized content to new or former users, directly after the installation. 
2. Direct Deep Linking - Directly serving personalized content to existing users, which already have the mobile app installed.
3. Starting from v6.1.3, the new Unified Deep Linking API is available to handle deeplinking logic.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro).

###  <a id="deferred-deep-linking"> 1. Deferred Deep Linking (Get Conversion Data)

Check out the deferred deeplinkg guide from the AppFlyer knowledge base [here](https://support.appsflyer.com/hc/en-us/articles/207032096-Accessing-AppsFlyer-Attribution-Conversion-Data-from-the-SDK-Deferred-Deeplinking-#Introduction).

Code Sample to handle the conversion data:


```javascript
const onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (res) => {
    const isFirstLaunch = res?.data?.is_first_launch;

    if (isFirstLaunch && JSON.parse(isFirstLaunch) === true) {
      if (res.data.af_status === 'Non-organic') {
        const media_source = res.data.media_source;
        const campaign = res.data.campaign;
        alert('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
      } else if (res.data.af_status === 'Organic') {
        alert('This is first launch and a Organic Install');
      }
    } else {
      alert('This is not first launch');
    }
  }
);

appsFlyer.initSdk(/*...*/);
```
**Note:** The code implementation for `onInstallConversionData` must be made **prior to the initialization** code of the SDK.

<hr/>

**Important**

The `appsFlyer.onInstallConversionData` returns function to  unregister this event listener. If you want to remove the listener for any reason (Component unmount), you can simply call `onInstallConversionDataCanceller()`. This function will call `NativeAppEventEmitter.remove()`.

<hr/>

###  <a id="handle-deeplinking"> 2. Direct Deeplinking
    
When a deeplink is clicked on the device the AppsFlyer SDK will return the resolved link in the [onAppOpenAttribution](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#deep-linking-data-the-onappopenattribution-method-) method.

Code Sample to handle OnAppOpenAttribution:

```javascript
const onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
        console.log(`status: ${res.status}`);
        console.log(`campaign: ${res.data.campaign}`);
        console.log(`af_dp: ${res.data.af_dp}`);
        console.log(`link: ${res.data.link}`);
        console.log(`DL value: ${res.data.deep_link_value}`);
        console.log(`media source: ${res.data.media_source}`);
});

appsFlyer.initSdk(/*...*/);
```
**Note:** The code implementation for `onAppOpenAttribution` must be made **prior to the initialization** code of the SDK.

<hr/>

**Important**

The `appsFlyer.onAppOpenAttribution` returns function to  unregister this event listener. If you want to remove the listener for any reason (Component unmount), you can simply call `onAppOpenAttributionCanceller()`. This function will call `NativeAppEventEmitter.remove()`.

<hr/>

###  <a id="unified-deeplinking"> 3. Unified deep linking

The flow works as follows:

1. User clicks the OneLink short URL.
2. The iOS Universal Links/ Android App Links (for deep linking) or the deferred deep link, trigger the SDK.
3. The SDK triggers the onDeepLink listener, and passes the deep link result object to the user.
4. The onDeepLink listener uses the deep link result object that includes the deep_link_value and other parameters to create the personalized experience for the users, which is the main goal of OneLink.

> Check out the Unified Deep Linking docs for [Android](https://dev.appsflyer.com/hc/docs/unified-deep-linking-udl) and [iOS](https://dev.appsflyer.com/hc/docs/unified-deep-linking-udl-1).

Considerations:

* Requires AppsFlyer Android SDK V6.1.3 or later.
* Does not support SRN campaigns.
* Does not provide af_dp in the API response.
* onAppOpenAttribution will not be called. All code should migrate to `onDeepLink`.

Implementation:

* The code implementation for `onDeepLink` must be made **prior to the initialization** code of the SDK.

Example:

```javascript
const onDeepLinkCanceller = appsFlyer.onDeepLink(res => {
  if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const DLValue = res?.data.deep_link_value;
        const mediaSrc = res?.data.media_source;
        const param1 = res?.data.af_sub1;
        console.log(JSON.stringify(res?.data, null, 2));
      }
})

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
    onInstallConversionDataListener: true,
    onDeepLinkListener: true
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
