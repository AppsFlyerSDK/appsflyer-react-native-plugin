---
paths:
  - "android/**"
---

# Native Android bridge rules

Scope: `android/` — `RNAppsFlyerModule.kt`, `RNAppsFlyerPackage.kt`, `RNAppsFlyerConstants.kt`, `RNUtil.java`.

## Module structure

- `RNAppsFlyerModule.kt` — TurboModule; extends `NativeAppsFlyerSpec`; `executeRpc(requestJson)` delegates into `AppsFlyerRpcHandler`, dispatching every RPC immediately, in submission order, on a single-thread executor — no listener-registration buffer.
- `RNAppsFlyerPackage.kt` — package registration
- `af-android-plugin-bridge` / `af-android-sdk` — real Maven dependencies (`android/build.gradle`), not vendored
- No `ReactContextBaseJavaModule` / `@ReactMethod`

## Single entry point

One exported method: `executeRpc(requestJson: String): Promise<String>`. Never add per-capability `@ReactMethod`s — add new capabilities in `AppsFlyerRpcHandler` instead.

## Threading

Any RPC that can block natively (Android's `awaitResponse` model — up to 5–10s on `start`, `logEvent`, purchase validation) must be dispatched off the calling thread inside `RNAppsFlyerModule.kt`. Never call blocking RPC methods directly on the JS thread.

## CallbackGuard — do not use in TurboModule

`CallbackGuard` (`WeakReference<Callback>`) fixed a double-invocation/GC bug specific to the old-architecture `Callback` type. TurboModule Promises are held strongly by the bridge, so that bug doesn't exist here — don't add `CallbackGuard` to `RNAppsFlyerModule.kt`. It's still present in `PCAppsFlyer` (legacy bridge) — leave it there.

## Constants

`PLUGIN_VERSION` in `RNAppsFlyerConstants.kt` — keep in sync with the other 2 version locations (see `release-versioning.md`).

`AFInAppEventType` constants live as a plain frozen object in `index.ts` — don't re-add them to `getConstants()`.

## NativeEventEmitter stubs

`RNAppsFlyerModule.kt` must implement empty `addListener(eventName: String)` and `removeListeners(count: Double)` — required by `NativeEventEmitter`, absence causes warnings.

## Event emission

Emitted via `reactApplicationContext.emitDeviceEvent("RNAppsFlyer_rpcEvent", payload)` — a serialized JSON string, one shared event name for all event types. `@appsflyer-sdk/js-core-plugin` demuxes on `envelope.event` (see `bridge-patterns.md`).

## RNUtil

`RNUtil.java` handles `ReadableMap` ↔ JSON conversion. Still used where `ReadableMap` survives (e.g. `PCAppsFlyer`).

## Build setup

`android/build.gradle` pins `af-android-plugin-bridge:7.0.12` explicitly — `af-android-sdk-bom:7.0.1` doesn't carry a matching version. `namespace` is declared for AGP 8.0+. `minSdkVersion` defaults to 21 — verify `plugin_bridge`'s own `minSdkVersion` is ≤21 before release.

`AppsFlyerRpcHandler`'s constructor takes `contextProvider: () -> Context`, not `context: Context` — a named-arg call using `context =` fails to compile. `RNAppsFlyerModule.kt` passes `contextProvider = { reactApplicationContext.currentActivity ?: reactApplicationContext }`, invoked fresh on every call (not cached), so `init()` can backfill a missed `onActivityResumed` transition instead of stalling session-ready.

## Common Android build failures

Namespace/manifest-merge/thread-safety issues — see `known-issues-kb.md`'s "Android build failures" and "Runtime crashes" sections.
