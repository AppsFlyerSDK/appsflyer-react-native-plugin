---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` directory — `RNAppsFlyer.mm`, `RNAppsFlyer.h`, `RNAppsFlyerImpl.swift`, `AppsFlyerAttribution.swift`, `RNAppsFlyer-Bridging-Header.h`, `PCAppsFlyer.h/.m` (purchase connector — legacy, out of scope).

## 1. Module structure

- `RNAppsFlyer.mm` — thin ObjC++ TurboModule shim; conforms to `NativeAppsFlyerSpec` (Codegen-generated); delegates everything to `RNAppsFlyerImpl.swift`
- `RNAppsFlyerImpl.swift` — all real logic: RPC dispatch into `AppsFlyerRPCBridge`, event-channel wiring
- `AppsFlyerRPC` — real CocoaPods dependency (`s.dependency 'AppsFlyerRPC', '7.0.13'` in the podspec), not vendored

The module no longer subclasses `RCTEventEmitter`. Event emission goes through the TurboModule's `NativeEventEmitter` channel — one shared event name, demuxed in JS.

## 2. The single entry point

There is one exported method: `executeRpc(requestJson: String) -> Promise<String>`. All SDK capabilities are invoked by name inside the JSON payload. Do **not** add `RCT_EXPORT_METHOD` / new Codegen spec methods for individual SDK capabilities.

To add a new SDK capability: expose it in the native `AppsFlyerRPCBridge` handler and document the method name. No iOS bridge code change is needed.

## 3. Threading

- `RNAppsFlyerImpl.swift` calls `AppsFlyerRPCBridge.shared.executeJson`/`setEventHandler` wrapped in `Task { @MainActor in ... }` (reinstated 2026-08-23, correcting a prior entry here that claimed otherwise) — `AppsFlyerRPCBridge` is `@MainActor`-isolated, verified against the vendored framework's generated header (`AppsFlyerRPC-Swift.h`: "the bridge is `@MainActor`-isolated") and its own source (`README.md`: "`AppsFlyerRPCBridge` is `@MainActor` and `@objcMembers`"). A synchronous call from this file's nonisolated context is a Swift 6 concurrency compile error, not a false positive. `MainActor.assumeIsolated` is **not** a substitute — `RNAppsFlyer.mm` doesn't override `methodQueue`, so `executeRpc` runs on RN's shared background method queue by default, and `assumeIsolated` would trap if called off-main-thread. The `Task { @MainActor in ... }` hop doesn't compromise ordering: the bridge's own internal stream serializes enqueue order regardless of caller thread (verified against `AppsFlyerRPCBridgeOrderingTests.swift`'s concurrent-callers test, `/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC`) — the actual RPC work runs on `RPCQueue`'s own single-consumer `Task`, off whatever thread called `executeRpc`.
- Event emissions back to JS must be dispatched to the JS thread via the TurboModule event emitter — not `performSelectorOnMainThread`
- `AppsFlyerRPCBridge` calls complete asynchronously; results are delivered via completion handler on whatever thread the SDK chooses — the one still-needed hop is the explicit `Task { @MainActor in ... }` around `AppsFlyerAttribution.shared.bridgeReady = true` (§4a), since that completion never runs on MainActor

## 4. Listener registration — no buffering

`RNAppsFlyerImpl.swift` dispatches every RPC (including `init` and listener registration) immediately, in submission order — there is no listener-registration buffer. One existed (`initCompleted`/`pendingRegistrations`) and was removed 2026-08 once native was confirmed init-order-independent by design — see `known-issues-kb.md`'s "listener-registration buffer removed" entry for the full history and `bridge-patterns.md` §4 for the rule. Do not re-add one without first confirming an actual native regression.

## 4a. `AppsFlyerAttribution` — AppDelegate-level buffer (different problem than §4)

`AppsFlyerAttribution.swift` buffers `continueUserActivity`/`handleOpen(url:options:)` calls made from the **host app's AppDelegate** (cold-start Universal Link / custom-scheme open) until `RNAppsFlyerImpl`'s `start` RPC has succeeded. This does not contradict §4: §4 is about JS→native RPC submission order inside this bridge (confirmed init-order-independent); this is about the OS calling into the AppDelegate before RN's JS thread has even run `initSdk` — a real ordering gap, since `AppsFlyerLib.shared().continueUserActivity`/`handleOpenUrl` called with no devKey/appId configured risks resolving against an unconfigured host (a different call path from `registerDeepLinkListener`'s one-shot trigger, which was fixed upstream — see `known-issues-kb.md`), and even once devKey/appId are set, calling it before the deep-link delegate is registered resolves the click with nobody listening.

`RNAppsFlyerImpl.executeRpc` flips `AppsFlyerAttribution.shared.bridgeReady = true` once the **`start`** RPC resolves successfully — not `init`/`initialize`. `start` is the last RPC dispatched in the standard init sequence (`registerDeepLinkListener → init → registerConversionListener → registerSessionReadyListener(() => start())` — see `bridge-patterns.md` §4), so gating on it is a safe superset regardless of exactly where the other registrations land relative to `init()`; mirrors AppsFlyer's own Capacitor plugin, whose `reportBridgeReady()` runs right before `startSDK()` once devKey/appId/delegates are all configured.

Note also: by the time a request reaches `RNAppsFlyerImpl.executeRpc`, `requestJson`'s `method` field is already the platform's *resolved* wire name — `@appsflyer-sdk/js-core-plugin`'s `rpc-resolver` does this in JS before the call ever reaches native (confirmed in `__tests__/rpc-wire-contract.test.js`'s header comment) — e.g. `"initialize"`, `"registerDeeplinkListener"` (lowercase `l`), never the canonical `"init"`/`"registerDeepLinkListener"`. `"start"` happens to be unchanged on both platforms, so no such gotcha there, but any *other* method-name comparison added to this file must match against the resolved name. `canonicalToIOSMethod` in `RNAppsFlyerImpl.swift` is dead code left over from before that migration.

App-side AppDelegates (and the Expo config plugin's injected template, `expo/withAppsFlyerIos.js`) must route through `AppsFlyerAttribution.shared`, not `AppsFlyerLib.shared()` directly, for all three AppDelegate calls (`continueUserActivity`, `handleOpen`, and `handleLaunchOptions`) — one import (`react_native_appsflyer`) covers the whole AppDelegate. `handleLaunchOptions` has no ordering dependency, so `AppsFlyerAttribution.handleLaunchOptions` is a plain unbuffered pass-through to `AppsFlyerLib.shared()`, unlike the other two.

## 5. IDFA / strict mode

`#ifndef AFSDK_NO_IDFA` guards ATT-related code. The podspec supports `$RNAppsFlyerStrictMode` (`AppsFlyerFrameworkStrict`) — this excludes IDFA access entirely. When adding ATT-dependent code, always wrap in `#ifndef AFSDK_NO_IDFA`.

## 6. Version constant

`kAppsFlyerPluginVersion` in `RNAppsFlyer.h` — must be updated on every release, in sync with the other 3 version locations (see `release-versioning.md`).

## 7. Podspec

`react-native-appsflyer.podspec` declares `s.dependency 'AppsFlyerRPC', '7.0.13'` (real CocoaPods coordinate; a `Strict` variant is used when `$RNAppsFlyerStrictMode` is set — see §5). No vendored framework files ship in this repo.

The podspec's existing conditional `PurchaseConnector` pod dependency is unchanged by this rewrite.

## 8. Common iOS build issues

Header-not-found and symbol-collision issues (#646, #633, #602, #497, #541) are documented in `known-issues-kb.md`'s "iOS build failures" section — don't duplicate them here.
