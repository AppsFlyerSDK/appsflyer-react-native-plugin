# Deep linking

- [Deep linking types and their implementation](#Deep-Linking)
- [Android and iOS set-up](#setup)


![alt text](https://massets.appsflyer.com/wp-content/uploads/2018/03/21101417/app-installed-Recovered.png "")


#### <a id="Deep-Linking"> The 3 Deep Linking Types:
Since users may or may not have the mobile app installed, there are 2 types of deep linking:

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
3. The SDK triggers the didResolveDeepLink method, and passes the deep link result object to the user.
4. The OnDeepLinkReceived method uses the deep link result object that includes the deep_link_value and other parameters to create the personalized experience for the users, which is the main goal of OneLink.

> Check out the Unified Deep Linking docs for [Android](https://dev.appsflyer.com/docs/android-unified-deep-linking) and [iOS](https://dev.appsflyer.com/docs/ios-unified-deep-linking).

Considerations:

* Requires AppsFlyer Android SDK V6.1.3 or later.
* Does not support SRN campaigns.
* Does not provide af_dp in the API response.
* onAppOpenAttribution will not be called. All code should migrate to `OnDeepLinkReceived`.

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
    
    
    
#### <a id="uri-scheme"> URI Scheme
In your app’s manifest add the following intent-filter to your relevant activity:
```xml 
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="your unique scheme" />
</intent-filter>
```

#### <a id="app-links"> App Links
For more on App Links check out the guide [here](https://support.appsflyer.com/hc/en-us/articles/115005314223-Deep-Linking-Users-with-Android-App-Links#what-are-android-app-links).


###  <a id="ios-deeplink"> iOS Deeplink Setup
For more on Universal Links check out the guide [here](https://support.appsflyer.com/hc/en-us/articles/208874366-OneLink-Deep-Linking-Guide#setups-universal-links).
    
Essentially, the Universal Links method links between an iOS mobile app and an associate website/domain, such as AppsFlyer’s OneLink domain (xxx.onelink.me). To do so, it is required to:

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
