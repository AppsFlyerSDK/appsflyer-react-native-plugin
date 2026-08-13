---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` directory — `RNAppsFlyer.mm`, `RNAppsFlyer.h`, `RNAppsFlyerImpl.swift`, `AppsFlyerAttribution.swift`, `RNAppsFlyer-Bridging-Header.h`, `PCAppsFlyer.h/.m` (purchase connector — legacy, out of scope).

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

## 4a. `AppsFlyerAttribution` — AppDelegate-level buffer (different problem than §4)

`AppsFlyerAttribution.swift` buffers `continueUserActivity`/`handleOpen(url:options:)` calls made from the **host app's AppDelegate** (cold-start Universal Link / custom-scheme open) until `RNAppsFlyerImpl`'s `start` RPC has succeeded. This does not contradict §4: §4 is about JS→native RPC submission order inside this bridge (confirmed init-order-independent); this is about the OS calling into the AppDelegate before RN's JS thread has even run `initSdk` — a real ordering gap, since `AppsFlyerLib.shared().continueUserActivity`/`handleOpenUrl` called with no devKey/appId configured risks the same unconfigured-host failure mode documented for `registerDeepLinkListener` in `known-issues-kb.md`, and even once devKey/appId are set, calling it before the deep-link delegate is registered resolves the click with nobody listening.

`RNAppsFlyerImpl.executeRpc` flips `AppsFlyerAttribution.shared.bridgeReady = true` once the **`start`** RPC resolves successfully — not `init`/`initialize`, and not `registerDeeplinkListener` either (an earlier version of this fix, both caught 2026-08-10 via a real cold-start test). Gating on `init` flips the buffer open before `registerDeepLinkListener()` — called by JS only after `initSdk()`'s promise resolves (see `demos/appsflyer-react-native-app/components/AppsFlyer.js`'s `AFInit` and `known-issues-kb.md`) — has set `AppsFlyerLib`'s deep-link delegate, so the buffered click resolves with nobody listening and `onDeepLinking` is silently dropped. `start` is dispatched even later in the standard init sequence (`init → registerConversionListener → registerDeepLinkListener → registerSessionReadyListener(() => start())`), so it's a safe superset gate — mirrors AppsFlyer's own Capacitor plugin, whose `reportBridgeReady()` runs right before `startSDK()` once devKey/appId/delegates are all configured.

Note also: by the time a request reaches `RNAppsFlyerImpl.executeRpc`, `requestJson`'s `method` field is already the platform's *resolved* wire name — `@appsflyer-sdk/js-core-plugin`'s `rpc-resolver` does this in JS before the call ever reaches native (confirmed in `__tests__/rpc-wire-contract.test.js`'s header comment) — e.g. `"initialize"`, `"registerDeeplinkListener"` (lowercase `l`), never the canonical `"init"`/`"registerDeepLinkListener"`. `"start"` happens to be unchanged on both platforms, so no such gotcha there, but any *other* method-name comparison added to this file must match against the resolved name. `canonicalToIOSMethod` in `RNAppsFlyerImpl.swift` is dead code left over from before that migration.

Also note: by the time a request reaches `RNAppsFlyerImpl.executeRpc`, `requestJson`'s `method` field is already the platform's *resolved* wire name (`@appsflyer-sdk/js-core-plugin`'s `rpc-resolver` does this in JS before the call ever reaches native — confirmed in `__tests__/rpc-wire-contract.test.js`'s header comment) — e.g. `"initialize"`, `"registerDeeplinkListener"` (lowercase `l`), never the canonical `"init"`/`"registerDeepLinkListener"`. `canonicalToIOSMethod` in `RNAppsFlyerImpl.swift` is dead code left over from before that migration; any new method-name comparison in this file must match against the *resolved* name, not the canonical one.

App-side AppDelegates (and the Expo config plugin's injected template, `expo/withAppsFlyerIos.js`) must route through `AppsFlyerAttribution.shared`, not `AppsFlyerLib.shared()` directly, for these two calls only — `handleLaunchOptions` has no such ordering dependency and stays a direct `AppsFlyerLib.shared()` call.

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
