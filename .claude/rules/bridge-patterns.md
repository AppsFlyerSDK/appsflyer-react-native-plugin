---
paths:
  - "index.ts"
  - "src/NativeAppsFlyer.ts"
  - "src/rn-transport.ts"
---

# Bridge patterns — JS ↔ native contract

Scope: `index.ts`, `src/NativeAppsFlyer.ts`, `src/rn-transport.ts`. All native calls go through the single TurboModule entry point `NativeAppsFlyer.executeRpc(requestJson)` — no bespoke per-feature native methods.

Method dispatch, per-platform wire method-name/param resolution, and event demuxing live in `@appsflyer-sdk/js-core-plugin`, not this repo. This repo's only glue is `src/rn-transport.ts`'s `RNTransport`, implementing `RpcTransport`:

| `RpcTransport` member | Implementation |
|---|---|
| `call<T>(method, params)` | Serializes to `executeRpc`'s request JSON, parses the response, resolves with `data` or rejects with `error` |
| `subscribe(listener)` | Wraps `NativeEventEmitter` on the shared `RNAppsFlyer_rpcEvent` event name |

`index.ts` constructs `AppsFlyerSDK` with an `RNTransport` instance, exports it (`export const AppsFlyer = sdk`), and re-exports everything from `@appsflyer-sdk/js-core-plugin` (`export * from "@appsflyer-sdk/js-core-plugin"`).

## RPC request/response shape

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

`RNTransport.call` unwraps this: resolves with `data` on success, rejects with `error` on failure. Android's `error.code` is a distinct number per failure class (e.g. `404` = `RpcErrorCodes.METHOD_NOT_FOUND`) — iOS error codes aren't cross-checked against this numbering, don't assume parity.

The TurboModule Promise itself only rejects if the call never reaches native at all.

## Event channel contract

Async native events (conversion data, deep link, session ready) arrive via `NativeEventEmitter` on a single shared event name (`RNAppsFlyer_rpcEvent` on both platforms). `RNTransport.subscribe` forwards the raw envelope to `@appsflyer-sdk/js-core-plugin`, which owns the demuxing into:
- `onConversionDataSuccess` / `onConversionDataFail`
- `onDeepLinkReceived` (iOS) / `onDeepLinking` (Android) — normalized to one JS-facing shape
- `onSessionReady` — fires once `registerSessionReadyListener` is registered and native signals readiness. `isSessionReady` is a separate one-off Promise query for current state, not a replacement.

The raw `origin`/`timestamp` envelope fields are stripped before handing `data` to app callbacks. No `supportedEvents` array under TurboModules.

## Listener registration order

Registration calls are init-order-independent by design on both platforms — each just assigns a delegate/callback on the persistent native SDK singleton. Only `start`/`logEvent` require `init` to have run first.

Exceptions (native side effects — see `known-issues-kb.md` for root cause):

| Listener | Call order | Why |
|---|---|---|
| `registerSessionReadyListener` | called synchronously (no `.then()`) | avoids a TOCTOU race with `init()` |
| `registerDeepLinkListener` | before `init()`, both platforms | Android drops any pre-registration deep-link result with zero buffering |
| `registerConversionListener` | either order | plain delegate assignment, no side effect |

### Canonical call order

```
registerDeepLinkListener → init → (config setters) → registerConversionListener → registerSessionReadyListener(() => start())
```

Register synchronously, not inside `init(...).then()` — deferring into the promise callback delays the one callback that triggers `start()`.

No JS-side buffer exists for these RPCs — don't add one without confirming an actual native regression first (see `known-issues-kb.md`'s "listener-registration buffer removed" entry).

### Deterministic ordering after start()

`registerSessionReadyListener`'s callback is the only place to call `start()`. It fires asynchronously, so code written after the registration call in source order runs *before* it, not after. Wrap in a Promise to run app logic strictly after `start()`:

```js
function startWhenSessionReady() {
  return new Promise((resolve, reject) => {
    AppsFlyer.registerSessionReadyListener(() => {
      AppsFlyer.start().then(resolve, reject);
    });
  });
}
// ... init() + listener registration (not awaited) ...
await startWhenSessionReady();
```

This only reorders app-controlled code — there's no timeout/fallback if `onSessionReady` never fires.

`onAppOpenAttribution`, `onAttributionFailure`, `performOnAppAttribution` are removed in 7.0.0 — use `onDeepLinking` instead (see MIGRATION.md).

## No transpilation

`index.ts` ships as-is via npm — no Babel, no bundler, no separate `index.js`/`index.d.ts`. Only syntax Metro and Node can consume directly.

## Named exports

`AFInAppEventType`, `AFPurchaseType`, `MEDIATION_NETWORK`, `StoreKitVersion`, `AppsFlyerPurchaseConnector`, `AppsFlyerPurchaseConnectorConfig`, plus everything `@appsflyer-sdk/js-core-plugin` exports (including `AppsFlyerConsent`). Adding a new named export requires a version bump.

## PurchaseConnector

`PCAppsFlyer` still uses the legacy `NativeModules` bridge — out of scope for the TurboModule rewrite. Don't touch `PurchaseConnector/` when working on RPC/TurboModule changes.
