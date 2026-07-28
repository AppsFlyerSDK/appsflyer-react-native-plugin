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
// startSdk() is always explicit now (manualStart had no effect either way), but it is NOT a
// bare call after init() — the native SDK never auto-starts, so startSdk() must be called
// from inside registerSessionReadyListener's callback (AppsFlyerLib.h: "Call start inside the
// block. The SDK does not call start automatically."). registerSessionReadyListener must also
// be registered synchronously, before init()'s promise settles, same as the listeners above.
appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.startSdk().then(onSuccess, onError);
});
appsFlyer.init('xxxx', '777').then(onSuccess, onError);
```

Calling `startSdk()` right after `init()` outside of `registerSessionReadyListener`'s callback
is a common migration mistake — it may appear to work but doesn't follow the documented native
contract and can start the SDK before the session is actually ready. See
`.claude/rules/bridge-patterns.md` §4 for the full listener-ordering contract and the
`startWhenSessionReady()` Promise-wrapping pattern if your app needs deterministic code
ordering after start.

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

### `setUserEmails(options)` — replaced by `setUserEmail(email)`

SDK7's RPC layer exposes only a single-address `setUserEmail`, which reads one `email` param.
Neither the `emails` array nor `emailsCryptType` has a native counterpart on either platform,
so `AF_EMAIL_CRYPT_TYPE` is now meaningless for this call. `setUserEmails` stays as a
deprecated shim: it logs a warning and forwards only the **first** address.

```js
// 6.x
appsFlyer.setUserEmails({
  emailsCryptType: 3,
  emails: ['user1@gmail.com', 'user2@gmail.com'],
}, onSuccess, onError);

// 7.0.0
appsFlyer.setUserEmail('user1@gmail.com', onSuccess, onError);
```

There is no replacement for sending more than one address per user.

### `performOnDeepLinking()` — now takes a URL

Native reads `{url, shouldTriggerSession}`. The old no-arg form resolved the empty string, so
it was a silent no-op. Android-only; `shouldTriggerSession` defaults to `false`.

```js
// 6.x — resolved the empty string, did nothing
appsFlyer.performOnDeepLinking();

// 7.0.0
appsFlyer.performOnDeepLinking(deepLinkUrl);
appsFlyer.performOnDeepLinking(deepLinkUrl, true); // also start a session
```

### `sendPushNotificationData` — Android needs explicit campaign fields

The platforms diverged in SDK7. iOS still takes the raw notification payload and locates the
`af` block itself. Android dropped raw-payload support and builds an `AFPushData` from explicit
fields, so a third argument carries them: `{campaign?, pid?, isRetargeting?, additionalParameters?}`.

```js
// 6.x — one raw payload for both platforms
appsFlyer.sendPushNotificationData(pushPayload, onError);

// 7.0.0 — iOS reads pushPayload as before; Android reads the third argument
appsFlyer.sendPushNotificationData(pushPayload, onError, {
  campaign: 'holiday_sale',
  pid: 'push_provider_int',
  isRetargeting: true,
});
```

Omitting the third argument logs a warning and reports an empty re-engagement **on Android
only** — iOS is unaffected. The change is additive, so iOS-only apps need no code change.

### `generateInviteLink` — `deeplinkPath` deprecated and ignored

`deeplinkPath` has no native counterpart on either platform. It is now ignored and logs a
warning. `customerID` and `baseDeeplink` still work — the plugin translates them to the native
key names internally (iOS `referrerCustomerId`, Android `customerId`, both `baseDeepLink`), so
call sites using them are unchanged.

```js
// 6.x
appsFlyer.generateInviteLink({
  channel: 'gmail',
  customerID: '1234',
  deeplinkPath: 'af_sub1',
}, onSuccess, onError);

// 7.0.0
appsFlyer.generateInviteLink({
  channel: 'gmail',
  customerID: '1234',
}, onSuccess, onError);
```

### `validateAndLogInAppPurchase(purchaseInfo, successC, errorC)` — signature replaced

The pre-7.0.0 3-positional-argument signature is removed entirely, with no adapter. It already
carried a deprecation warning since 6.4.0. The `validateAndLogInAppPurchase` name is reused in
7.0.0 for the `AFPurchaseDetails`-based API (an in-development "V2" API in earlier 7.0.0
pre-releases, renamed back to the original name once the legacy signature was gone). Use it, or
`AppsFlyerPurchaseConnector`, instead.

```js
// 6.x (signature removed in 7.0.0)
appsFlyer.validateAndLogInAppPurchase(purchaseInfo, onSuccess, onError);

// 7.0.0 — same name, new AFPurchaseDetails-based signature.
// Note: the `callback` argument is currently inert — no native event delivers a validation
// result yet, so this only dispatches the RPC. Don't rely on it firing.
appsFlyer.validateAndLogInAppPurchase(
  purchaseDetails,
  additionalParameters,
  (result) => { /* not currently invoked */ }
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

### `stop(false)` now actually resumes the SDK on Android

Android's RPC parser defaults a missing `shouldStop` key to `true`, and the flag wasn't being
sent, so an app that called `stop(false)` could never resume the SDK. The flag is now sent
explicitly. The call signature is unchanged; if you worked around this, the workaround can go.

```js
// 6.x and 7.0.0 — call site is identical, but only 7.0.0 actually resumes on Android
appsFlyer.stop(false);
```

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
