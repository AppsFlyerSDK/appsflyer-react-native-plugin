---
paths:
  - "index.js"
  - "index.d.ts"
---

# Bridge patterns — JS ↔ native contract

Scope: `index.js`, `index.d.ts`, and any file that calls `NativeModules.RNAppsFlyer` or `NativeModules.PCAppsFlyer`.

## 1. Three API patterns coexist

| Pattern | When used | Detection |
|---------|-----------|-----------|
| Dual callback/promise | `initSdk`, `logEvent` | `if (success && error)` routes to `*WithCallBack`; otherwise `*WithPromise` |
| Callback-only | Most config methods (`setCustomerUserId`, `stop`, `setCurrencyCode`) | Optional callback; defaults to `console.log` fallback |
| Event emitter | Deep linking, conversion data, purchase validation | `appsFlyerEventEmitter.addListener(eventName, handler)` |

When adding a new method, match the pattern of similar methods. Do not mix patterns within a single method.

## 2. Callback-to-native routing

```js
// Dual pattern — index.js
if (success && error) {
  RNAppsFlyer.initSdkWithCallBack(options, success, error);
} else {
  return RNAppsFlyer.initSdkWithPromise(options);
}
```

The native side has **separate methods** for callback vs promise variants. Adding a new dual method requires implementing both on iOS (`RCT_EXPORT_METHOD`) and Android (`@ReactMethod`).

## 3. Event emitter contract

- Events arrive as **JSON strings** from native — always parsed with `JSON.parse` on the JS side
- Parse failures produce `AFParseJSONException` objects (not proper Error subclasses)
- Native must serialize data to JSON string **before** calling `sendEventWithName:body:` (iOS) or `sendEvent` (Android)
- Supported event names are declared in iOS `supportedEvents` and must match exactly on both platforms:
  `onAttributionFailure`, `onAppOpenAttribution`, `onInstallConversionFailure`, `onInstallConversionDataLoaded`, `onDeepLinking`, `onValidationResult`

## 4. Listener registration order

`onDeepLink` (and `onInstallConversionData`, `onAppOpenAttribution`) must be registered **before** `initSdk`. The native SDK fires these callbacks immediately after initialization — if the JS listener isn't attached yet, events are lost silently.

This is the #1 source of GitHub issues (#650, #647, #630, #305, #292). Always validate listener timing in code review.

## 5. No transpilation

`index.js` ships as-is via npm — no Babel, no bundler. Write only syntax that Metro and Node can consume directly. The file uses ES module `export` syntax with CommonJS-compatible patterns.

## 6. Named exports

Current named exports from `index.js`: `AppsFlyerConsent`, `AFParseJSONException`, `AFPurchaseType`, `MEDIATION_NETWORK`, `StoreKitVersion`, `AppsFlyerPurchaseConnector`, `AppsFlyerPurchaseConnectorConfig`.

Adding a new named export changes the public API surface — requires a minor version bump and matching `index.d.ts` update.

## 7. Default callback fallback

Many methods use `(result) => console.log(result)` as the default callback when none is provided. This leaks to production logs. Prefer silent no-ops for new methods, or document the logging behavior explicitly.
