# Migration Guide: 6.x → 7.0.x

7.0.x replaces the native bridge with a single TurboModule RPC call. Every method now takes
**one params object** — never positional arguments, even for a single field. Several 6.x options
that were silently accepted but never reached native are gone outright rather than staying no-ops.
`PurchaseConnector`'s call signatures are untouched, except its 5 listener methods now
return an `EmitterSubscription` instead of a bare unsubscribe function — see
[details below](#purchaseconnector-listeners-now-return-emittersubscription).

Check `package.json`'s `version` for exactly what you're on — this guide covers the whole 7.0.x
line (currently `7.0.2`, native SDK `AppsFlyerRPC` 7.0.13 on iOS / `af-android-sdk` 7.0.1 +
`af-android-plugin-bridge` 7.0.12 on Android).

- [Prerequisite](#prerequisite)
- [Checklist](#checklist)
- [`initSdk` → `init` + explicit startup](#initsdk--init--explicit-startup)
- [Full API change reference](#full-api-change-reference)
- [Details on selected changes](#details-on-selected-changes)
  - [Listener API: `onX` closures → `register*`/`unregister*` pairs](#listener-api-onx-closures--registerunregister-pairs)
  - [`validateAndLogInAppPurchase`: split by platform](#validateandloginapppurchase-split-by-platform)
  - [`generateInviteLink`: params nest under `parameters`, `deeplinkPath` gone](#generateinvitelink-params-nest-under-parameters-deeplinkpath-gone)
  - [`sendPushNotificationData` is now Android-only](#sendpushnotificationdata-is-now-android-only)
  - [iOS: hand-integrated AppDelegate now goes through `AppsFlyerAttribution`](#ios-hand-integrated-appdelegate-now-goes-through-appsflyerattribution)
  - [`PurchaseConnector` listeners now return `EmitterSubscription`](#purchaseconnector-listeners-now-return-emittersubscription)
- [Migrating with an LLM coding assistant](#migrating-with-an-llm-coding-assistant)

## Prerequisite

React Native ≥ 0.76.0, New Architecture enabled (`newArchEnabled=true` on Android,
`RCT_NEW_ARCH_ENABLED=1` before `pod install` on iOS). Not ready? Stay on 6.x — it gets
critical/security fixes for 6 months from the first 7.0.x release.

## Checklist

1. Enable New Architecture, bump to `^7.0.2`, reinstall native deps.
2. Fix every call site listed in the [full API change reference](#full-api-change-reference).
3. Replace `initSdk(...)` with the `init` + `start` flow, including moving
   `registerDeepLinkListener` to *before* `init()`.
4. If your app hand-integrates `AppDelegate.swift`/`.m`, route
   `handleOpenURL`/`handleOpenUrl`/`continueUserActivity`/`handleLaunchOptions` through
   `AppsFlyerAttribution.shared` — [details below](#ios-hand-integrated-appdelegate-now-goes-through-appsflyerattribution).
5. `tsc --noEmit` + tests — signature changes surface as type errors.
6. Smoke-test on device: install → conversion/deep-link callback → session-ready → `start()` →
   `logEvent()`.

## `initSdk` → `init` + explicit startup

`initSdk(options, successC?, errorC?)` bundled `isDebug`, `onInstallConversionDataListener`,
`onDeepLinkListener`, `timeToWaitForATTUserAuthorization`, `manualStart` — none of these reached
native. Replaced by:

```js
AppsFlyer.registerDeepLinkListener({ onDeepLinking: cb });     // was: onDeepLinkListener — before init()
AppsFlyer.init({ devKey: 'devKey', appId: 'appId' }).then(onSuccess, onError);
AppsFlyer.enableDebug({ enabled: true });                      // was: isDebug
AppsFlyer.registerConversionListener({                        // was: onInstallConversionDataListener
  onConversionDataSuccess: cb,
  onConversionDataFail: onFail,
});
AppsFlyer.registerSessionReadyListener(() => {                // the one exception — plain callback
  AppsFlyer.start().then(onSuccess, onError);
});
```

Three rules:

- `registerDeepLinkListener` goes **before** `init()`, on both platforms — Android drops any
  deep-link result that arrives before a listener is attached, permanently, with no retry.
- Every other listener registers **synchronously**, right after `init()` — never inside
  `init().then(...)`. Registration doesn't need (and shouldn't use) `await`.
- `start()` only inside `registerSessionReadyListener`'s callback — never a bare call right after
  `init()`. Native never auto-starts. Need code to run strictly after start? Wrap it:

```js
const startWhenReady = () => new Promise((res, rej) =>
  AppsFlyer.registerSessionReadyListener(() => AppsFlyer.start().then(res, rej))
);
```

`timeToWaitForATTUserAuthorization` has no replacement — request ATT yourself before `init()`.

Every method that took an optional `successC`/`errorC`/callback now returns a Promise only —
any leftover callback argument is silently ignored, not invoked:

```js
// 6.x
AppsFlyer.setCustomerUserId('uid', () => console.log('done'));
AppsFlyer.getAppsFlyerUID((error, uid) => { ... });

// 7.0.x
await AppsFlyer.setCustomerUserId({ customerId: 'uid' });
const uid = await AppsFlyer.getAppsFlyerUID(); // no params at all — one of the few zero-arg calls
```

`tsc --noEmit` catches this if the call site is typed; plain JS call sites need a manual sweep.

## Full API change reference

Alphabetical by 6.x name. Rows with no 6.x name are net-new; rows with no 7.0.x name were removed
outright. Every 7.0.x call takes one params object — the column below is the real shape, not a
placeholder.

| 6.x | 7.0.x | Change | Notes |
|---|---|---|---|
| `initSdk(options, successC?, errorC?)` | `init({devKey, appId})` + `start()` | Removed, replaced | See [above](#initsdk--init--explicit-startup) |
| `InitSDKOptions` (TS) | — | Type removed | |
| `timeToWaitForATTUserAuthorization` (an `initSdk` option) | — | Removed, no replacement | Request ATT yourself before `init()` |
| `setIsDebug(isDebug)` | `enableDebug({enabled})` | Renamed | |
| `onInstallConversionData` / `onInstallConversionFailure` / `onDeepLink` (closures) | `registerConversionListener({onConversionDataSuccess, onConversionDataFail})` / `registerDeepLinkListener({onDeepLinking})` (+ `unregister*`) | API redesign | See [Listener API](#listener-api-onx-closures--registerunregister-pairs) |
| `onAppOpenAttribution` / `onAttributionFailure` / `performOnAppAttribution` | `registerDeepLinkListener({onDeepLinking: callback})` | Merged | All three folded into one deep-link callback |
| `addPushNotificationDeepLinkPath(path, cb?)` | `addPushNotificationDeepLinkPath({deepLinkPath})` | Callback → Promise; param is now an array | `deepLinkPath: string[]` |
| `anonymizeUser(shouldAnonymize, cb?)` | `anonymizeUser({shouldAnonymize})` | Callback → Promise | |
| `AppsFlyerConsentType` (TS) / `AppsFlyerConsent` (class) | `SetConsentDataParams` (plain object) | Class removed, not renamed | `.forGDPRUser(...)`/`.forNonGDPRUser()`/`new AppsFlyerConsent(...)` → `setConsentData({ isUserSubjectToGDPR, hasConsentForDataUsage?, hasConsentForAdsPersonalization?, hasConsentForAdStorage? })` |
| `AFAdRevenueData` (TS) | — | Type removed | `logAdRevenue`'s call signature is unchanged — inline the shape if you imported it for typing: `{ monetizationNetwork, mediationNetwork, currencyIso4217Code, revenue, additionalParameters? }` |
| `AFInAppEventType.*` via `NativeModules.RNAppsFlyer.*` | `import { AFInAppEventType } from 'react-native-appsflyer'` | Import path changed | |
| `disableAdvertisingIdentifier(isDisable)` | `setDisableAdvertisingIdentifiers({disable})` | Renamed | |
| `disableCollectASA(shouldDisable)` | `setDisableCollectASA({disable})` | Renamed | iOS only |
| `disableIDFVCollection(shouldDisable)` | `setDisableIDFVCollection({disable})` | Renamed | iOS only |
| `disableSKAD(disableSkad)` | `setDisableSKAdNetwork({disable})` | Renamed | iOS only |
| `generateInviteLink({..., deeplinkPath}, successC?, errorC?)` | `generateInviteLink({parameters?, awaitResponse?})` | Callback → Promise; shape changed | See [notes](#generateinvitelink-params-nest-under-parameters-deeplinkpath-gone) |
| `getAppsFlyerUID(cb)` | `getAppsFlyerUID()` | Callback → Promise | Zero-arg |
| `getSDKVersion(cb)` | `getSdkVersion()` | Renamed + Callback → Promise | Zero-arg |
| `InAppPurchase` (TS, unused) | `AFPurchaseDetails` | Type renamed | |
| `initInAppPurchaseValidatorListener` (Android) | — | Removed | Was dead code, never wired to native |
| `logCrossPromotionImpression(appId, campaign, parameters)` | `logCrossPromoteImpression({appId, campaign?, userParams?})` | Renamed | |
| `logCrossPromotionAndOpenStore(appId, campaign, params)` | `logAndOpenStore({promotedAppId, campaign?, userParams?})` | Renamed | |
| `logEvent(name, values, successC?, errorC?)` | `logEvent({eventName, eventValues?, awaitResponse?})` | Callback → Promise; resolve semantics changed | Resolving now means "accepted onto the send queue", not "delivered to server" — was blocking on Android before |
| `logLocation(lat, lng, cb?)` | `logLocation({latitude, longitude})` | Callback → Promise | |
| `onPause()` (Android) | — | Removed | Not applicable to RN |
| `performOnDeepLinking()` (no-op) | `performDeepLinking({url, shouldTriggerSession?})` | Renamed, now functional | 6.x version never reached native |
| `sendPushNotificationData(payload, errorC, androidCampaignData)` | `sendPushNotificationData({campaign, pid, isRetargeting?, additionalParameters?})` | Callback removed; Android-only now | See [notes](#sendpushnotificationdata-is-now-android-only) |
| `setAdditionalData(data, cb?)` | `setAdditionalData({customData})` | Callback → Promise | |
| `setAppInviteOneLinkID(oneLinkID, cb?)` | `setAppInviteOneLink({oneLinkId})` | Renamed + Callback → Promise | |
| `setCollectAndroidID(isCollect, cb?)` | `setCollectAndroidID({isCollect})` | Callback → Promise | Android only |
| `setCollectIMEI(...)` | — | Removed, no replacement | IMEI collection is obsolete |
| `setCurrencyCode(code, cb?)` | `setCurrencyCode({currencyCode})` | Callback → Promise | |
| `setCustomerUserId(uid, cb?)` | `setCustomerUserId({customerId})` | Callback → Promise | |
| `setDisableNetworkData(disable, cb?)` | `setDisableNetworkData({isDisable})` | Callback → Promise; param rename only | Android only |
| `setHost(prefix, host, cb?)` | `setHost({hostPrefixName, hostName})` | Callback → Promise | Field is `hostPrefixName`, not `hostPrefix` |
| `setOneLinkCustomDomains(domains, cb?)` | `setOneLinkCustomDomain({domains})` | Renamed + Callback → Promise | |
| `setResolveDeepLinkURLs(urls, cb?)` | `setResolveDeepLinkURLs({urls})` | Callback → Promise | |
| `setSharingFilterForAllPartners()` / `setSharingFilter([...])` | `setSharingFilterForPartners({partners: ['all']})` / `setSharingFilterForPartners({partners: [...]})` | Merged + renamed | One method covers both cases now |
| `setUserEmails({emails, emailsCryptType}, successC?, errorC?)` | — | Removed | Use `setUserEmail({email})` (single address, no crypt type) |
| `setUseReceiptValidationSandbox(isSandbox)` | `setUseReceiptValidationSandbox({sandbox})` | Param rename only | iOS only |
| `stop(isStopped, cb?)` | `stop({shouldStop})` | Callback → Promise; param rename only | |
| `updateServerUninstallToken(token, cb?)` | `updateServerUninstallToken({token})` | Callback → Promise | |
| `validateAndLogInAppPurchase(purchaseInfo, successC, errorC)` | `validateAndLogInAppPurchase({purchase, additionalParameters?})` | Signature changed, callback dropped | No `callback` param anymore — resolves a `Promise` directly. See [notes](#validateandloginapppurchase-split-by-platform) |
| `AFPurchaseDetails` (TS, single shape) | `AFPurchaseDetailsAndroid` / `AFPurchaseDetailsIOS` (union) | Type split | See [notes](#validateandloginapppurchase-split-by-platform) |
| — | `setUseUninstallSandbox({sandbox})` | Net-new | iOS only |
| — | `setShouldCollectDeviceName({collect})` | Net-new | iOS only |
| — | `setUserPhone({countryCode, phoneNumber})` | Net-new | Hashed-PII setter |
| — | `setUserFirstName({firstName})` | Net-new | Hashed-PII setter |
| — | `setUserLastName({lastName})` | Net-new | Hashed-PII setter |
| — | `setUserFbLoginId({fbLoginId})` | Net-new | Hashed-PII setter; `fbLoginId` accepts `string \| number` — Facebook login IDs run 15-18 digits, past JS's 53-bit safe-integer range, so pass a string for IDs near that limit (no big-integer transform happens on your behalf) |
| — | `clearUserPii()` | Net-new | Clears every PII field set via `setUserEmail`/`setUserPhone`/`setUserFirstName`/`setUserLastName`/`setUserFbLoginId` |

## Details on selected changes

### Listener API: `onX` closures → `register*`/`unregister*` pairs

```js
// Before
AppsFlyer.onInstallConversionData(onSuccess);
AppsFlyer.onInstallConversionFailure(onFailure);
AppsFlyer.onDeepLink(onDeepLink);

// After — one callbacks object each, not positional arguments
AppsFlyer.registerConversionListener({
  onConversionDataSuccess: onSuccess,
  onConversionDataFail: onFailure,
});
AppsFlyer.registerDeepLinkListener({ onDeepLinking: onDeepLink });

// full teardown (e.g. componentWillUnmount) — Android only, both reject on iOS:
AppsFlyer.unregisterConversionListener();
AppsFlyer.unregisterDeepLinkListener();
```

`onFailure` now receives the failure message as a plain `string`, not a `ConversionData`-shaped
object.

### `validateAndLogInAppPurchase`: split by platform

The single `AFPurchaseDetails` type conflated Android's `purchaseToken` and iOS's
`transactionId`. It's now a union of two platform-shaped interfaces, nested under `purchase`:

```ts
// Before
AppsFlyer.validateAndLogInAppPurchase({ productId, transactionId, purchaseType }, successC, errorC);

// After — iOS
AppsFlyer.validateAndLogInAppPurchase({
  purchase: { productId, transactionId, purchaseType }, // AFPurchaseDetailsIOS
});
// After — Android
AppsFlyer.validateAndLogInAppPurchase({
  purchase: { productId, purchaseToken, purchaseType }, // AFPurchaseDetailsAndroid
  additionalParameters, // sits alongside `purchase`, not inside it
});
```

No `callback` argument anymore — the call resolves (or rejects) the returned Promise directly.

### `generateInviteLink`: params nest under `parameters`, `deeplinkPath` gone

Every field except `awaitResponse` now nests under a `parameters` object. `deeplinkPath` had no
native counterpart in 6.x either (silent no-op) and is dropped outright:

```js
// Before
AppsFlyer.generateInviteLink({ channel, referrerCustomerId, baseDeepLink }, successC, errorC);

// After
const link = await AppsFlyer.generateInviteLink({
  parameters: { channel, referrerCustomerId, baseDeepLink },
});
```

### `sendPushNotificationData` is now Android-only

iOS has no `sendPushNotificationData` RPC at all — its equivalent is the separate
`handlePushNotification({pushPayload})` call, which forwards the raw notification payload
directly (not another shape of the same method):

```js
// 6.x
AppsFlyer.sendPushNotificationData(payload, errorCb, androidCampaignData);

// 7.0.x — Android
AppsFlyer.sendPushNotificationData({ campaign, pid, isRetargeting, additionalParameters });
// 7.0.x — iOS: different call entirely
AppsFlyer.handlePushNotification({ pushPayload });
```

### iOS: hand-integrated AppDelegate now goes through `AppsFlyerAttribution`

Only applies if your `AppDelegate.swift`/`.m` calls the native SDK directly instead of relying on
the Expo config plugin. `handleOpenURL`/`handleOpenUrl`/`continueUserActivity`/
`handleLaunchOptions` now route through `AppsFlyerAttribution.shared` (one import, not two):

```swift
// Before
import AppsFlyerLib
import react_native_appsflyer
AppsFlyerLib.shared().handleLaunchOptions(launchOptions)
AppsFlyerLib.shared().handleOpen(url, options: options)
AppsFlyerLib.shared().continue(userActivity, restorationHandler: restorationHandler)

// After
import react_native_appsflyer
AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)
AppsFlyerAttribution.shared.handleOpen(url, options: options)
AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: restorationHandler)
```

`handleOpen`/`continueUserActivity` buffer internally until `start()` has succeeded
(`handleLaunchOptions` has no such gap — it always forwards immediately). See
`Docs/RN_DeepLinkIntegrate.md#ios-deeplink-setup`. Expo-only apps: nothing to do, `expo prebuild`
already injects this.

### `PurchaseConnector` listeners now return `EmitterSubscription`

`onSubscriptionValidationResultSuccess`/`onSubscriptionValidationResultFailure`,
`onInAppValidationResultSuccess`/`onInAppValidationResultFailure` (Android), and
`OnReceivePurchaseRevenueValidationInfo` (iOS) used to return a callable unsubscribe function. They
now return the `EmitterSubscription` itself — call `.remove()` on it instead:

```js
// Before
const unsubscribe = AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess(cb);
unsubscribe();

// After
const subscription = AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess(cb);
subscription.remove();
```

## Migrating with an LLM coding assistant

Point an AI coding assistant (Claude Code, Cursor, Copilot Chat, ...) at your app repo and this
file, then give it:

```text
Migrate this React Native app's react-native-appsflyer usage from 6.x to 7.0.x. Treat this
repo's MIGRATION.md as the only source of truth — read it fully first, don't rely on prior
knowledge of the plugin.

1. Confirm New Architecture is enabled (RN >= 0.76.0). If not, stop and say so.
2. Open the "Full API change reference" table. For every 6.x symbol used anywhere in this repo,
   apply the exact 7.0.x replacement and Change-column behavior from that row. Treat rows with
   no 7.0.x name as "delete this call site" and rows with no 6.x name as "new API, not required".
3. For initSdk(...) call sites: replace with init()+start() per the "initSdk -> init" section,
   keeping all three ordering rules — registerDeepLinkListener called BEFORE init() on both
   platforms; every other listener registered synchronously, not in init().then(); start() only
   inside registerSessionReadyListener's callback.
4. Don't touch PurchaseConnector / AppsFlyerPurchaseConnector call sites, except the 5
   listener methods whose return value changed — see
   [details below](#purchaseconnector-listeners-now-return-emittersubscription).
5. If timeToWaitForATTUserAuthorization was used, add an explicit ATT request before init()
   instead of silently dropping the timing behavior.
6. Every method now takes exactly one params object — never positional arguments. Every
   successC/errorC/callback argument on a "Callback → Promise" row is unused, not invoked —
   replace each call site with await/.then() on the returned Promise.
7. For rows under "Details on selected changes" (validateAndLogInAppPurchase,
   sendPushNotificationData, generateInviteLink), read that subsection before editing the call
   site — the table row alone doesn't carry the full shape change.
8. If AppDelegate.swift/.m is hand-integrated and calls AppsFlyerLib.shared() directly for
   handleOpenURL/handleOpenUrl/continueUserActivity/handleLaunchOptions, replace those calls with
   AppsFlyerAttribution.shared and drop the AppsFlyerLib import.
9. Run tsc --noEmit and tests; fix type errors from signature changes.
10. Report every change made, file by file, and flag anything found that the table above
    doesn't cover instead of guessing at it.
```
