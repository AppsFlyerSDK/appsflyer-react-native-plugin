---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` directory — `RNAppsFlyer.mm`, `RNAppsFlyer.h`, `RNAppsFlyerImpl.swift`, `RNAppsFlyer-Bridging-Header.h`, `PCAppsFlyer.h/.m` (purchase connector — legacy, out of scope).

## 1. Module structure

- `RNAppsFlyer.mm` — thin ObjC++ TurboModule shim; conforms to `NativeAppsFlyerSpec` (Codegen-generated); delegates everything to `RNAppsFlyerImpl.swift`
- `RNAppsFlyerImpl.swift` — all real logic: RPC dispatch into `AppsFlyerRPCBridge`, event-channel wiring
- `ios/Frameworks/AppsFlyerRPC.xcframework` — vendored Phase A dependency; declared via `s.vendored_frameworks` in podspec; replaced by `s.dependency 'AppsFlyerRPC', '<version>'` in Phase B

The module no longer subclasses `RCTEventEmitter`. Event emission goes through the TurboModule's `NativeEventEmitter` channel — one shared event name, demuxed in JS.

## 2. The single entry point

There is one exported method: `executeRpc(requestJson: String) -> Promise<String>`. All SDK capabilities are invoked by name inside the JSON payload. Do **not** add `RCT_EXPORT_METHOD` / new Codegen spec methods for individual SDK capabilities.

To add a new SDK capability: expose it in the native `AppsFlyerRPCBridge` handler and document the method name. No iOS bridge code change is needed.

## 3. Threading

- Any RPC call that can block natively (e.g. `start`, `logEvent`, purchase validation) **must** dispatch off the calling thread inside `RNAppsFlyerImpl.swift` — do not rely on TurboModule codegen defaults
- Event emissions back to JS must be dispatched to the JS thread via the TurboModule event emitter — not `performSelectorOnMainThread`
- `AppsFlyerRPCBridge` calls complete asynchronously; results are delivered via completion handler on whatever thread the SDK chooses

## 4. Listener registration — no buffering

`RNAppsFlyerImpl.swift` dispatches every RPC (including `init` and listener registration) immediately, in submission order — there is no listener-registration buffer. One existed (an `initCompleted`/`pendingRegistrations` gate modeled on the Cordova prior-art fix, commit `9ee0552`) on the assumption that native silently drops early registrations; removed 2026-08 after confirming against the vendored `AppsFlyerRPC` source (`AFRPCCoreHandler.swift`, `AFRPCListenerHandler.swift`) that registration is init-order-independent by design — each just assigns a delegate/callback on the persistent SDK singleton, and the `AppsFlyerRPC` README documents this as intended parity with the native SDK. Do not re-add a buffer here without first confirming an actual native regression (and filing it upstream) — see `bridge-patterns.md` §4 and PR #693's review discussion.

## 5. IDFA / strict mode

`#ifndef AFSDK_NO_IDFA` guards ATT-related code. The podspec supports `$RNAppsFlyerStrictMode` (`AppsFlyerFrameworkStrict`) — this excludes IDFA access entirely. When adding ATT-dependent code, always wrap in `#ifndef AFSDK_NO_IDFA`.

## 6. Version constant

`kAppsFlyerPluginVersion` in `RNAppsFlyer.h` — must be updated on every release, in sync with the other 3 version locations (see `release-versioning.md`).

## 7. Podspec

`react-native-appsflyer.podspec` currently declares `s.vendored_frameworks = 'ios/Frameworks/AppsFlyerRPC.xcframework'` (Phase A). The existing `static_framework = true` setting requires verification with Swift framework embedding — see `plan.md §Dependency Consumption Model`. Phase B swaps `vendored_frameworks` for `s.dependency 'AppsFlyerRPC', '<version>'`.

The podspec's existing conditional `PurchaseConnector` pod dependency is unchanged by this rewrite.

## 8. Common iOS build issues

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `react_native_appsflyer-Swift.h not found` (#646) | Mixed Swift/ObjC without bridging header | Verify `RNAppsFlyer-Bridging-Header.h` is set in Xcode build settings |
| `AppsFlyerConsent.h not found` (#633) | Native SDK version mismatch | `pod deintegrate && pod install --repo-update` |
| `Redefinition of SUCCESS` (#497, #541) | Enum collision with other libs | Update to plugin version where enum was namespaced |
| Framework not found at link time | Vendored xcframework path wrong | Verify `ios/Frameworks/AppsFlyerRPC.xcframework` exists and podspec `vendored_frameworks` path matches |
