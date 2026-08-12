---
paths:
  - "android/**"
---

# Native Android bridge rules

Scope: `android/` directory — `RNAppsFlyerModule.kt`, `RNAppsFlyerPackage.kt`, `RNAppsFlyerConstants.kt`, `RNUtil.java`.

## 1. Module structure

- `RNAppsFlyerModule.kt` — TurboModule; extends `NativeAppsFlyerSpec` (Codegen-generated); implements `executeRpc(requestJson)` which delegates into `AppsFlyerRpcHandler`. `executeRpc` dispatches every RPC (including `init` and listener registration) immediately, in submission order, on a single-thread executor — no listener-registration buffer. (One existed — `RpcInitGate.kt` — removed 2026-08 after confirming against the native RPC source that registration is init-order-independent by design; see `bridge-patterns.md` §4.)
- `RNAppsFlyerPackage.kt` — package registration (replaces old `RNAppsFlyerPackage.java`)
- `android/libs/` — vendored Phase A binaries: `plugin_bridge.aar` + `af-android-sdk.aar`; declared via `flatDir` + `implementation(name: ...)` in `build.gradle`; replaced by Maven in Phase B

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

`AFInAppEventType` constants are now a plain JS frozen object in `index.js` — they are **no longer exported** from `getConstants()`. Do not re-add them to `getConstants()`.

## 6. NativeEventEmitter stubs

`RNAppsFlyerModule.kt` must still implement empty `addListener(eventName: String)` and `removeListeners(count: Double)` methods (annotated for the Codegen spec). These are required by `NativeEventEmitter` — their absence causes warnings.

## 7. Event emission

Events are emitted via `reactApplicationContext.emitDeviceEvent("RNAppsFlyer_rpcEvent", payload)` (or equivalent TurboModule event emission API). Payload is a serialized JSON string. One shared event name for all event types — `index.js` demuxes on `envelope.event`.

## 8. RNUtil

`RNUtil.java` handles `ReadableMap` ↔ JSON conversion. Where `ReadableMap` is still used (e.g. in `PCAppsFlyer`), continue using `RNUtil` for conversion.

## 9. Build setup

`android/build.gradle` uses a `flatDir` repository for the vendored `.aar` files (Phase A). `namespace` is declared for AGP 8.0+ compatibility. `minSdkVersion` defaults to 21 — verify `plugin_bridge`'s own `minSdkVersion` is ≤21 before release (T069).

## 10. Common Android build failures

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `Namespace not specified` (#583, #561) | AGP 8+ | Confirm `namespace` is in `build.gradle` |
| `Multiple entries: android:allowBackup=REPLACE` (#627) | Manifest merge conflict | Add `tools:replace` in app's main manifest |
| `.aar not found` | Vendored binary missing from `android/libs/` | Verify both `plugin_bridge.aar` and `af-android-sdk.aar` are present |
| `ConcurrentModificationException` (#447) | Thread safety in native SDK | Upgrade native SDK |
