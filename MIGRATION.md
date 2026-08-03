# Migration Guide: 6.x → 7.0.0

7.0.0 replaces the native bridge with a single TurboModule RPC call (`AppsFlyerRPCBridge` on
iOS, `AppsFlyerRpcHandler` on Android). Several 6.x options were silently accepted but never
reached native — the new RPC layer only accepts what native actually implements, so those are
gone rather than staying no-ops. `PurchaseConnector` is untouched.

## Prerequisite

React Native ≥ 0.76.0, New Architecture enabled (`newArchEnabled=true` on Android,
`RCT_NEW_ARCH_ENABLED=1` before `pod install` on iOS). Not ready? Stay on 6.x — it gets
critical/security fixes for 6 months from the 7.0.0 release.

## Checklist

1. Enable New Architecture, bump to `^7.0.0`, reinstall native deps.
2. Fix every call site in the table below.
3. Replace `initSdk(...)` with the `init` + `start` flow (see below) — the change nearly
   every app needs.
4. `tsc --noEmit` + tests — signature changes will surface as type errors.
5. Smoke-test on device: install → conversion/deep-link callback → session-ready → `start()` →
   `logEvent()`.

## `initSdk` → `init` + explicit startup

`initSdk(options, successC?, errorC?)` bundled `isDebug`, `onInstallConversionDataListener`,
`onDeepLinkListener`, `timeToWaitForATTUserAuthorization`, `manualStart` — none of these reached
native. Replaced by:

```js
appsFlyer.init('devKey', 'appId').then(onSuccess, onError);
appsFlyer.setIsDebug(true);            // was: isDebug
appsFlyer.onInstallConversionData(cb); // was: onInstallConversionDataListener
appsFlyer.onDeepLink(cb);              // was: onDeepLinkListener
appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start().then(onSuccess, onError);
});
```

Two rules, both easy to get wrong:

- Register listeners **synchronously** — never inside `init().then(...)`. Native buffers
  registrations until `init` completes; wait for the promise and you may miss the flush.
- `start()` only inside `registerSessionReadyListener`'s callback — never a bare call right
  after `init()`. Native never auto-starts. Need code to run strictly after start? Wrap it:

```js
const startWhenReady = () => new Promise((res, rej) =>
  appsFlyer.registerSessionReadyListener(() => appsFlyer.start().then(res, rej))
);
```

`timeToWaitForATTUserAuthorization` has no replacement — request ATT yourself before `init()`.

## Callback params removed — every RPC method is Promise-only now

6.x's optional `successC`/`errorC` params (or a single error-first `callback`) are gone from
every method. Each one now only returns a Promise — awaiting it or calling `.then()` is the
only way to observe the result:

```js
// 6.x
appsFlyer.setCustomerUserId('uid', () => console.log('done'));
appsFlyer.getAppsFlyerUID((error, uid) => { ... });

// 7.0.0
await appsFlyer.setCustomerUserId('uid');
const uid = await appsFlyer.getAppsFlyerUID();
```

Affected: `setUserEmail`, `setAdditionalData`, `getAppsFlyerUID`, `getSDKVersion`,
`updateServerUninstallToken`, `setCustomerUserId`, `stop`, `setCollectAndroidID`,
`setAppInviteOneLinkID`, `generateInviteLink`, `setCurrencyCode`, `logLocation`,
`sendPushNotificationData`, `setHost`, `addPushNotificationDeepLinkPath`,
`setOneLinkCustomDomains`, `setResolveDeepLinkURLs`, `anonymizeUser`, `logEvent`.

Any callback argument passed at these call sites is now just an unused extra parameter —
it is silently ignored, not invoked. `tsc --noEmit` catches this if the call site is typed;
plain JS call sites need a manual sweep.

`sendPushNotificationData`'s 2nd positional argument is now `androidCampaignData` directly —
the `errorC` callback that used to sit there is gone, not just made optional:

```js
// 6.x
appsFlyer.sendPushNotificationData(payload, errorCb, androidCampaignData);
// 7.0.0
appsFlyer.sendPushNotificationData(payload, androidCampaignData);
```

`setUserEmails({emails, emailsCryptType}, successC?, errorC?)` — the deprecated multi-address
shim — is removed entirely (it was already `@deprecated` pre-release, so it never shipped as
a callable 7.0.0 API). Use `setUserEmail(email)`.

## Everything else, symbol by symbol

| 6.x | 7.0.0 |
|---|---|
| `initSdk(options)` | `init(devKey, appId)` — see above |
| `InitSDKOptions` (TS) | removed, unneeded |
| `setUserEmails({emails, emailsCryptType}, ...)` | removed — use `setUserEmail(email)` (only a single address, no crypt type) |
| `performOnDeepLinking()` (no-op) | `performOnDeepLinking(url, shouldTriggerSession?)` |
| `sendPushNotificationData(payload, errorC)` (Android) | `sendPushNotificationData(payload, androidCampaignData)` — `errorC` removed, 2nd arg is now `{campaign?, pid?, isRetargeting?, additionalParameters?}` directly; iOS unaffected |
| `generateInviteLink({deeplinkPath})` | drop `deeplinkPath` (ignored, no native counterpart); `customerID`/`baseDeeplink` unchanged |
| `validateAndLogInAppPurchase(purchaseInfo, successC, errorC)` | `validateAndLogInAppPurchase(purchaseDetails, additionalParameters, callback?)` — name reused, `callback` is currently inert |
| `setCollectIMEI` | removed, no replacement (IMEI is obsolete) |
| `initInAppPurchaseValidatorListener` (Android) | removed, was dead code |
| `onAppOpenAttribution` / `onAttributionFailure` / `performOnAppAttribution` | merged into `onDeepLink(callback)` |
| `setSharingFilterForAllPartners` / `setSharingFilter` | `setSharingFilterForPartners(['all'])` / `setSharingFilterForPartners([...])` |
| `AppsFlyerConsent.forGDPRUser(...)` / `.forNonGDPRUser()` | `new AppsFlyerConsent(isSubjectToGDPR, ...)` |
| `AppsFlyerConsentType` (TS) | `AppsFlyerConsent` class |
| `InAppPurchase` (TS, unused) | `AFPurchaseDetails` |
| `AFInAppEventType.*` via `NativeModules.RNAppsFlyer.*` | `import { AFInAppEventType } from 'react-native-appsflyer'` |
| `setHost(prefix, host, cb)` | `setHost(hostPrefix, hostName)` — `cb` removed, await the returned Promise instead |
| `logEvent(...)` resolve | means "accepted onto send queue", not "delivered to server" (was blocking on Android before) |

## API alignment fixes (same 7.0.1 release line)

This renames several methods/params to match the org's RPC-to-Plugin-API Alignment Matrix
(verified against Android RPC 7.0.1 / iOS RPC 7.0.12). No RPC wire behavior changed — only the
JS-facing names. `PurchaseConnector` is untouched.

| Before | After |
|---|---|
| `setIsDebug(isDebug)` | `enableDebug(enabled)` |
| `getSDKVersion()` | `getSdkVersion()` |
| `setAppInviteOneLinkID(oneLinkID)` | `setAppInviteOneLink(oneLinkId)` |
| `logCrossPromotionImpression(appId, campaign, parameters)` | `logCrossPromoteImpression(appId, campaign, userParams)` |
| `logCrossPromotionAndOpenStore(appId, campaign, params)` | `logAndOpenStore(promotedAppId, campaign, userParams)` |
| `setOneLinkCustomDomains(domains)` | `setOneLinkCustomDomain(domains)` |
| `disableAdvertisingIdentifier(isDisable)` | `setDisableAdvertisingIdentifiers(disable)` |
| `disableIDFVCollection(shouldDisable)` | `setDisableIDFVCollection(disable)` |
| `disableCollectASA(shouldDisable)` | `setDisableCollectASA(disable)` |
| `disableSKAD(disableSkad)` | `setDisableSKAdNetwork(disable)` |
| `setUseReceiptValidationSandbox(isSandbox)` | `setUseReceiptValidationSandbox(sandbox)` — param rename only |
| `setDisableNetworkData(disable)` | `setDisableNetworkData(isDisable)` — param rename only |
| `performOnDeepLinking(url, shouldTriggerSession)` | `performDeepLinking(url, shouldTriggerSession)` |
| `stop(isStopped)` | `stop(shouldStop)` — param rename only |
| `onPause()` (Android) | removed — the Matrix marks this a Cocos2dx-only lifecycle hook, not applicable to RN |
| — | net-new: `setUseUninstallSandbox(sandbox)` (iOS) |
| — | net-new: `setShouldCollectDeviceName(collect)` (iOS) |

### Listener API: `onX` closures → `register*`/`unregister*` pairs

`onInstallConversionData`/`onInstallConversionFailure`/`onDeepLink` are replaced by explicit
register/unregister pairs, matching the Matrix's `registerConversionListener` /
`registerDeepLinkListener` naming. The returned unsubscribe closure still works for removing
just that callback; call the new `unregister*` method to also stop the underlying native
listener.

```js
// Before
appsFlyer.onInstallConversionData(onSuccess);
appsFlyer.onInstallConversionFailure(onFailure);
appsFlyer.onDeepLink(onDeepLink);

// After
appsFlyer.registerConversionListener(onSuccess, onFailure);
appsFlyer.registerDeepLinkListener(onDeepLink);

// to fully tear down (e.g. componentWillUnmount), in addition to or instead of the
// returned per-callback unsubscribe closure:
appsFlyer.unregisterConversionListener();
appsFlyer.unregisterForDeepLink(); // Android-only RPC, matches the Matrix
```

### `validateAndLogInAppPurchase`: `AFPurchaseDetails` split by platform

The single `AFPurchaseDetails` type conflated Android's `purchaseToken` and iOS's
`transactionId` under one `transactionId` field. It's now a union of two platform-shaped
interfaces — pass whichever matches your target platform:

```ts
// Before
appsFlyer.validateAndLogInAppPurchase({ productId, transactionId, purchaseType });

// After — iOS
appsFlyer.validateAndLogInAppPurchase({ productId, transactionId, purchaseType }); // AFPurchaseDetailsIOS, unchanged
// After — Android
appsFlyer.validateAndLogInAppPurchase({ productId, purchaseToken, purchaseType }); // AFPurchaseDetailsAndroid, new
```

### `AFAdRevenueData` type removed

`logAdRevenue`'s call signature is unchanged (still takes one params object) — only the
exported `AFAdRevenueData` type name is gone, since the Matrix's Flutter reference has no
dedicated model for this call. If you imported the type for an annotation, inline the shape
(`{ monetizationNetwork, mediationNetwork, currencyIso4217Code, revenue, additionalParameters? }`).

### `GenerateInviteLinkParams` → `AppsFlyerInviteLinkParams`

Renamed to match the Matrix's naming for `generateInviteLink`'s params type. Same shape, same
call site (`generateInviteLink(params)`) — only the exported type name changed.

### `generateInviteLink`'s `deeplinkPath` param removed

It was already `@deprecated` and a no-op on both platforms (no native counterpart — every call
just logged a warning). Removed outright rather than carried forward again.

## Migrating with an LLM coding assistant

Point an AI coding assistant (Claude Code, Cursor, Copilot Chat, ...) at your app repo and this
file, then give it:

```text
Migrate this React Native app's react-native-appsflyer usage from 6.x to 7.0.0. Treat this
repo's MIGRATION.md as the only source of truth — read it fully first, don't rely on prior
knowledge of the plugin.

1. Confirm New Architecture is enabled (RN >= 0.76.0). If not, stop and say so.
2. Find every symbol in MIGRATION.md's table and apply its documented replacement exactly.
3. For initSdk(...) call sites: replace with init()+start() per the "initSdk -> init"
   section, keeping both ordering rules (listeners registered synchronously, not in
   init().then(); start() only inside registerSessionReadyListener's callback).
4. Don't touch PurchaseConnector / AppsFlyerPurchaseConnector call sites.
5. If timeToWaitForATTUserAuthorization was used, add an explicit ATT request before
   init() instead of silently dropping the timing behavior.
6. Every successC/errorC/callback argument in the "Callback params removed" section is now
   an unused parameter, not invoked — replace each call site with await/.then() on the
   returned Promise instead of relying on the callback firing.
7. Run tsc --noEmit and tests; fix type errors from signature changes.
8. Report every change made and anything found that MIGRATION.md doesn't cover, instead
   of guessing at it.
```
