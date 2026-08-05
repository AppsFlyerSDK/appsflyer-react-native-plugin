---
paths:
  - "index.js"
  - "index.d.ts"
  - "src/NativeAppsFlyer.ts"
---

# Bridge patterns — JS ↔ native contract

Scope: `index.js`, `index.d.ts`, `src/NativeAppsFlyer.ts`. All native calls go through the single TurboModule entry point `NativeAppsFlyer.executeRpc(requestJson)` — there are no bespoke per-feature native methods.

## 1. Three call patterns (all route through executeRpc)

| Pattern | Helper | When to use |
|---------|--------|-------------|
| Promise-returning | `callRpc(method, params)` | Any method that returns data or needs error handling |
| Void config setter | `callRpcVoid(method, params)` | Fire-and-forget setters; logs a warning on failure instead of throwing |
| Callback compat | `callRpcWithCallback(method, params, successCb)` | Legacy callback-style API surface; bridges to `callRpc` internally |

When adding a new method, pick the pattern that matches the method's JS contract. Do not add a fourth pattern.

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

`callRpc` unwraps this: resolves with `data` on success, rejects with `error` on failure.

**Android cross-platform note**: Android maps unknown-method to error code 422 with message `"Unknown or missing method: ..."`. `callRpc` normalizes this to `{ code: 404 }` to match iOS's dedicated 404 — see `contracts/rpc-error-normalization-contract.md`.

The TurboModule Promise rejects (transport failure) only if the call never reaches native at all.

## 3. Event channel contract

Async native events (conversion data, deep link, session ready) arrive via `NativeEventEmitter` on a **single shared event name** (`RNAppsFlyer_rpcEvent` on both platforms).

`index.js` demuxes on `envelope.event` — one of:
- `onConversionDataSuccess` / `onConversionDataFail`
- `onDeepLinkReceived` (iOS) / `onDeepLinking` (Android) — same concept, different native name; `index.js` normalizes both
- `onSessionReady` — both platforms emit this once `registerSessionReadyListener` has been registered and the native SDK signals readiness (confirmed against `AppsFlyerRPC`'s own source, `AFRPCCoreHandler.swift`'s `sessionReadyEmitter`). `isSessionReady` is a separate one-off Promise query for the current state, not a replacement for the event.

The raw `origin` and `timestamp` envelope fields are stripped before handing `data` to app callbacks. There is no `supportedEvents` array to maintain under TurboModules.

## 4. Listener registration order

`registerDeeplinkListener` / `registerConversionListener` / `registerSessionReadyListener` are
**init-order-independent by design** — verified directly against the vendored native RPC
source on both platforms (`AppsFlyerRpcHandler.kt` on Android, `AFRPCCoreHandler.swift` /
`AFRPCListenerHandler.swift` on iOS): each just assigns a delegate/callback on the persistent
native SDK singleton, with no state check on `init`. The iOS `AppsFlyerRPC` README documents
this explicitly as intended parity with the native SDK — only `start`/`logEvent` require `init`
to have run first; listener registration does not.

There used to be a JS-repo-side buffer (`RpcInitGate.kt` on Android, an equivalent
`initCompleted`/`pendingRegistrations` gate in `RNAppsFlyerImpl.swift`) that held these RPCs
until `init` resolved, on the assumption native silently dropped early registrations. That
assumption didn't hold up — removed 2026-08 after confirming against the native source with
the SDK team. **Do not re-add a buffer/gate here without first confirming an actual native
regression** (and filing it upstream) — see PR #693 review discussion.

`executeRpc` on both platforms now dispatches every RPC immediately, in submission order.
Because Android's `rpcExecutor` is a single-thread `Executors.newSingleThreadExecutor()` and
iOS's `dispatchToNative` hops via `Task { @MainActor in ... }` (Swift Concurrency queues Tasks
FIFO per actor), calling `init()` and then registering listeners as separate synchronous JS
statements still dispatches them to native in that same order — this is incidental to the
existing single-thread/single-actor serialization, not an explicit ordering contract, but it's
what makes the documented call order below still worth following.

**Still call registration synchronously, not inside `init(...).then()` / after `await
init(...)`** — not because of any buffer, but because deferring into a promise callback
delays the *dispatch*, and delayed dispatch of `registerSessionReadyListener` delays the one
callback that's supposed to trigger `start()` (see the recommended pattern below).
`example/src/App.tsx` calls `init()` first and registers listeners as separate synchronous
statements right after it, matching the reference `RPCTestApp`'s own call order (`initialize` →
`isDebug` → listeners → ... → `start`).

### Recommended pattern for deterministic ordering after start()

`registerSessionReadyListener`'s callback is the only place `start()` should be called
(`AppsFlyerLib.h`: *"Call start inside the block. The SDK does not call start automatically"*)
— this doesn't change. But because that callback fires asynchronously (a real native event —
there is no plugin-side fallback/synthesized event; if it never fires, that's a native SDK bug
to file, not something this plugin should paper over), any JS code written after
the `registerSessionReadyListener(...)` call in source order actually runs *before* the
callback does, not after — `registerSessionReadyListener` returns immediately, JS doesn't wait
for it. If a consuming app wants some of its own logic (e.g. logging events) to run strictly
after `start()`, wrap the registration + `start()` call in a `Promise` and `await` it:

```js
function startWhenSessionReady() {
  return new Promise((resolve, reject) => {
    appsFlyer.registerSessionReadyListener(() => {
      appsFlyer.start().then(resolve, reject);
    });
  });
}

// ... init() + listener registration (NOT awaited, see above) ...

await startWhenSessionReady();
// everything here is guaranteed to run after start() has dispatched
```

`example/src/App.tsx` uses this exact pattern (`startWhenSessionReady`). It only reorders code
the *app* controls — it cannot make native's `onSessionReady` fire any faster, and if it never
fires, `start()` never dispatches (there is no timeout/fallback — see the known-issues KB's
session-ready-stall entry for the one confirmed native cause).

`onAppOpenAttribution`, `onAttributionFailure`, and `performOnAppAttribution` are **removed** in 7.0.0 — route attribution data through `onDeepLinking` instead (see MIGRATION.md).

## 5. No transpilation

`index.js` ships as-is via npm — no Babel, no bundler. Write only syntax that Metro and Node can consume directly.

## 6. Named exports

Current named exports from `index.js`: `AppsFlyerConsent`, `AFInAppEventType`, `AFPurchaseType`, `MEDIATION_NETWORK`, `StoreKitVersion`, `AppsFlyerPurchaseConnector`, `AppsFlyerPurchaseConnectorConfig`.

`AFInAppEventType` is now a plain JS frozen object (23 constants) — it was previously served by `NativeModules.RNAppsFlyer.getConstants()`. Adding a new named export requires a version bump and matching `index.d.ts` update.

## 7. PurchaseConnector

`PCAppsFlyer` (PurchaseConnector) still uses the legacy `NativeModules` bridge — it is **out of scope** for the TurboModule rewrite. Do not touch `PurchaseConnector/` when working on RPC or TurboModule changes.
