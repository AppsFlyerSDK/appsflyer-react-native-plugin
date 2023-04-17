# Getting started
    
![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


## Deep Linking Types:
1. **Deferred Deep Linking** - Serving personalized content to new or former users, directly after the installation. 
2. **Direct Deep Linking** - Directly serving personalized content to existing users, which already have the mobile app installed.

** Unified deep linking (UDL) ** - an  API which enables you to send new and existing users to a specific in-app activity as soon as the app is opened.

For more info please check out the [OneLink™ Deep Linking Guide](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#Intro) and [developer guide](https://dev.appsflyer.com/hc/docs/getting-started-1).

---

#  Android Deeplink Setup
## Android Deeplink Setup(only for non-Expo projects)

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

#  iOS Deeplink Setup
## iOS Deeplink Setup(only for non-Expo projects)

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
For more on App Links check out the guide [here](https://dev.appsflyer.com/hc/docs/initial-setup-for-deep-linking-and-deferred-deep-linking#procedures-for-android-app-links).
