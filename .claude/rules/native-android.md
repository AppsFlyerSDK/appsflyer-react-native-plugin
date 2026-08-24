---
paths:
  - "android/**"
---

# Native Android bridge rules

Scope: `android/` directory — `RNAppsFlyerModule.kt`, `RNAppsFlyerPackage.kt`, `RNAppsFlyerConstants.kt`, `RNUtil.java`.

## 1. Module structure

- `RNAppsFlyerModule.kt` — TurboModule; extends `NativeAppsFlyerSpec` (Codegen-generated); implements `executeRpc(requestJson)` which delegates into `AppsFlyerRpcHandler`. `executeRpc` dispatches every RPC (including `init` and listener registration) immediately, in submission order, on a single-thread executor — no listener-registration buffer. (One existed — `RpcInitGate.kt` — removed 2026-08; see `known-issues-kb.md`'s "listener-registration buffer removed" entry and `bridge-patterns.md` §4.)
- `RNAppsFlyerPackage.kt` — package registration (replaces old `RNAppsFlyerPackage.java`)
- `af-android-plugin-bridge` / `af-android-sdk` — real Maven dependencies (`android/build.gradle`), not vendored

The module no longer extends `ReactContextBaseJavaModule` or uses `@ReactMethod`.

## 2. The single entry point

There is one exported method: `executeRpc(requestJson: String): Promise<String>`. All SDK capabilities are invoked by name inside the JSON payload. Do **not** add new `@ReactMethod` / Codegen spec methods for individual SDK capabilities.

To add a new SDK capability: expose it in `AppsFlyerRpcHandler` and document the method name. No Android bridge code change is needed.

## 3. Threading

Any RPC call that can block natively (Android's `awaitResponse` model — up to 5–10 s on `start`, `logEvent`, purchase validation) **must** be dispatched off the calling thread inside `RNAppsFlyerModule.kt`. Do not call blocking RPC methods directly on the JS thread.

## 4. CallbackGuard — do NOT use in TurboModule

`CallbackGuard` (`AtomicBoolean` + `WeakReference<Callback>`) was added in 6.17.8 to fix a double-invocation / GC crash specific to the old-architecture `Callback` type. Under TurboModules, Promises are held strongly by the bridge and the `WeakReference` bug doesn't exist. **Do not add `CallbackGuard` to `RNAppsFlyerModule.kt`.** It still exists in `PCAppsFlyer` (purchase connector, legacy bridge — leave it there).

## 5. Constants

`PLUGIN_VERSION` in `RNAppsFlyerConstants.kt` — must stay in sync with the other 3 version locations on every release (see `release-versioning.md`).

`AFInAppEventType` constants are now a plain JS frozen object in `index.ts` — they are **no longer exported** from `getConstants()`. Do not re-add them to `getConstants()`.

## 6. NativeEventEmitter stubs

`RNAppsFlyerModule.kt` must still implement empty `addListener(eventName: String)` and `removeListeners(count: Double)` methods (annotated for the Codegen spec). These are required by `NativeEventEmitter` — their absence causes warnings.

## 7. Event emission

Events are emitted via `reactApplicationContext.emitDeviceEvent("RNAppsFlyer_rpcEvent", payload)` (or equivalent TurboModule event emission API). Payload is a serialized JSON string. One shared event name for all event types — `@appsflyer-sdk/js-core-plugin` demuxes on `envelope.event` (see `bridge-patterns.md` §3).

## 8. RNUtil

`RNUtil.java` handles `ReadableMap` ↔ JSON conversion. Where `ReadableMap` is still used (e.g. in `PCAppsFlyer`), continue using `RNUtil` for conversion.

## 9. Build setup

`android/build.gradle` pins `af-android-plugin-bridge:7.0.12` explicitly (the `af-android-sdk-bom:7.0.1` platform doesn't carry this version yet). `namespace` is declared for AGP 8.0+ compatibility. `minSdkVersion` defaults to 21 — verify `plugin_bridge`'s own `minSdkVersion` is ≤21 before release (T069).

**`AppsFlyerRpcHandler`'s constructor takes `contextProvider: () -> Context`, not `context: Context`** (renamed in the `af-android-plugin-bridge:7.0.12` bug-fix bundle, DELIVERY-128454; a named-arg call using the old `context =` name fails to compile, verified by decompiling the pinned AAR). `RNAppsFlyerModule.kt` passes `contextProvider = { reactApplicationContext.currentActivity ?: reactApplicationContext }`, not just `{ reactApplicationContext }` — `contextProvider()` is invoked fresh on every call (not cached), so this lets `init()` backfill the missed `onActivityResumed` transition instead of stalling session-ready; see `known-issues-kb.md`'s Android session-ready entry.

## 10. Common Android build failures

Namespace/manifest-merge/thread-safety issues (#583, #561, #627, #447) are documented in `known-issues-kb.md`'s "Android build failures" and "Runtime crashes" sections — don't duplicate them here.
