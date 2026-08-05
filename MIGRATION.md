# Migration Guide: 6.x → 7.0.0

7.0.0 replaces the native bridge with a single TurboModule RPC call (`AppsFlyerRPCBridge` on
iOS, `AppsFlyerRpcHandler` on Android). Several 6.x options were silently accepted but never
reached native — the new RPC layer only accepts what native actually implements, so those are
gone rather than staying no-ops. `PurchaseConnector` is untouched.

- [Prerequisite](#prerequisite)
- [Checklist](#checklist)
- [`initSdk` → `init` + explicit startup](#initsdk--init--explicit-startup)
- [Full API change reference](#full-api-change-reference)
- [Details on selected changes](#details-on-selected-changes)
  - [Listener API: `onX` closures → `register*`/`unregister*` pairs](#listener-api-onx-closures--registerunregister-pairs)
  - [`validateAndLogInAppPurchase`: `AFPurchaseDetails` split by platform](#validateandloginapppurchase-afpurchasedetails-split-by-platform)
  - [`AFAdRevenueData` type removed](#afadrevenuedata-type-removed)
  - [`GenerateInviteLinkParams` → `AppsFlyerInviteLinkParams`](#generateinvitelinkparams--appsflyerinvitelinkparams)
  - [`generateInviteLink`'s `deeplinkPath` param removed](#generateinvitelinks-deeplinkpath-param-removed)
  - [`sendPushNotificationData`'s 2nd argument reshaped](#sendpushnotificationdatas-2nd-argument-reshaped)
- [Migrating with an LLM coding assistant](#migrating-with-an-llm-coding-assistant)

## Prerequisite

React Native ≥ 0.76.0, New Architecture enabled (`newArchEnabled=true` on Android,
`RCT_NEW_ARCH_ENABLED=1` before `pod install` on iOS). Not ready? Stay on 6.x — it gets
critical/security fixes for 6 months from the 7.0.0 release.

## Checklist

1. Enable New Architecture, bump to `^7.0.0`, reinstall native deps.
2. Fix every call site listed in the [full API change reference](#full-api-change-reference)
   below.
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
appsFlyer.enableDebug(true);                     // was: isDebug
appsFlyer.registerConversionListener(cb, onFail); // was: onInstallConversionDataListener
appsFlyer.registerDeepLinkListener(cb);          // was: onDeepLinkListener
appsFlyer.registerSessionReadyListener(() => {
  appsFlyer.start().then(onSuccess, onError);
});
```

Two rules, both easy to get wrong:

- Register listeners **synchronously** — never inside `init().then(...)`. Registration itself
  is init-order-independent, but dispatch still happens in call order; waiting on the promise
  first risks missing an event that fires shortly after init. These calls are ordered by
  dispatch, not by completion — that's why registration doesn't need (and shouldn't use) `await`.
- `start()` only inside `registerSessionReadyListener`'s callback — never a bare call right
  after `init()`. Native never auto-starts. Need code to run strictly after start? Wrap it:

```js
const startWhenReady = () => new Promise((res, rej) =>
  appsFlyer.registerSessionReadyListener(() => appsFlyer.start().then(res, rej))
);
```

`timeToWaitForATTUserAuthorization` has no replacement — request ATT yourself before `init()`.

Every RPC method that took an optional `successC`/`errorC` (or single error-first `callback`) in
6.x now returns a Promise only — awaiting it or calling `.then()` is the only way to observe the
result. Any leftover callback argument at these call sites is silently ignored, not invoked:

```js
// 6.x
appsFlyer.setCustomerUserId('uid', () => console.log('done'));
appsFlyer.getAppsFlyerUID((error, uid) => { ... });

// 7.0.0
await appsFlyer.setCustomerUserId('uid');
const uid = await appsFlyer.getAppsFlyerUID();
```

`tsc --noEmit` catches this if the call site is typed; plain JS call sites need a manual sweep.
The full list of affected methods is in the table below (`Change` column: **Callback → Promise**).

## Full API change reference

Every symbol touched by 7.0.0, alphabetical by its 6.x name. `Change` tells you what kind of
break to expect; `Notes` covers anything the rename alone doesn't. Rows with no 6.x name are
net-new; rows with no 7.0.0 name were removed outright.

| 6.x | 7.0.0 | Change | Notes |
|---|---|---|---|
| `initSdk(options, successC?, errorC?)` | `init(devKey, appId)` + `start()` | Removed, replaced | See [above](#initsdk--init--explicit-startup) — new explicit startup flow |
| `InitSDKOptions` (TS) | — | Type removed | No longer needed once `initSdk` is gone |
| `timeToWaitForATTUserAuthorization` (an `initSdk` option) | — | Removed, no replacement | Request ATT yourself before `init()` |
| `setIsDebug(isDebug)` | `enableDebug(enabled)` | Renamed | Alignment with RPC-to-Plugin-API Matrix |
| `onInstallConversionData` / `onInstallConversionFailure` / `onDeepLink` (closures) | `registerConversionListener` / `registerDeepLinkListener` (+ `unregister*`) | API redesign | See [Listener API](#listener-api-onx-closures--registerunregister-pairs) |
| `onAppOpenAttribution` / `onAttributionFailure` / `performOnAppAttribution` | `registerDeepLinkListener(callback)` | Merged | All three folded into one deep-link callback |
| `addPushNotificationDeepLinkPath(path, cb?)` | `addPushNotificationDeepLinkPath(path)` | Callback → Promise | |
| `anonymizeUser(shouldAnonymize, cb?)` | `anonymizeUser(shouldAnonymize)` | Callback → Promise | |
| `AppsFlyerConsentType` (TS) | `AppsFlyerConsent` (class) | Type renamed | `.forGDPRUser(...)`/`.forNonGDPRUser()` → `new AppsFlyerConsent(isSubjectToGDPR, ...)` |
| `AFAdRevenueData` (TS) | — | Type removed | `logAdRevenue`'s call signature is unchanged — see [notes](#afadrevenuedata-type-removed) |
| `AFInAppEventType.*` via `NativeModules.RNAppsFlyer.*` | `import { AFInAppEventType } from 'react-native-appsflyer'` | Import path changed | |
| `disableAdvertisingIdentifier(isDisable)` | `setDisableAdvertisingIdentifiers(disable)` | Renamed | |
| `disableCollectASA(shouldDisable)` | `setDisableCollectASA(disable)` | Renamed | iOS only |
| `disableIDFVCollection(shouldDisable)` | `setDisableIDFVCollection(disable)` | Renamed | iOS only |
| `disableSKAD(disableSkad)` | `setDisableSKAdNetwork(disable)` | Renamed | iOS only |
| `generateInviteLink({..., deeplinkPath}, successC?, errorC?)` | `generateInviteLink({...})` | Callback → Promise; param dropped | `deeplinkPath` removed — see [notes](#generateinvitelinks-deeplinkpath-param-removed) |
| `GenerateInviteLinkParams` (TS) | `AppsFlyerInviteLinkParams` | Type renamed | See [notes](#generateinvitelinkparams--appsflyerinvitelinkparams) |
| `getAppsFlyerUID(cb)` | `getAppsFlyerUID()` | Callback → Promise | |
| `getSDKVersion(cb)` | `getSdkVersion()` | Renamed + Callback → Promise | |
| `InAppPurchase` (TS, unused) | `AFPurchaseDetails` | Type renamed | |
| `initInAppPurchaseValidatorListener` (Android) | — | Removed | Was dead code, never wired to native |
| `logCrossPromotionImpression(appId, campaign, parameters)` | `logCrossPromoteImpression(appId, campaign, userParams)` | Renamed | |
| `logCrossPromotionAndOpenStore(appId, campaign, params)` | `logAndOpenStore(promotedAppId, campaign, userParams)` | Renamed | |
| `logEvent(name, values, successC?, errorC?)` | `logEvent(name, values, awaitResponse?)` | Callback → Promise; resolve semantics changed | Resolving now means "accepted onto the send queue", not "delivered to server" — was blocking on Android before |
| `logLocation(lat, lng, cb?)` | `logLocation(lat, lng)` | Callback → Promise | |
| `onPause()` (Android) | — | Removed | Matrix marks this Cocos2dx-only; not applicable to RN |
| `performOnDeepLinking()` (no-op) | `performDeepLinking(url, shouldTriggerSession?)` | Renamed, now functional | 6.x version never reached native |
| `sendPushNotificationData(payload, errorC, androidCampaignData)` | `sendPushNotificationData(payload, androidCampaignData)` | Callback removed; arg reshaped | See [notes](#sendpushnotificationdatas-2nd-argument-reshaped) — Android only, iOS unaffected |
| `setAdditionalData(data, cb?)` | `setAdditionalData(data)` | Callback → Promise | |
| `setAppInviteOneLinkID(oneLinkID, cb?)` | `setAppInviteOneLink(oneLinkId)` | Renamed + Callback → Promise | |
| `setCollectAndroidID(isCollect, cb?)` | `setCollectAndroidID(isCollect)` | Callback → Promise | Android only |
| `setCollectIMEI(...)` | — | Removed, no replacement | IMEI collection is obsolete |
| `setCurrencyCode(code, cb?)` | `setCurrencyCode(code)` | Callback → Promise | |
| `setCustomerUserId(uid, cb?)` | `setCustomerUserId(uid)` | Callback → Promise | |
| `setDisableNetworkData(disable, cb?)` | `setDisableNetworkData(isDisable)` | Callback → Promise; param rename only | Android only |
| `setHost(prefix, host, cb?)` | `setHost(hostPrefix, hostName)` | Callback → Promise | |
| `setOneLinkCustomDomains(domains, cb?)` | `setOneLinkCustomDomain(domains)` | Renamed + Callback → Promise | |
| `setResolveDeepLinkURLs(urls, cb?)` | `setResolveDeepLinkURLs(urls)` | Callback → Promise | |
| `setSharingFilterForAllPartners()` / `setSharingFilter([...])` | `setSharingFilterForPartners(['all'])` / `setSharingFilterForPartners([...])` | Merged + renamed | One method covers both the "all partners" and "specific partners" cases now |
| `setUserEmails({emails, emailsCryptType}, successC?, errorC?)` | — | Removed | Was already `@deprecated` pre-release; use `setUserEmail(email)` (single address, no crypt type) |
| `setUseReceiptValidationSandbox(isSandbox)` | `setUseReceiptValidationSandbox(sandbox)` | Param rename only | iOS only |
| `stop(isStopped, cb?)` | `stop(shouldStop)` | Callback → Promise; param rename only | |
| `updateServerUninstallToken(token, cb?)` | `updateServerUninstallToken(token)` | Callback → Promise | |
| `validateAndLogInAppPurchase(purchaseInfo, successC, errorC)` | `validateAndLogInAppPurchase(purchaseDetails, additionalParameters, callback?)` | Signature changed | `callback` is accepted but currently inert — see [notes](#validateandloginapppurchase-afpurchasedetails-split-by-platform) |
| `AFPurchaseDetails` (TS, single shape) | `AFPurchaseDetailsAndroid` / `AFPurchaseDetailsIOS` (union) | Type split | See [notes](#validateandloginapppurchase-afpurchasedetails-split-by-platform) |
| — | `setUseUninstallSandbox(sandbox)` | Net-new | iOS only |
| — | `setShouldCollectDeviceName(collect)` | Net-new | iOS only |

## Details on selected changes

The table above is the full at-a-glance diff. The entries below need a code sample or extra
context beyond a one-line mapping.

### Listener API: `onX` closures → `register*`/`unregister*` pairs

`onInstallConversionData`/`onInstallConversionFailure`/`onDeepLink` are replaced by explicit
register/unregister pairs, matching the Matrix's `registerConversionListener` /
`registerDeepLinkListener` naming. The returned unsubscribe closure still works for removing
just that callback; call the new `unregister*` method to also stop the underlying native
listener.

`registerConversionListener`'s two callbacks are both **required** (native's own conversion
listener interface on each platform requires both together — there's no success-only
registration at the native level), and `onFailure` now receives the failure message as a
plain `string`, not a `ConversionData`-shaped object.

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

The third `callback` argument is accepted for signature compatibility but is not currently
invoked — no native event delivers a validation result yet. Don't rely on it.

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

### `sendPushNotificationData`'s 2nd argument reshaped

`sendPushNotificationData`'s 2nd positional argument is now `androidCampaignData` directly —
the `errorC` callback that used to sit there is gone, not just made optional:

```js
// 6.x
appsFlyer.sendPushNotificationData(payload, errorCb, androidCampaignData);
// 7.0.0
appsFlyer.sendPushNotificationData(payload, androidCampaignData);
```

## Migrating with an LLM coding assistant

Point an AI coding assistant (Claude Code, Cursor, Copilot Chat, ...) at your app repo and this
file, then give it:

```text
Migrate this React Native app's react-native-appsflyer usage from 6.x to 7.0.0. Treat this
repo's MIGRATION.md as the only source of truth — read it fully first, don't rely on prior
knowledge of the plugin.

1. Confirm New Architecture is enabled (RN >= 0.76.0). If not, stop and say so.
2. Open the "Full API change reference" table. For every 6.x symbol used anywhere in this repo,
   apply the exact 7.0.0 replacement and Change-column behavior from that row. Treat rows with
   no 7.0.0 name as "delete this call site" and rows with no 6.x name as "new API, not required".
3. For initSdk(...) call sites specifically: replace with init()+start() per the "initSdk ->
   init" section, keeping both ordering rules (listeners registered synchronously, not in
   init().then(); start() only inside registerSessionReadyListener's callback).
4. Don't touch PurchaseConnector / AppsFlyerPurchaseConnector call sites.
5. If timeToWaitForATTUserAuthorization was used, add an explicit ATT request before
   init() instead of silently dropping the timing behavior.
6. Every successC/errorC/callback argument on a "Callback → Promise" row is now an unused
   parameter, not invoked — replace each call site with await/.then() on the returned Promise.
7. For rows under "Details on selected changes" (validateAndLogInAppPurchase,
   sendPushNotificationData, generateInviteLink), read that subsection before editing the call
   site — the table row alone doesn't carry the full shape change.
8. Run tsc --noEmit and tests; fix type errors from signature changes.
9. Report every change made, file by file, and flag anything found that the table above
   doesn't cover instead of guessing at it.
```
