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
3. Replace `initSdk(...)` with the `init` + `startSdk` flow (see below) — the change nearly
   every app needs.
4. `tsc --noEmit` + tests — signature changes will surface as type errors.
5. Smoke-test on device: install → conversion/deep-link callback → session-ready → `startSdk()` →
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
  appsFlyer.startSdk().then(onSuccess, onError);
});
```

Two rules, both easy to get wrong:

- Register listeners **synchronously** — never inside `init().then(...)`. Native buffers
  registrations until `init` completes; wait for the promise and you may miss the flush.
- `startSdk()` only inside `registerSessionReadyListener`'s callback — never a bare call right
  after `init()`. Native never auto-starts. Need code to run strictly after start? Wrap it:

```js
const startWhenReady = () => new Promise((res, rej) =>
  appsFlyer.registerSessionReadyListener(() => appsFlyer.startSdk().then(res, rej))
);
```

`timeToWaitForATTUserAuthorization` has no replacement — request ATT yourself before `init()`.

## Everything else, symbol by symbol

| 6.x | 7.0.0 |
|---|---|
| `initSdk(options)` | `init(devKey, appId)` — see above |
| `InitSDKOptions` (TS) | removed, unneeded |
| `setUserEmails({emails, emailsCryptType}, ...)` | `setUserEmail(email, successC?, errorC?)` — only first address sent, shim still works but warns |
| `performOnDeepLinking()` (no-op) | `performOnDeepLinking(url, shouldTriggerSession?)` |
| `sendPushNotificationData(payload, errorC)` (Android) | 3rd arg required: `{campaign?, pid?, isRetargeting?, additionalParameters?}` — iOS unaffected |
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
| `setHost(prefix, host, cb)` | same call site, wire shape changed internally only |
| `logEvent(...)` resolve | means "accepted onto send queue", not "delivered to server" (was blocking on Android before) |

## Migrating with an LLM coding assistant

Point an AI coding assistant (Claude Code, Cursor, Copilot Chat, ...) at your app repo and this
file, then give it:

```text
Migrate this React Native app's react-native-appsflyer usage from 6.x to 7.0.0. Treat this
repo's MIGRATION.md as the only source of truth — read it fully first, don't rely on prior
knowledge of the plugin.

1. Confirm New Architecture is enabled (RN >= 0.76.0). If not, stop and say so.
2. Find every symbol in MIGRATION.md's table and apply its documented replacement exactly.
3. For initSdk(...) call sites: replace with init()+startSdk() per the "initSdk -> init"
   section, keeping both ordering rules (listeners registered synchronously, not in
   init().then(); startSdk() only inside registerSessionReadyListener's callback).
4. Don't touch PurchaseConnector / AppsFlyerPurchaseConnector call sites.
5. If timeToWaitForATTUserAuthorization was used, add an explicit ATT request before
   init() instead of silently dropping the timing behavior.
6. Run tsc --noEmit and tests; fix type errors from signature changes.
7. Report every change made and anything found that MIGRATION.md doesn't cover, instead
   of guessing at it.
```
