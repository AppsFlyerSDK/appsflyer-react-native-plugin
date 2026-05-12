---
paths:
  - "__tests__/**"
  - "jest.config.js"
---

# Testing conventions

Scope: `__tests__/` directory, `jest.config.js`, test-related changes.

## 1. Framework and config

- Jest via `react-native` preset with `ts-jest` for TypeScript test support
- Config: `jest.config.js`
- Setup: `__tests__/setup.js` — mocks `NativeModules.RNAppsFlyer` (every native method is `jest.fn()`) and `NativeEventEmitter`
- Run: `npm test` (jest with coverage)

## 2. Test files

| File | Focus |
|------|-------|
| `__tests__/index.test.js` | Core API surface + event emitters (~80 tests) |
| `__tests__/compatibility.test.js` | Backward compat for consent, StoreKit, callbacks (~15 tests) |
| `__tests__/linting.test.js` | ESLint validation of source files (~6 tests) |
| `__tests__/purchase-connector.test.ts` | PurchaseConnector models + interface (~40 tests) |

## 3. Test pattern: mock-and-verify

All tests follow the same pattern:
1. Call the JS API method
2. Assert the correct **native method** was called with expected arguments
3. For event emitters: emit an event, assert the handler received correct data

```js
// Example pattern
appsFlyer.logEvent('af_purchase', { af_revenue: 10 }, successCB, errorCB);
expect(RNAppsFlyer.logEvent).toHaveBeenCalledWith('af_purchase', { af_revenue: 10 }, successCB, errorCB);
```

No integration tests or native-level tests exist. All native modules are fully mocked.

## 4. Event listener tests

Test both paths:
- Happy path: native emits valid JSON string → handler receives parsed object
- Parse failure: native emits invalid JSON → handler receives `AFParseJSONException` object

## 5. Compatibility tests

`compatibility.test.js` verifies deprecated APIs still work at runtime. When deprecating a method, add a test here proving the old call signature still routes correctly.

## 6. Linting-as-tests

`linting.test.js` runs ESLint programmatically inside Jest. This is unusual but ensures lint rules are enforced in CI even without a separate lint step.

## 7. Coverage gaps (known)

These areas have **no test coverage** — adding tests here is high-value:
- Expo config plugins (`expo/withAppsFlyer.js`, `expo/withAppsFlyerIos.js`, `expo/withAppsFlyerAndroid.js`)
- Native-level unit tests (no XCTest, no Android JUnit)
- `logAdRevenue`, `logLocation`, `logCrossPromotionImpression`, `logCrossPromotionAndOpenStore`
- Edge cases in event listener cleanup (multiple listeners, unmount timing)

## 8. What to test when adding a new method

1. JS API calls correct native method name with correct arguments
2. Promise variant returns a Promise (not undefined)
3. Callback variant invokes the provided callbacks
4. Input validation (if any) rejects invalid types
5. Add backward-compat test if the method replaces a deprecated one

## 9. Do not mock internals

Tests should only mock `NativeModules` (via `setup.js`). Do not mock internal JS functions within `index.js` — test through the public API surface.

## 10. Avoid tautological tests

Some existing tests assert constants equal themselves (e.g., `expect('ironsource').toBe('ironsource')`). Do not add more of these — they test nothing.
