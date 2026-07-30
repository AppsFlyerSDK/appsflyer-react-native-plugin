---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` directory — `RNAppsFlyer.mm`, `RNAppsFlyer.h`, `RNAppsFlyerImpl.swift`, `RNAppsFlyer-Bridging-Header.h`, `PCAppsFlyer.h/.m` (purchase connector — legacy, out of scope).

## 1. Module structure

- `RNAppsFlyer.mm` — thin ObjC++ TurboModule shim; conforms to `NativeAppsFlyerSpec` (Codegen-generated); delegates everything to `RNAppsFlyerImpl.swift`
- `RNAppsFlyerImpl.swift` — all real logic: RPC dispatch into `AppsFlyerRPCBridge`, event-channel wiring, listener-registration buffering
- `ios/Frameworks/AppsFlyerRPC.xcframework` — vendored Phase A dependency; declared via `s.vendored_frameworks` in podspec; replaced by `s.dependency 'AppsFlyerRPC', '<version>'` in Phase B

The module no longer subclasses `RCTEventEmitter`. Event emission goes through the TurboModule's `NativeEventEmitter` channel — one shared event name, demuxed in JS.

## 2. The single entry point

There is one exported method: `executeRpc(requestJson: String) -> Promise<String>`. All SDK capabilities are invoked by name inside the JSON payload. Do **not** add `RCT_EXPORT_METHOD` / new Codegen spec methods for individual SDK capabilities.

To add a new SDK capability: expose it in the native `AppsFlyerRPCBridge` handler and document the method name. No iOS bridge code change is needed.

## 3. Threading

- Any RPC call that can block natively (e.g. `start`, `logEvent`, purchase validation) **must** dispatch off the calling thread inside `RNAppsFlyerImpl.swift` — do not rely on TurboModule codegen defaults
- Event emissions back to JS must be dispatched to the JS thread via the TurboModule event emitter — not `performSelectorOnMainThread`
- `AppsFlyerRPCBridge` calls complete asynchronously; results are delivered via completion handler on whatever thread the SDK chooses

## 4. Listener-registration buffering

`RNAppsFlyerImpl.swift`'s `bufferedUntilInitMethods` holds `registerConversionListener` / `registerDeeplinkListener` / `registerSessionReadyListener` RPC dispatches if called before `init` resolves, then flushes them immediately after. This matches the Cordova prior-art fix (commit `9ee0552`). Do not remove this buffer — removing it silently drops events on the first launch.

The same set also buffers the AppDelegate deep-link forwarders — `handleOpenURL` / `handleOpenUrl` / `continueUserActivity` — for the same reason: the vendored `AppsFlyerRPC` layer's pre-ready `deepLinkRoute` hard-fails with a "Not ready" error rather than queuing, and a cold start via Universal Link/URI scheme can call these before JS calls `init()`. This is the TurboModule-era replacement for the pre-7.0.0 `AppsFlyerAttribution` singleton, which buffered one pending url/userActivity natively for the same race.

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
