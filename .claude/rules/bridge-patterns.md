---
paths:
  - "index.ts"
  - "src/NativeAppsFlyer.ts"
  - "src/rn-transport.ts"
---

# Bridge patterns — JS ↔ native contract

Scope: `index.ts`, `src/NativeAppsFlyer.ts`, `src/rn-transport.ts`. All native calls go through the single TurboModule entry point `NativeAppsFlyer.executeRpc(requestJson)` — there are no bespoke per-feature native methods.

Since the js-core migration, method dispatch (`callRpc`/`callRpcVoid`-style logic), per-platform wire method-name/param resolution, and event demuxing all live inside the `@AppsFlyer-sdk/js-core-plugin` npm package, not in this repo. `callRpc`/`callRpcVoid`/`callRpcWithCallback` no longer exist here. This repo's only remaining framework-specific glue is `src/rn-transport.ts`'s `RNTransport`, which implements `@AppsFlyer-sdk/js-core-plugin`'s `RpcTransport` interface:

| `RpcTransport` member | Implementation |
|---|---|
| `call<T>(method, params)` | Serializes to `executeRpc`'s request JSON, parses the response, resolves with `data` or rejects with `error` |
| `subscribe(listener)` | Wraps `NativeEventEmitter` on the shared `RNAppsFlyer_rpcEvent` event name |

`index.ts` constructs `AppsFlyerSDK` with an `RNTransport` instance and re-exports it (`export const AppsFlyer = sdk`) plus everything from `@AppsFlyer-sdk/js-core-plugin` (`export * from "@AppsFlyer-sdk/js-core-plugin"`). It supplies only the transport now — the mediation-network wire-value resolution moved into plugin-core's `rpc-resolver.ts` as of `@AppsFlyer-sdk/js-core-plugin` ^7.0.13. The `setUserFbLoginId` big-integer *splice* override that used to live here was deleted in the same pass (`d8b15740`) — turned out unnecessary: plugin-core's `setUserFbLoginId` is a plain pass-through (`node_modules/@AppsFlyer-sdk/js-core-plugin/dist/AppsFlyer-sdk.js`), and `RNTransport.call`'s plain `JSON.stringify` already preserves a `string` `fbLoginId` byte-for-byte (Facebook login IDs run 15-18 digits, past JS's 53-bit safe-integer range), regression-tested in `__tests__/rpc-wire-contract.test.js`'s 18-digit-ID test. A `number` input past that range has already lost precision the moment the caller's own code wrote the literal — before it reaches this SDK at all, on either the JS or native side — so there's nothing left to fix here; callers who need exact precision should pass a string, which is the documented and tested-safe path.

## 2. RPC request/response shape

Every call serializes to:
```json
{ "method": "methodName", "params": { ... } }
```

Every response resolves (never rejects for native-side outcomes) as:
```json
{ "success": true, "data": <any> }
// or
{ "success": false, "error": { "code": <number>, "message": "<string>" } }
```

`RNTransport.call` (the `RpcTransport.call` implementation) unwraps this: resolves with `data` on success, rejects with `error` on failure. `@AppsFlyer-sdk/js-core-plugin`'s `AppsFlyerSDK` methods call `RNTransport.call` internally — this repo no longer calls it directly except from `index.ts`'s two per-platform overrides.

Android's `error.code` is a real, distinct number per failure class as of `af-android-plugin-bridge` 7.0.12 (DELIVERY-128454) — an unknown/unsupported method name now returns `{ code: 404, ... }` (`RpcErrorCodes.METHOD_NOT_FOUND`) instead of the previous unstructured parse exception; malformed params still return `RpcErrorCodes.INVALID_PARAMETERS`. iOS error codes are not yet cross-checked against this same numbering — don't assume parity across platforms without verifying.

The TurboModule Promise rejects (transport failure) only if the call never reaches native at all.

## 3. Event channel contract

Async native events (conversion data, deep link, session ready) arrive via `NativeEventEmitter` on a **single shared event name** (`RNAppsFlyer_rpcEvent` on both platforms). `RNTransport.subscribe` forwards the raw envelope to `@AppsFlyer-sdk/js-core-plugin`, which now owns the demuxing (this repo no longer parses `envelope.event` itself):
- `onConversionDataSuccess` / `onConversionDataFail`
- `onDeepLinkReceived` (iOS) / `onDeepLinking` (Android) — same concept, different native name; normalized to one JS-facing shape
- `onSessionReady` — both platforms emit this once `registerSessionReadyListener` has been registered and the native SDK signals readiness (confirmed against `AppsFlyerRPC`'s own source, `AFRPCCoreHandler.swift`'s `sessionReadyEmitter`). `isSessionReady` is a separate one-off Promise query for the current state, not a replacement for the event.

The raw `origin` and `timestamp` envelope fields are stripped before handing `data` to app callbacks. There is no `supportedEvents` array to maintain under TurboModules.

## 4. Listener registration order

`registerDeeplinkListener` / `registerConversionListener` / `registerSessionReadyListener` are
**init-order-independent by design** — each just assigns a delegate/callback on the persistent
native SDK singleton, verified against the native RPC source on both platforms. Only
`start`/`logEvent` require `init` to have run first.

**Exceptions** (native SDK side effects, not fixable from this repo — full root cause and
verification detail in `known-issues-kb.md`):

| Listener | Call order | Why |
|---|---|---|
| `registerSessionReadyListener` | either order, called synchronously (no `.then()`) | used to race `init()` (TOCTOU crash risk) — fixed upstream via `AppsFlyerRPCBridge`'s FIFO `RPCQueue`, see `known-issues-kb.md` |
| `registerDeepLinkListener` | **before** `init()`, both platforms | Android: `listener == null` drops any deep-link result with zero buffering. iOS used to have the opposite constraint (a one-shot DDL trigger that permanently burned itself on an unconfigured host if called too early) — **fixed upstream**, verified against source; see `known-issues-kb.md`. Both platforms are now safe to register before `init()`, so there's no more platform split for this call. |
| `registerConversionListener` | either order | `setDelegate:` only assigns the ivar, no side effect |

### The canonical call order

```
registerDeepLinkListener → init → (config setters) → registerConversionListener → registerSessionReadyListener(() => start())
```

`registerDeepLinkListener` goes first on both platforms now — no more `Platform.OS` branch needed for it. `registerSessionReadyListener` still goes last, immediately before/wrapping `start()`, per the exception above.

There used to be a JS-repo-side buffer holding these RPCs until `init` resolved — removed
2026-08 once native was confirmed order-independent by design. **Do not re-add one without
confirming an actual native regression first** — see `known-issues-kb.md`'s "listener-registration
buffer removed" entry.

Dispatch order is guaranteed on both platforms without that buffer: Android's `rpcExecutor` is a
single-thread executor; iOS's `AppsFlyerRPCBridge.executeJson` (≥7.0.13) enqueues onto a
single-consumer queue (see `known-issues-kb.md`'s TOCTOU-race entry and `native-ios.md` §3).

**Call registration synchronously, not inside `init(...).then()`** — deferring into a promise
callback delays *dispatch*, which delays the one callback that's supposed to trigger `start()`
(see the recommended pattern below). `example/src/App.tsx` calls `init()` first and registers
listeners as separate synchronous statements right after; `registerDeepLinkListener` should move
ahead of `init()` on both platforms per the canonical order above (any sample still branching on
`Platform.OS === 'android'` for that call only is following the pre-fix iOS constraint and can drop
the branch).

### Recommended pattern for deterministic ordering after start()

`registerSessionReadyListener`'s callback is the only place `start()` should be called. Because
that callback fires asynchronously, code written after the registration call in source order
runs *before* the callback, not after. To run app logic strictly after `start()`, wrap
registration + `start()` in a `Promise`:

```js
function startWhenSessionReady() {
  return new Promise((resolve, reject) => {
    AppsFlyer.registerSessionReadyListener(() => {
      AppsFlyer.start().then(resolve, reject);
    });
  });
}

// ... init() + listener registration (NOT awaited, see above) ...

await startWhenSessionReady();
// everything here is guaranteed to run after start() has dispatched
```

This only reorders code the *app* controls — if `onSessionReady` never fires there's no
timeout/fallback (the off-main-thread `applicationState` read that used to stall this call was
fixed upstream in the native SDK; see `known-issues-kb.md`'s TOCTOU-race entry for the one
remaining open failure mode on this call).

`onAppOpenAttribution`, `onAttributionFailure`, and `performOnAppAttribution` are **removed** in 7.0.0 — route attribution data through `onDeepLinking` instead (see MIGRATION.md).

## 5. No transpilation

`index.ts` ships as-is via npm (no separate `index.js`/`index.d.ts` pair) — no Babel, no bundler. Write only syntax that Metro and Node can consume directly.

## 6. Named exports

Current named exports from `index.ts`: `AFInAppEventType`, `AFPurchaseType`, `MEDIATION_NETWORK`, `StoreKitVersion`, `AppsFlyerPurchaseConnector`, `AppsFlyerPurchaseConnectorConfig`, plus everything `@AppsFlyer-sdk/js-core-plugin` exports (via `export * from "@AppsFlyer-sdk/js-core-plugin"`) — including `AppsFlyerConsent`, which now lives in that package, not this repo.

`AFInAppEventType` is a plain JS frozen object (23 constants) — it was previously served by `NativeModules.RNAppsFlyer.getConstants()`. Adding a new named export requires a version bump.

## 7. PurchaseConnector

`PCAppsFlyer` (PurchaseConnector) still uses the legacy `NativeModules` bridge — it is **out of scope** for the TurboModule rewrite. Do not touch `PurchaseConnector/` when working on RPC or TurboModule changes.
