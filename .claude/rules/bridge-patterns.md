---
paths:
  - "index.ts"
  - "src/NativeAppsFlyer.ts"
  - "src/rn-transport.ts"
---

# Bridge patterns — JS ↔ native contract

Scope: `index.ts`, `src/NativeAppsFlyer.ts`, `src/rn-transport.ts`. All native calls go through the single TurboModule entry point `NativeAppsFlyer.executeRpc(requestJson)` — there are no bespoke per-feature native methods.

Since the js-core migration, method dispatch (`callRpc`/`callRpcVoid`-style logic), per-platform wire method-name/param resolution, and event demuxing all live inside the `@appsflyer-sdk/js-core-plugin` npm package, not in this repo. `callRpc`/`callRpcVoid`/`callRpcWithCallback` no longer exist here. This repo's only remaining framework-specific glue is `src/rn-transport.ts`'s `RNTransport`, which implements `@appsflyer-sdk/js-core-plugin`'s `RpcTransport` interface:

| `RpcTransport` member | Implementation |
|---|---|
| `call<T>(method, params)` | Serializes to `executeRpc`'s request JSON, parses the response, resolves with `data` or rejects with `error` |
| `subscribe(listener)` | Wraps `NativeEventEmitter` on the shared `RNAppsFlyer_rpcEvent` event name |

`index.ts` constructs `AppsFlyerSDK` with an `RNTransport` instance and re-exports it (`export const AppsFlyer = sdk`) plus everything from `@appsflyer-sdk/js-core-plugin` (`export * from "@appsflyer-sdk/js-core-plugin"`). It only adds two platform-specific overrides on top (mediation-network wire-value resolution for `logAdRevenue`, and a string-splicing fix for `setUserFbLoginId`'s big-integer precision) — see the comments above each override in `index.ts` for why they can't live in the platform-agnostic shared package.

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

`RNTransport.call` (the `RpcTransport.call` implementation) unwraps this: resolves with `data` on success, rejects with `error` on failure. `@appsflyer-sdk/js-core-plugin`'s `AppsFlyerSDK` methods call `RNTransport.call` internally — this repo no longer calls it directly except from `index.ts`'s two per-platform overrides.

**Android cross-platform note**: Android maps unknown-method to error code 422 with message `"Unknown or missing method: ..."`, normalized to `{ code: 404 }` to match iOS's dedicated 404 — see `specs/001-turbomodule-rpc-bridge/contracts/rpc-error-normalization-contract.md`. (Not observed in `RNTransport` or the current `@appsflyer-sdk/js-core-plugin` dist — verify this still holds if debugging a 422/404 mismatch.)

The TurboModule Promise rejects (transport failure) only if the call never reaches native at all.

## 3. Event channel contract

Async native events (conversion data, deep link, session ready) arrive via `NativeEventEmitter` on a **single shared event name** (`RNAppsFlyer_rpcEvent` on both platforms). `RNTransport.subscribe` forwards the raw envelope to `@appsflyer-sdk/js-core-plugin`, which now owns the demuxing (this repo no longer parses `envelope.event` itself):
- `onConversionDataSuccess` / `onConversionDataFail`
- `onDeepLinkReceived` (iOS) / `onDeepLinking` (Android) — same concept, different native name; normalized to one JS-facing shape
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

**Two confirmed exceptions to that claim, both inside the vendored `AppsFlyerLib` binary
underneath `AppsFlyerRPC` (not fixable from this repo), where the delegate *assignment itself*
is harmless but triggers a side effect that isn't init-order-safe** — see `known-issues-kb.md`
for full root-cause detail on each:
- `registerSessionReadyListener` — `AppsFlyerLib.m`'s `registerSessionReadyListener:` asserts
  `devKey`/`appleAppID` are already set, and racing it against `init()`'s own unstructured Task
  can crash the app outright. Must be called only after `init()` has resolved.
- `registerDeepLinkListener` (**iOS only** — see below for Android) — `AppsFlyerLib.m`'s
  `setDeepLinkDelegate:` fires a **one-shot** (`dispatch_once`) deferred-deep-link resolution
  request immediately on assignment, using whatever host config exists at that moment. Calling
  it before `init()` has configured the host burns that one-shot attempt on a malformed URL,
  permanently (for the rest of that app process's lifetime — not retried). Must also be called
  only after `init()` has resolved.

`registerConversionListener` has no such exception (`setDelegate:` only assigns the ivar and
logs a deprecation warning) and may still register before `init()` per the general rule above.

**`registerDeepLinkListener` is platform-split — the two native SDKs are misaligned on when
it's safe to attach the listener, so this is the one call whose position moves relative to
`init()` by platform:**
- **iOS**: register *after* `init()` — the one-shot DDL bug above.
- **Android**: register *before* `init()`. `AFDeepLinkManager`'s `onDeepLinking()` /
  `onDeepLinkingSuccess()` / `onDeepLinkingError()` guard on `if (listener != null)` with zero
  buffering — a result delivered before the listener is attached is dropped permanently. In the
  typical single-Activity RN launch this was previously masked by an incidental lifecycle-timing
  gap (see `known-issues-kb.md`'s Android deep-link entry for the full analysis) that made
  "register after `init()`" appear safe — but that's a timing accident, not a guarantee, and it
  doesn't hold for apps with a trampoline/splash launcher Activity. Register before `init()` on
  Android instead of relying on it. `index.ts`/samples do this via `Platform.OS === 'android'`.

This is the only listener where call order differs by platform — `registerConversionListener`
and `registerSessionReadyListener` both keep the single "synchronously, right after `init()`"
rule on both platforms.

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
`isDebug` → listeners → ... → `start`) — except `registerDeepLinkListener`, which it calls
before `init()` on Android per the platform split above, via `Platform.OS`.

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

`index.ts` ships as-is via npm (no separate `index.js`/`index.d.ts` pair) — no Babel, no bundler. Write only syntax that Metro and Node can consume directly.

## 6. Named exports

Current named exports from `index.ts`: `AFInAppEventType`, `AFPurchaseType`, `MEDIATION_NETWORK`, `StoreKitVersion`, `AppsFlyerPurchaseConnector`, `AppsFlyerPurchaseConnectorConfig`, plus everything `@appsflyer-sdk/js-core-plugin` exports (via `export * from "@appsflyer-sdk/js-core-plugin"`) — including `AppsFlyerConsent`, which now lives in that package, not this repo.

`AFInAppEventType` is a plain JS frozen object (23 constants) — it was previously served by `NativeModules.RNAppsFlyer.getConstants()`. Adding a new named export requires a version bump.

## 7. PurchaseConnector

`PCAppsFlyer` (PurchaseConnector) still uses the legacy `NativeModules` bridge — it is **out of scope** for the TurboModule rewrite. Do not touch `PurchaseConnector/` when working on RPC or TurboModule changes.
