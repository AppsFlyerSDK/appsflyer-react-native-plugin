# Migration Guide: 6.x → 7.0.0

`react-native-appsflyer` 7.0.0 rewrites the native bridge as a New-Architecture-only
TurboModule backed by each platform's RPC layer (`AppsFlyerRPCBridge` on iOS,
`AppsFlyerRpcHandler` on Android). This guide covers every behavior difference from 6.x.

**Scope note**: `PurchaseConnector`/`AppsFlyerPurchaseConnector` is untouched by this
release — nothing below applies to it.

## Prerequisite: New Architecture required

7.0.0 drops the legacy `NativeModules`/`RCTBridgeModule` bridge entirely. Apps must run
with the New Architecture enabled (`react-native >=0.76.0`, where it's on by default).
Apps not yet on New Architecture should stay on the 6.x line, which will continue to
receive critical and security fixes for **6 months** from the 7.0.0 release date.

## Breaking changes

### `initSdk(options)` — replaced by `init(devKey, appId)`

`initSdk`'s options object previously bundled `isDebug`, `onInstallConversionDataListener`,
`onDeepLinkListener`, `timeToWaitForATTUserAuthorization`, and `manualStart` alongside
`devKey`/`appId` — none of those extra fields were ever actually sent to the real native
RPC layer as documented; the whole object was serialized as-is into a call that doesn't
accept them. `initSdk(options, successC?, errorC?)` is replaced by `init(devKey, appId?)`,
a Promise-only call taking only what the native RPC `initialize`/`init` call actually
accepts. The `InitSDKOptions` TypeScript interface is removed.

```js
// 6.x / pre-7.0.1
appsFlyer.initSdk({
  devKey: 'xxxx',
  appId: '777',
  isDebug: true,
  onInstallConversionDataListener: true,
  onDeepLinkListener: true,
  manualStart: true,
}, onSuccess, onError);

// 7.0.1+
appsFlyer.setIsDebug(true);              // was: isDebug
appsFlyer.onInstallConversionData(cb);   // was: onInstallConversionDataListener — already registers natively
appsFlyer.onDeepLink(cb);                // was: onDeepLinkListener — already registers natively
appsFlyer.init('xxxx', '777').then(onSuccess, onError);
appsFlyer.startSdk();                    // always explicit now — manualStart had no effect either way
```

`timeToWaitForATTUserAuthorization` has no replacement yet — the current native RPC layer
has no App Tracking Transparency timing method exposed. This is a known gap, not a silent
regression; track it before relying on ATT-timed init behavior.

### `registerSessionReadyListener` — now a real public listener

Both native RPC layers emit a real `onSessionReady` event once registered, but the JS event
demux had no bucket wired for it — the event was silently dropped. `registerSessionReadyListener`
is now a public method, following the same pattern as `onDeepLink`/`onInstallConversionData`:

```js
const unregister = appsFlyer.registerSessionReadyListener(() => {
  console.log('session ready');
});
// later: unregister();
```

`isSessionReady()` (a one-off Promise-returning query) and `unregisterSessionReadyListener()`
are unchanged.

### `logEvent` — resolved Promise no longer means "delivered to server"

On Android, `logEvent` previously sent `awaitResponse: true` internally, so the native RPC
handler blocked until the event's HTTP request to AppsFlyer's server actually completed (or
timed out) before resolving. That block ran on the same single-thread native RPC queue used
for every other call, so a burst of `logEvent` calls could also delay unrelated queued RPCs
(e.g. `registerSessionReadyListener`, `start()`) behind them.

`logEvent` no longer waits for server delivery — it resolves as soon as the SDK accepts the
event onto its internal send queue. The call signature is unchanged:

```js
appsFlyer.logEvent('af_purchase', { af_revenue: '12.99', af_currency: 'USD' })
  .then(result => { /* event accepted for sending, not confirmed delivered */ })
  .catch(error => { /* SDK rejected the event, e.g. before init/start */ });
```

If you need confirmation an event actually reached AppsFlyer's server, that was never
guaranteed by this API's return value even before this change — check the native SDK's own
debug logs.

### `setHost` — parameter shape changed

`setHost`'s first two arguments are now sent to native as `{hostPrefixName, hostName}`
instead of two positional strings. The JS call signature is unchanged — only the
internal wire shape changed, so this only matters if you were relying on 6.x's exact
native param names (e.g. in a patch or a custom native extension).

```js
// 6.x and 7.0.0 — call site is identical
appsFlyer.setHost('mycompany', 'onelink.me', successCallback);
```

### `validateAndLogInAppPurchase` (legacy, non-V2) — removed

The pre-V2 purchase validation API is removed entirely, with no adapter. It already
carried a deprecation warning since 6.4.0. Use `validateAndLogInAppPurchaseV2` or
`AppsFlyerPurchaseConnector` instead.

```js
// 6.x (removed in 7.0.0)
appsFlyer.validateAndLogInAppPurchase(purchaseInfo, onSuccess, onError);

// 7.0.0 — use the V2 API (event-emitter based result)
const remove = appsFlyer.validateAndLogInAppPurchaseV2(
  purchaseDetails,
  additionalParameters,
  (result) => { /* ... */ }
);
```

### `setCollectIMEI` — removed

Android's IMEI-collection opt-out has no RPC equivalent and is removed with no
adapter. IMEI collection has been phased out at the OS level (unavailable on modern
Android versions), so this call is no longer meaningful.

### `initInAppPurchaseValidatorListener` (Android, dead code) — removed

This was unreachable dead code in the pre-7.0.0 Android module (no JS call site ever
invoked it). It's gone along with the rest of the legacy `RNAppsFlyerModule.java`. No
migration action needed — nothing in the public JS API referenced it.

### `onAppOpenAttribution` / `onAttributionFailure` / `performOnAppAttribution` — merged into `onDeepLink`

These three are removed entirely. Attribution data (previously delivered via
`onAppOpenAttribution`) is now delivered through `onDeepLink`, matching what
`onInstallConversionData` already does for deferred deep links. There is no
`performOnAppAttributionWithURL` replacement — call `onDeepLink` once during app setup.

```js
// 6.x
appsFlyer.onAppOpenAttribution((data) => { /* attribution data */ });
appsFlyer.onAttributionFailure((data) => { /* attribution error */ });
appsFlyer.performOnAppAttribution(urlString, onSuccess, onError);

// 7.0.0 — one listener for both deep links and attribution data
appsFlyer.onDeepLink((data) => {
  // `data` carries the same fields onAppOpenAttribution used to deliver
});
```

### `setSharingFilterForAllPartners` / `setSharingFilter` — removed

Deprecated since 6.4.0 in favor of `setSharingFilterForPartners`. Both are removed
entirely with no adapter.

```js
// 6.x (removed in 7.0.0)
appsFlyer.setSharingFilterForAllPartners();
appsFlyer.setSharingFilter(['partner1', 'partner2'], onSuccess, onError);

// 7.0.0
appsFlyer.setSharingFilterForPartners(['all']);
appsFlyer.setSharingFilterForPartners(['partner1', 'partner2']);
```

### `AppsFlyerConsent.forGDPRUser` / `AppsFlyerConsent.forNonGDPRUser` — removed

Deprecated since 6.16.2 in favor of the `AppsFlyerConsent` constructor. Both static
methods are removed entirely with no adapter.

```js
// 6.x (removed in 7.0.0)
const consent = AppsFlyerConsent.forGDPRUser(hasConsentForDataUsage, hasConsentForAdsPersonalization);
const consent = AppsFlyerConsent.forNonGDPRUser();

// 7.0.0 — use the constructor directly
const consent = new AppsFlyerConsent(true, hasConsentForDataUsage, hasConsentForAdsPersonalization);
const consent = new AppsFlyerConsent(false);
```

### `AppsFlyerConsentType` (TypeScript interface) — removed

Deprecated since 6.16.2 in favor of the `AppsFlyerConsent` class. The interface
declaration is removed from `index.d.ts`; use `AppsFlyerConsent` for typing.

### `InAppPurchase` (TypeScript interface, dead type) — removed

Unused type left over from a pre-V2 purchase-validation API — no method in this
package ever accepted it. Use `AFPurchaseDetails` (the type `validateAndLogInAppPurchaseV2`
actually takes).

## Internal-mechanism changes (not breaking, documented for transparency)

### `Response<T>` (TypeScript type, dead type) — removed

Unused type alias with zero references anywhere in `index.d.ts`. Not part of the public
API surface (nothing imported or exported it), so removal has no consumer-visible
migration step.

### `AFInAppEventType.*` constants moved from native `getConstants()` to a JS/TS module

Pre-7.0.0, these 23 event-name constants (`PURCHASE`, `ACHIEVEMENT_UNLOCKED`, etc.) were
exposed via the legacy native module's `getConstants()`, auto-merged onto
`NativeModules.RNAppsFlyer.*`. The TurboModule spec has no `getConstants()` equivalent,
so they're now a plain exported JS object with the same names and values:

```js
import { AFInAppEventType } from 'react-native-appsflyer';

appsFlyer.logEvent(AFInAppEventType.PURCHASE, { af_revenue: 9.99 });
```

If you previously accessed these via `NativeModules.RNAppsFlyer.PURCHASE` directly
(bypassing this package's JS API), switch to the `AFInAppEventType` export above —
`NativeModules.RNAppsFlyer` no longer carries these properties.
