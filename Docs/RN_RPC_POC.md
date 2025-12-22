# AppsFlyer React Native Plugin - RPC Integration POC

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Event Handling](#event-handling)
- [Error Handling](#error-handling)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [Migration from Direct SDK](#migration-from-direct-sdk)

## Overview

The AppsFlyer RPC (Remote Procedure Call) integration provides a unified JSON-based interface to the AppsFlyer iOS SDK through TurboModules. This POC implementation follows the Flutter plugin pattern with a singleton class and internal callback routing.

### Key Features

- ✅ **Singleton Pattern**: Access via `AppsFlyerRPC.instance`
- ✅ **TurboModules**: Modern React Native architecture
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Event System**: Internal callback routing for SDK events
- ✅ **iOS Support**: Full RPC implementation
- ⏳ **Android Support**: Coming in future release

### Why RPC?

- **Unified Interface**: Single JSON-based API across all platforms
- **Maintainability**: Centralized SDK logic in RPC layer
- **Consistency**: Same API patterns across Flutter, React Native, Unity, etc.
- **Future-Proof**: Built on modern React Native TurboModules

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    JavaScript Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  AppsFlyerRPC Singleton                            │     │
│  │  - Public API Methods                              │     │
│  │  - Internal Callback Storage                       │     │
│  │  - Event Handler Routing                           │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   TurboModule Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  NativeAppsFlyerRPC (Spec)                         │     │
│  │  - executeJson(jsonRequest): Promise<string>       │     │
│  │  - Event Emitter (onEvent)                         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    iOS Native Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  RNAppsFlyerRPC (Swift)                            │     │
│  │  - Bridges JS ↔ AppsFlyerRPCBridge                │     │
│  │  - Forwards events to JS                           │     │
│  └────────────────────────────────────────────────────┘     │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  AppsFlyerRPCBridge                                │     │
│  │  - executeJson() → RPC Request Handler            │     │
│  │  - setEventHandler() → Event Forwarding           │     │
│  └────────────────────────────────────────────────────┘     │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  AppsFlyer iOS SDK                                 │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **JS calls method**: `AppsFlyerRPC.instance.initialize({ devKey, appId })`
2. **Build RPC request**: `{ id: "init-123", method: "init", params: {...} }`
3. **Serialize to JSON**: `JSON.stringify(request)`
4. **Call TurboModule**: `NativeAppsFlyerRPC.executeJson(jsonRequest)`
5. **Swift forwards to RPC Bridge**: `AppsFlyerRPCBridge.shared.executeJson(...)`
6. **RPC processes request**: Validates, routes to handler, calls SDK
7. **Build RPC response**: `{ id: "init-123", result: {...} }` or `{ id: "init-123", error: {...} }`
8. **Return JSON to JS**: Promise resolves with JSON string
9. **Parse and handle**: Check for errors, return result

### Event Flow

1. **SDK fires event**: Attribution data received
2. **RPC Bridge captures**: Via delegate methods
3. **Build event JSON**: `{ event: "onConversionDataSuccess", data: {...} }`
4. **Forward to Swift**: Via `setEventHandler` callback
5. **Swift emits to JS**: `sendEvent(withName: "onEvent", body: eventDict)`
6. **JS EventEmitter receives**: `NativeEventEmitter.addListener('onEvent', ...)`
7. **Route to callback**: `AppsFlyerRPC.instance.#handleEvent()`
8. **Call user callback**: `onConversionDataSuccessCallback?.(data)`

## Setup & Installation

### Prerequisites

- React Native 0.62.0 or higher
- iOS 13.0+ (for RPC support)
- Xcode 15.0+
- Swift 5.9+
- AppsFlyerFramework 6.0+
- AppsFlyerRPC framework (local)

### Installation Steps

#### 1. Set AppsFlyerRPC Path

The RPC framework is currently local. Set the path in your environment:

**Option A: In Podfile**

```ruby
# At the top of ios/Podfile
ENV['APPSFLYER_RPC_PATH'] = '/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC'
```

**Option B: Shell Environment**

```bash
export APPSFLYER_RPC_PATH=/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC
```

#### 2. Install Dependencies

```bash
# Install npm packages
npm install

# iOS: Install pods
cd ios
pod install
cd ..
```

#### 3. Verify Installation

Check that the podspec found the RPC framework:

```bash
cd ios
pod install --verbose
```

Look for:
```
react-native-appsflyer: Using local AppsFlyerRPC at /Users/.../AppsFlyerRPC
```

### Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | ✅ Full Support | RPC fully implemented |
| Android | ✅ Full Support | RPC fully implemented |

### Enabling RPC Module

By default, the legacy module is used for backwards compatibility. To enable the RPC module:

**iOS:**
Add to your `Podfile`:
```ruby
$AppsFlyerRPC = true
```
Then run: `cd ios && pod install`

**Android:**
Add to your app's `gradle.properties`:
```properties
appsflyer.use_rpc_module=true
```

**Note:** The RPC module requires:
- iOS: AppsFlyerRPC framework (enabled via Podfile flag)
- Android: Plugin bridge dependency (automatically included when flag is set)

## API Reference

### Initialization

#### `initialize(options)`

Initialize the SDK with dev key and app ID. Must be called before any other methods.

**Parameters:**
- `options.devKey` (string, required): Your AppsFlyer developer key
- `options.appId` (string, required): Your Apple App ID (e.g., "id123456789")

**Returns:** `Promise<void>`

**Example:**
```javascript
await AppsFlyerRPC.instance.initialize({
  devKey: 'YOUR_DEV_KEY',
  appId: 'id123456789',
});
```

**RPC Methods Called:**
1. `setPluginInfo` (automatic, internal)
2. `init`

---

#### `setDebug(enabled)`

Enable or disable debug logging. Should be called before `start()`.

**Parameters:**
- `enabled` (boolean, required): true to enable, false to disable

**Returns:** `Promise<void>`

**Example:**
```javascript
await AppsFlyerRPC.instance.setDebug(true);
```

**RPC Method:** `isDebug`

---

#### `waitForATT(options)`

Wait for App Tracking Transparency (ATT) authorization. iOS only. Must be called before `start()`.

**Parameters:**
- `options.timeout` (number, optional): Timeout in seconds (default: 60)

**Returns:** `Promise<void>`

**Example:**
```javascript
await AppsFlyerRPC.instance.waitForATT({ timeout: 60 });
```

**RPC Method:** `waitForATT`

---

### Conversion Data (Attribution)

#### `registerConversionListener()`

Register to receive attribution data from the SDK.

**Returns:** `Promise<void>`

**Example:**
```javascript
await AppsFlyerRPC.instance.registerConversionListener();
```

**RPC Method:** `registerConversionListener`

---

#### `setConversionCallbacks(callbacks)`

Set callbacks for conversion data events. Call this BEFORE `registerConversionListener()`.

**Parameters:**
- `callbacks.onSuccess` (function, optional): Called when attribution data is received
- `callbacks.onFail` (function, optional): Called when attribution fails

**Returns:** `void`

**Example:**
```javascript
AppsFlyerRPC.instance.setConversionCallbacks({
  onSuccess: (data) => {
    console.log('Attribution:', data);
  },
  onFail: (error) => {
    console.error('Attribution failed:', error);
  },
});
```

---

#### `clearConversionCallbacks()`

Clear conversion data callbacks.

**Returns:** `void`

---

### Deep Links

#### `registerDeepLinkListener()`

Register to receive deep link callbacks from the SDK.

**Returns:** `Promise<void>`

**Example:**
```javascript
await AppsFlyerRPC.instance.registerDeepLinkListener();
```

**RPC Method:** `registerDeeplinkListener`

---

#### `setDeepLinkCallback(callback)`

Set callback for deep link events. Call this BEFORE `registerDeepLinkListener()`.

**Parameters:**
- `callback.onDeepLink` (function, optional): Called when deep link is received

**Returns:** `void`

**Example:**
```javascript
AppsFlyerRPC.instance.setDeepLinkCallback({
  onDeepLink: (data) => {
    console.log('Deep link:', data);
    // Navigate to deep link destination
  },
});
```

---

#### `clearDeepLinkCallback()`

Clear deep link callback.

**Returns:** `void`

---

### SDK Control

#### `start(options)`

Start the SDK session and begin tracking.

**Parameters:**
- `options.awaitResponse` (boolean, optional): If true, waits up to 5 seconds for attribution data

**Returns:** `Promise<Object|null>` - Attribution data if `awaitResponse` is true, otherwise null

**Example:**
```javascript
// Fire and forget (default)
await AppsFlyerRPC.instance.start();

// Wait for attribution data
const attributionData = await AppsFlyerRPC.instance.start({ awaitResponse: true });
```

**RPC Method:** `start`

---

#### `startWithCallback()`

Convenience method that calls `start({ awaitResponse: true })`.

**Returns:** `Promise<Object|null>` - Attribution data or null

**Example:**
```javascript
const attributionData = await AppsFlyerRPC.instance.startWithCallback();
if (attributionData) {
  console.log('Attribution:', attributionData);
}
```

---

### Event Logging

#### `logEvent(eventName, options)`

Log an in-app event.

**Parameters:**
- `eventName` (string, required): Event name
- `options.eventValues` (object, optional): Event parameters
- `options.awaitResponse` (boolean, optional): If true, waits up to 5 seconds for server response

**Returns:** `Promise<Object|null>` - Event result if `awaitResponse` is true, otherwise null

**Example:**
```javascript
// Fire and forget (default)
await AppsFlyerRPC.instance.logEvent('af_purchase', {
  eventValues: {
    af_revenue: 9.99,
    af_currency: 'USD',
    af_content_id: 'product_123',
  },
});

// Wait for server response
const result = await AppsFlyerRPC.instance.logEvent('af_purchase', {
  eventValues: {
    af_revenue: 9.99,
    af_currency: 'USD',
  },
  awaitResponse: true,
});
console.log('Status:', result?.statusCode); // 200
```

**RPC Method:** `logEvent`

---

#### `logEventWithCallback(eventName, options)`

Convenience method that calls `logEvent()` with `awaitResponse: true`.

**Parameters:**
- `eventName` (string, required): Event name
- `options.eventValues` (object, optional): Event parameters

**Returns:** `Promise<Object|null>` - Event result with statusCode, message, etc.

**Example:**
```javascript
const result = await AppsFlyerRPC.instance.logEventWithCallback('af_purchase', {
  eventValues: {
    af_revenue: 9.99,
    af_currency: 'USD',
  },
});

if (result?.statusCode === 200) {
  console.log('Event successfully logged!');
}
```

---

### App Open Attribution

#### `setAppOpenAttributionCallbacks(callbacks)`

Set callbacks for app open attribution events.

**Parameters:**
- `callbacks.onSuccess` (function, optional): Called on successful app open attribution
- `callbacks.onFailure` (function, optional): Called on failed app open attribution

**Returns:** `void`

**Example:**
```javascript
AppsFlyerRPC.instance.setAppOpenAttributionCallbacks({
  onSuccess: (data) => {
    console.log('App open attribution:', data);
  },
  onFailure: (error) => {
    console.error('App open attribution failed:', error);
  },
});
```

---

#### `clearAppOpenAttributionCallbacks()`

Clear app open attribution callbacks.

**Returns:** `void`

---

### Cleanup

#### `cleanup()`

Clean up event listeners and callbacks. Call this when done using the SDK (e.g., component unmount).

**Returns:** `void`

**Example:**
```javascript
useEffect(() => {
  // Setup...
  
  return () => {
    AppsFlyerRPC.instance.cleanup();
  };
}, []);
```

---

## Usage Examples

### Complete Initialization Flow

```javascript
import { AppsFlyerRPC } from 'react-native-appsflyer';

async function setupAppsFlyer() {
  try {
    // 1. Set up callbacks BEFORE registering listeners
    AppsFlyerRPC.instance.setConversionCallbacks({
      onSuccess: (data) => {
        console.log('Attribution:', data);
      },
      onFail: (error) => {
        console.error('Attribution failed:', error);
      },
    });

    AppsFlyerRPC.instance.setDeepLinkCallback({
      onDeepLink: (data) => {
        console.log('Deep link:', data);
        // Handle deep link navigation
      },
    });

    // 2. Initialize SDK
    await AppsFlyerRPC.instance.initialize({
      devKey: 'YOUR_DEV_KEY',
      appId: 'id123456789',
    });

    // 3. Enable debug mode (optional)
    await AppsFlyerRPC.instance.setDebug(__DEV__);

    // 4. Register listeners
    await AppsFlyerRPC.instance.registerConversionListener();
    await AppsFlyerRPC.instance.registerDeepLinkListener();

    // 5. Wait for ATT (iOS only)
    if (Platform.OS === 'ios') {
      await AppsFlyerRPC.instance.waitForATT({ timeout: 60 });
    }

    // 6. Start SDK
    await AppsFlyerRPC.instance.start();

    console.log('AppsFlyer initialized successfully');
  } catch (error) {
    console.error('AppsFlyer initialization error:', error);
  }
}
```

### React Component Example

```javascript
import React, { useEffect } from 'react';
import { AppsFlyerRPC } from 'react-native-appsflyer';

function App() {
  useEffect(() => {
    // Setup AppsFlyer
    setupAppsFlyer();

    // Cleanup on unmount
    return () => {
      AppsFlyerRPC.instance.cleanup();
    };
  }, []);

  const handlePurchase = async (productId, price) => {
    try {
      const result = await AppsFlyerRPC.instance.logEventWithCallback('af_purchase', {
        eventValues: {
          af_revenue: price,
          af_currency: 'USD',
          af_content_id: productId,
        },
      });

      if (result?.statusCode === 200) {
        console.log('Purchase event logged successfully');
      }
    } catch (error) {
      console.error('Failed to log purchase:', error);
    }
  };

  return (
    // Your app UI
  );
}
```

## Event Handling

### Event Types

| Event | Trigger | Data |
|-------|---------|------|
| `onConversionDataSuccess` | Attribution data received | Attribution object |
| `onConversionDataFail` | Attribution fetch failed | Error object |
| `onDeepLinkReceived` | Deep link resolved | Deep link object |
| `onAppOpenAttribution` | Universal link opened | Attribution object |
| `onAppOpenAttributionFailure` | Universal link failed | Error object |

### Event Data Structures

#### Attribution Data (onConversionDataSuccess)

```javascript
{
  "status": "Non-organic",
  "media_source": "google",
  "campaign": "summer_sale",
  "af_status": "Non-organic",
  "is_first_launch": false,
  // ... more attribution fields
}
```

#### Deep Link Data (onDeepLinkReceived)

```javascript
{
  "deep_link_value": "product/123",
  "campaign": "promo",
  "deep_link_sub1": "value1",
  "is_deferred": false,
  // ... more deep link fields
}
```

## Error Handling

### AppsFlyerRPCError

All RPC errors are thrown as `AppsFlyerRPCError` instances:

```javascript
class AppsFlyerRPCError extends Error {
  code: number;      // Error code (400, 422, 500, 503)
  message: string;   // Error message
  details: any;      // Additional error details
}
```

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `400` | Invalid JSON | Check request format |
| `404` | Unknown method | Use valid RPC method |
| `422` | Validation error | Check required parameters |
| `500` | Internal error / timeout | Check SDK logs, retry |
| `503` | SDK not initialized | Call `initialize()` first |

### Error Handling Pattern

```javascript
try {
  await AppsFlyerRPC.instance.logEvent('af_purchase', {
    eventValues: { af_revenue: 9.99 },
  });
} catch (error) {
  if (error.code === 503) {
    console.error('SDK not initialized');
    // Re-initialize
  } else if (error.code === 422) {
    console.error('Invalid parameters:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing Guide

### iOS Testing

1. **Set RPC Path**: Configure `APPSFLYER_RPC_PATH` in Podfile
2. **Install Pods**: `cd ios && pod install`
3. **Run App**: `npm run ios`
4. **Check Logs**: Look for `[AppsFlyer RPC]` prefix in console
5. **Verify Events**: Check AppsFlyer dashboard for events

### Android Testing

Currently, Android will throw "NOT_IMPLEMENTED" errors. This is expected behavior.

```javascript
try {
  await AppsFlyerRPC.instance.initialize({ ... });
} catch (error) {
  if (error.code === 503 && Platform.OS === 'android') {
    console.log('Android RPC not yet available');
    // Fall back to direct SDK or show message
  }
}
```

### Debug Mode

Enable debug mode to see detailed RPC communication:

```javascript
await AppsFlyerRPC.instance.setDebug(true);
```

Look for logs:
- `[AppsFlyer RPC] Received event: onConversionDataSuccess`
- `[AppsFlyer RPC] Success for method "init"`
- `[AppsFlyer RPC] Error for method "start": [422] Missing parameter`

## Troubleshooting

### iOS: "AppsFlyerRPC not found"

**Problem:** Pod install shows warning about missing RPC framework

**Solution:**
1. Verify `APPSFLYER_RPC_PATH` is set correctly
2. Check that the path exists: `ls $APPSFLYER_RPC_PATH`
3. Ensure path points to the AppsFlyerRPC directory (not the .xcodeproj)

### iOS: Build Errors

**Problem:** Swift compilation errors or linker errors

**Solution:**
1. Clean build folder: `Product > Clean Build Folder` in Xcode
2. Delete derived data
3. Delete `ios/Pods` and `Podfile.lock`
4. Re-run `pod install`
5. Rebuild

### No Attribution Data

**Problem:** `start({ awaitResponse: true })` returns null

**Reasons:**
- Attribution data only available on first launch or after reinstall
- Timeout (5 seconds) expired
- No attribution available (organic install)

**Solution:**
- Use callbacks instead: `setConversionCallbacks()`
- Check AppsFlyer dashboard for attribution data
- Test with test device (non-organic install)

### Events Not Firing

**Problem:** Callbacks not being called

**Solution:**
1. Ensure callbacks are set BEFORE registering listeners
2. Check that listeners are registered: `registerConversionListener()`
3. Verify debug logs show events being received
4. Make sure `cleanup()` wasn't called prematurely

## Known Limitations

### Current POC Limitations

1. **iOS Only**: Android RPC not yet implemented
2. **Local Framework**: AppsFlyerRPC must be built locally
3. **Limited API**: Only Jira scope methods implemented
4. **No Fallback**: Pure RPC testing, no fallback to direct SDK
5. **TurboModules**: Requires New Architecture (optional for now)

### API Differences from Direct SDK

| Feature | Direct SDK | RPC | Notes |
|---------|-----------|-----|-------|
| Initialization | Synchronous | Async | RPC uses promises |
| Event Logging | Callback-based | Promise-based | Can use `awaitResponse` |
| Callbacks | Set during init | Set separately | More flexible |

## Migration from Direct SDK

### Key Differences

1. **Singleton Access**: Use `AppsFlyerRPC.instance` instead of `appsFlyer`
2. **Async Initialization**: All methods return promises
3. **Separate Callbacks**: Set callbacks separately from registration
4. **Cleanup Required**: Call `cleanup()` on unmount

### Migration Example

**Before (Direct SDK):**
```javascript
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk({
  devKey: 'YOUR_DEV_KEY',
  appId: 'id123456789',
  isDebug: true,
  onInstallConversionDataListener: true,
}, (result) => {
  console.log('Init success');
}, (error) => {
  console.error('Init error');
});

appsFlyer.onInstallConversionData((data) => {
  console.log('Attribution:', data);
});
```

**After (RPC):**
```javascript
import { AppsFlyerRPC } from 'react-native-appsflyer';

async function setup() {
  // Set callbacks first
  AppsFlyerRPC.instance.setConversionCallbacks({
    onSuccess: (data) => {
      console.log('Attribution:', data);
    },
  });

  // Initialize
  await AppsFlyerRPC.instance.initialize({
    devKey: 'YOUR_DEV_KEY',
    appId: 'id123456789',
  });

  await AppsFlyerRPC.instance.setDebug(true);
  await AppsFlyerRPC.instance.registerConversionListener();
  await AppsFlyerRPC.instance.start();
}
```

## Next Steps

1. ✅ Test iOS RPC implementation thoroughly
2. ✅ Validate behavioral parity with direct SDK
3. 📋 Implement Android RPC (when Android RPC framework is ready)
4. 📋 Expand API coverage beyond Jira scope
5. 📋 Performance benchmarking
6. 📋 Production readiness checklist

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [Known Limitations](#known-limitations)
- Check AppsFlyer SDK logs
- Contact AppsFlyer support

## References

- [AppsFlyerRPC iOS Documentation](../../XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC/README.md)
- [Flutter RPC Implementation](../../Plugins/appsflyer_flutter)
- [React Native TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [AppsFlyer Developer Hub](https://dev.appsflyer.com)

