This guide explains how to implement AppsFlyer's push notification feature with deep linking in your React Native application.

## Overview

AppsFlyer's push notification feature enables you to:

- Measure push notification campaigns
- Handle deep links from push notifications
- Measure conversion attribution from push campaigns

**There are 2 methods of implementing push notification integration:**

1. **OneLink Method**  - Uses OneLink URLs in the push payload
2. **JSON Method** - Uses plain JSON structure in the push payload

Choose the method based on how your marketing team structures the push notifications.

## Prerequisites

- AppsFlyer React Native SDK installed and configured
- A push notification provider (Firebase, OneSignal, etc.)
- Basic AppsFlyer SDK implementation (init, start, attribution, deep linking)

## Method 1: OneLink Method

This method uses OneLink URLs embedded in the push notification payload.

### Required Parameters

The OneLink must contain at least these 3 parameters:

- `pid` - Media source identifier
- `is_retargeting=true` - Indicates this is a re-engagement
- `c` - Campaign name

### Push Payload Structure

```json
{
  "data": {
    "message": "push message",
    "af_push_link": "https://yourapp.onelink.me/ABC123/campaign?pid=push_campaign&is_retargeting=true&c=holiday_sale"
  }
}
```

Or with nested structure:

```json
{
  "data": {
    "message": "push message",
    "appsflyer": {
      "testing": {
        "link": "https://yourapp.onelink.me/ABC123/campaign?pid=push_campaign&is_retargeting=true&c=holiday_sale"
      }
    }
  }
}
```

### Implementation Steps

### 1. Set Up Listeners and Push Configuration

**Important:** Set up all listeners and push configuration BEFORE initializing the SDK:

```jsx
import appsFlyer from 'react-native-appsflyer';

// 1. Handle conversions and attribution (BEFORE init)
appsFlyer.onInstallConversionData((data) => {
  console.log('Install conversion data:', data);
});

// 2. Handle deep links (BEFORE init)
appsFlyer.onDeepLink((data) => {
  console.log('Deep link data:', data);
});

// 3. Configure push notification deep link path (BEFORE init)
// For simple structure: ["af_push_link"]
// For nested structure: ["data", "appsflyer", "testing", "link"]
appsFlyer.addPushNotificationDeepLinkPath(
  ['af_push_link'], // Adjust based on your payload structure
  (success) => {
    console.log('Push notification path added successfully:', success);
  },
  (error) => {
    console.error('Error adding push notification path:', error);
  }
);
```

**Parameters for `addPushNotificationDeepLinkPath`:**

- `path`: Array of keys used to resolve the OneLink from push notification payload
- `successCallback`: Called when the path is successfully added
- `errorCallback`: Called if there's an error adding the path

### 2. Initialize and Start AppsFlyer SDK

After setting up all listeners and configurations, initialize and start the SDK:

```jsx
// Initialize AppsFlyer (AFTER setting up listeners)
appsFlyer.initSdk({
  devKey: 'YOUR_DEV_KEY',
  isDebug: true,
  appId: 'YOUR_APP_ID', // iOS only
});

// Start AppsFlyer (AFTER init)
appsFlyer.startSdk();
```

**Parameters:**

- `path`: Array of keys used to resolve the deep link from push notification payload
- `successCallback`: Called when the path is successfully added
- `errorCallback`: Called if there's an error adding the path

### 3. Handle Push Notification Data

In your push notification provider callback (where you receive the notification payload), send the data to AppsFlyer:

```jsx
// Example with Firebase messaging
import messaging from '@react-native-firebase/messaging';

// Background/Quit state messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message:', remoteMessage);

  // Send push payload to AppsFlyer
  appsFlyer.sendPushNotificationData(
    remoteMessage.data, // The push notification payload
    (error) => {
      console.error('Error sending push data to AppsFlyer:', error);
    }
  );
});

// Foreground messages
messaging().onMessage(async (remoteMessage) => {
  console.log('Foreground message:', remoteMessage);

  // Send push payload to AppsFlyer
  appsFlyer.sendPushNotificationData(
    remoteMessage.data,
    (error) => {
      console.error('Error sending push data to AppsFlyer:', error);
    }
  );
});

// Handle notification opened from background/quit state
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log('Notification opened:', remoteMessage);

  // Send push payload to AppsFlyer
  appsFlyer.sendPushNotificationData(
    remoteMessage.data,
    (error) => {
      console.error('Error sending push data to AppsFlyer:', error);
    }
  );
})
```

## Method 2: JSON Method

This method uses a plain JSON structure in the push notification payload.

### Required Parameters

The `af` object must contain at least these 3 parameters:

- `pid` - Media source identifier
- `is_retargeting: "true"` - Indicates this is a re-engagement (must be string "true")
- `c` - Campaign name

### Push Payload Structure

The `af` object **must** be at the top level of the `data` object:

```json
{
  "data": {
    "message": "push message",
    "af": {
      "pid": "push_campaign",
      "is_retargeting": "true",
      "c": "holiday_sale"
    }
  }
}
```

**❌ Invalid Structure (nested af object):**

```json
{
  "data": {
    "message": "push message",
    "appsflyer_data": {
      "af": {
        "pid": "push_campaign",
        "is_retargeting": "true",
        "c": "holiday_sale"
      }
    }
  }
}
```

### Implementation Steps

For the JSON Legacy Method, you only need steps 1, 2, and 3 from the OneLink method above, but **skip the `addPushNotificationDeepLinkPath` call**:

```jsx
// 1. Set up listeners (BEFORE init)
appsFlyer.onInstallConversionData((data) => {
  console.log('Install conversion data:', data);
});

appsFlyer.onDeepLink((data) => {
  console.log('Deep link data:', data);
});

// 2. Initialize and start SDK
appsFlyer.initSdk({
  devKey: 'YOUR_DEV_KEY',
  isDebug: true,
  appId: 'YOUR_APP_ID',
});

appsFlyer.startSdk();

// 3. Handle push data the same way
// The SDK will automatically detect the 'af' object in the payload
```

## Complete Integration Examples

```jsx
import React, { useEffect } from 'react';
import appsFlyer from 'react-native-appsflyer';
import messaging from '@react-native-firebase/messaging';

const AppsflyerPushIntegration = () => {
  useEffect(() => {
    // 1. Set up attribution and deep link handlers (BEFORE init)
    appsFlyer.onInstallConversionData((data) => {
      console.log('Conversion data:', data);
    });

    appsFlyer.onDeepLink((data) => {
      console.log('Deep link:', data);
    });

    // 2. Configure push notification deep link path (BEFORE init)
    appsFlyer.addPushNotificationDeepLinkPath(
      ['af_push_link'], // Adjust based on your payload structure
      (success) => console.log('Push path configured'),
      (error) => console.error('Push path error:', error)
    );

    // 3. Initialize AppsFlyer SDK (AFTER listeners and config)
    appsFlyer.initSdk({
      devKey: 'YOUR_DEV_KEY',
      isDebug: true,
      appId: 'YOUR_APP_ID',
    });

    // 4. Start AppsFlyer (AFTER init)
    appsFlyer.startSdk();

    // 5. Set up push notification handlers
    const handlePushData = (payload) => {
      appsFlyer.sendPushNotificationData(
        payload,
        (error) => console.error('Push data error:', error)
      );
    };

    // Background messages
    messaging().setBackgroundMessageHandler(async (message) => {
      handlePushData(message.data);
    });

    // Foreground messages
    const unsubscribe = messaging().onMessage(async (message) => {
      handlePushData(message.data);
    });

    // Notification opened from background
    messaging().onNotificationOpenedApp((message) => {
      handlePushData(message.data);
    });

  }, []);

  return null; // This is just a setup component
};

export default AppsflyerPushIntegration;
```

## Important Notes

### Payload Processing

- **OneLink Method**: SDK processes the OneLink URL and extracts deep link data
- **JSON Method**: SDK automatically appends `isPush: "true"` parameter to indicate the deep link came from push

## Debugging & Testing

### Expected Debug Logs

**OneLink Method:**

```
UniversalLink/Deeplink found: https://yourapp.onelink.me/...
```

**JSON Legacy Method:**

```
Push Notification received af payload = {"c":"campaign_name", "is_retargeting":"true", "pid":"media_source"}
```

### Session Payload Examples

**OneLink Method** - Look for:

```json
{
  "af_deeplink": "https://yourapp.onelink.me/...",
  "meta": {
    "payloadKey": [["af_push_link"]]
  }
}
```

**JSON Legacy Method** - Look for:

```json
{
  "af_deeplink": "{\"c\":\"campaign_name\",\"is_retargeting\":\"true\",\"pid\":\"media_source\",\"isPush\":\"true\"}"
}
```

## Troubleshooting

### Common Issues

**OneLink Method:**

- **Deep links not working**: Verify the key path in `addPushNotificationDeepLinkPath` matches your payload structure
- **OneLink not detected**: Ensure the OneLink contains required parameters (pid, is_retargeting=true, c)
- **Payload not processed**: Check that `addPushNotificationDeepLinkPath` is called before `initSdk`

**JSON Method:**

- **Re-engagement not recorded**: Verify the `af` object is at the top level of `data`, not nested
- **Missing parameters**: Ensure `pid`, `is_retargeting: "true"`, and `c` are all present
- **Wrong data types**: `is_retargeting` must be string "true", not boolean

**General Issues:**

- **Android crashes**: Verify app activity is available when calling `sendPushNotificationData`
- **Listeners not firing**: Ensure all listeners are set up before calling `initSdk` and `startSdk`
- **Duplicate processing**: SDK prevents duplicate processing of the same payload in the same cold launch

## Resources

- [AppsFlyer Push Notification Campaigns](https://support.appsflyer.com/hc/en-us/articles/207034486)
- [React Native SDK Documentation](https://dev.appsflyer.com/hc/docs/react-native-plugin)
- [Deep Link Integration Guide](https://dev.appsflyer.com/hc/docs/react-native-plugin#deep-linking)