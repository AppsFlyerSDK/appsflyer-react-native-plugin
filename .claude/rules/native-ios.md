---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` — `RNAppsFlyer.mm`, `RNAppsFlyer.h`, `RNAppsFlyerImpl.swift`, `AppsFlyerAttribution.swift`, `RNAppsFlyer-Bridging-Header.h`. `PCAppsFlyer.h/.m` (purchase connector) is legacy, out of scope.

## Module structure

- `RNAppsFlyer.mm` — thin ObjC++ TurboModule shim, delegates to `RNAppsFlyerImpl.swift`
- `RNAppsFlyerImpl.swift` — RPC dispatch into `AppsFlyerRPCBridge`, event-channel wiring
- `AppsFlyerRPC` is a real CocoaPods dependency (podspec), not vendored
- No `RCTEventEmitter` — events go through the TurboModule's `NativeEventEmitter` channel

## Single entry point

One exported method: `executeRpc(requestJson: String) -> Promise<String>`. Never add per-capability `RCT_EXPORT_METHOD`s — add new capabilities in the native `AppsFlyerRPCBridge` handler instead.

## Threading

- Wrap every `AppsFlyerRPCBridge.shared.executeJson`/`setEventHandler` call in `Task { @MainActor in ... }` — the bridge is `@MainActor`-isolated; `executeRpc` runs off-main by default, so a synchronous call is a compile error. Don't use `MainActor.assumeIsolated` — it traps off-main.
- The bridge's own `RPCQueue` serializes RPC order internally regardless of caller thread, so the `Task` hop doesn't affect ordering.
- Event emissions to JS must go through the TurboModule event emitter, not `performSelectorOnMainThread`.

## Listener registration — no buffer

`RNAppsFlyerImpl.swift` dispatches every RPC (including `init` and listener registration) immediately, in submission order — native is init-order-independent by design. Don't add a registration buffer without confirming an actual native regression first (see `known-issues-kb.md`).

## `AppsFlyerAttribution` bridge-ready gate

`AppsFlyerAttribution.swift` buffers AppDelegate-level `continueUserActivity`/`handleOpen(url:options:)` calls (cold-start Universal Link / custom-scheme open) until `RNAppsFlyerImpl` flips `AppsFlyerAttribution.shared.bridgeReady = true` — which happens once the `start` RPC (not `init`) resolves. Without this, the OS can call into AppDelegate before JS has run `init`/`start`, resolving against an unconfigured host or losing the click with nobody listening. `handleLaunchOptions` has no such dependency and passes straight through.

App-side AppDelegates (and the Expo plugin's injected template) must call `AppsFlyerAttribution.shared`, never `AppsFlyerLib.shared()` directly, for `continueUserActivity`/`handleOpen`/`handleLaunchOptions`.

`requestJson.method` arrives already resolved to the platform wire name (e.g. `"initialize"`, `"registerDeeplinkListener"`) — `@appsflyer-sdk/js-core-plugin` resolves it in JS before the call reaches native. Any method-name comparison in this file must match the resolved name, not the canonical JS name.

## IDFA / strict mode

`#ifndef AFSDK_NO_IDFA` guards ATT-related code. `$RNAppsFlyerStrictMode` pulls `AppsFlyerFrameworkStrict`, which excludes IDFA entirely — wrap new ATT-dependent code in `#ifndef AFSDK_NO_IDFA`.

## Version constant

`kAppsFlyerPluginVersion` in `RNAppsFlyer.h` — keep in sync with the other 2 version locations (see `release-versioning.md`).

## Podspec

`s.dependency 'AppsFlyerRPC', '7.0.13'` (real CocoaPods coordinate; `Strict` variant used when `$RNAppsFlyerStrictMode` is set). No vendored framework files.

## Common build issues

Header-not-found / symbol-collision issues — see `known-issues-kb.md`'s "iOS build failures" section.
