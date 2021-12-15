# Testing

More info about testing the SDK for marketers [here](https://support.appsflyer.com/hc/en-us/articles/360001559405-Test-mobile-SDK-integration-with-the-app#introduction).

- [Testing for iOS](#iOS)
- [Testing for Android](#Android)

First, you need to enable debug mode for full logs from the SDK.
To enable it, set the initialization object with `isDebug` as `true`:

```javascript
const option = {
  isDebug: true,
  appId: '78xXxXx35',
  devKey: 'UsxXxXxXxed',
  onInstallConversionDataListener: true,
  timeToWaitForATTUserAuthorization: 10,
  onDeepLinkListener: true,
};

appsFlyer.initSdk(option, null, null); // null can be functions for success or error handler
```

## <a id="iOS"> Testing for iOS
Open your ios project with XCode (`appName.xcworkspace`) and run it. In the logs section or in the console app, you will see logs related to AppsFlyer start with `[AppsFlyerSDK]`.<br>
Search for launch event that looks like this:
```
<~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~~+~>
<~+~   SEND Start:   https://launches.appsflyer.com/api/v6.4/iosevent?app_id=7xXxXxX1&buildnumber=6.4.4
<~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~+~~+~>
{ launch event payload } // Just an example of a JSON. you will see the full payload
```
and also:
```
Result: {
    data = {length = 64, bytes = 0x7b226f6c 5f696422 3a224476 5769222c ... 696e6b2e 6d65227d };
    dataStr = "{\"oxXxXxd\":\"DXxXxi\",\"oXxXer\":ss,\"olXxXxain\":\"xXxXxXx\"}";
    retries = 2;
    statusCode = 200; // ~~> success!
    taskIdentifier = 4;
}
```
For more iOS integration tests, see [Here](https://dev.appsflyer.com/hc/docs/testing-ios)

## <a id="Android"> Testing for Android
Open your Android project with Android studio (`android` folder) and run it. In the logs section (adb), you will see logs related to AppsFlyer start with `I/AppsFlyer_x.x.x`.<br>
Search for launch event that looks like this:
```
I/AppsFlyer_6.4.3: url: https://launches.appsflyer.com/api/v6.4/androidevent?app_id=com.aXxXxt.rxXxXxt&buildnumber=6.4.3
I/AppsFlyer_6.4.3: data: { launch event payload } // Just an example of a JSON. you will see the full payload
```
and also:
```
I/AppsFlyer_6.4.3: response code: 200 // ~~> success!
```
For more Android integration tests, see [Here](https://dev.appsflyer.com/hc/docs/testing-android)