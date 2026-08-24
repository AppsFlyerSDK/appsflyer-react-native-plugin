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
- Setup: `__tests__/setup.js` — mocks `src/NativeAppsFlyer` (the TurboModule spec) so every `executeRpc` call returns a configurable resolved Promise; also mocks `NativeEventEmitter` using RN's own official manual mock
- Run: `npm test` (jest with coverage)

## 2. Test files

| File | Focus |
|------|-------|
| `__tests__/index.test.js` | Core API surface — asserts each typed wrapper calls `executeRpc` with the correct method name and params |
| `__tests__/rpc-contract.test.js` | Generic `executeRpc` round-trip: normalized success/error shapes, event-channel pass-through, listener-registration RPC wiring, FR-007 unsupported-method normalization |
| `__tests__/threading.test.js` | Constitution gate: `start()` settles with a distinguishable timeout failure instead of hanging |
| `__tests__/compatibility.test.js` | Backward compat for consent, StoreKit, callbacks |
| `__tests__/linting.test.js` | ESLint validation of source files |
| `__tests__/purchase-connector.test.ts` | PurchaseConnector models + interface (legacy bridge, unchanged) |

## 3. Test pattern: mock-and-verify

All JS tests mock `src/NativeAppsFlyer.executeRpc` and assert against the serialized request:

```js
// Example pattern
NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
await appsFlyer.setCustomerUserId('uid-123');
const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
expect(JSON.parse(requestJson)).toEqual({ method: 'setCustomerUserId', params: { customerId: 'uid-123' } });
```

Do **not** assert on `NativeModules.RNAppsFlyer` — that object is not used in the TurboModule path.

## 4. Event listener tests

Use `freshModule()` (defined in `rpc-contract.test.js`) when a test needs a clean module instance — it calls `jest.resetModules()` and re-requires `index.ts` (via `require('../index')`) + `NativeAppsFlyer` + `NativeEventEmitter` fresh, because listener-registration state is module-level.

Test the event channel by constructing a `NativeEventEmitter` from the fresh mock and calling `.emit('RNAppsFlyer_rpcEvent', envelopePayload)` directly.

## 5. Compatibility tests

`compatibility.test.js` verifies that the public API still works for known patterns. When making a breaking change, update or remove the relevant compat test and add a migration-guide pointer.

## 6. Linting-as-tests

`linting.test.js` runs ESLint programmatically inside Jest. This ensures lint rules are enforced in CI without a separate lint step.

## 7. Coverage gaps (known, open tasks)

- Native-level iOS XCTest (`RNAppsFlyerImpl.swift` RPC dispatch, error normalization, threading) — T062
- Native-level Android JUnit/Robolectric (`RNAppsFlyerModule.kt`) — T063
- Expo config plugins (`expo/withAppsFlyer*.js`) — T064
- Live-device quickstart scenarios (killed-state deep link, full parity check) — T051, T061, T067

## 8. What to test when adding a new RPC method

1. `index.test.js`: the JS wrapper calls `executeRpc` with the exact method name and correct param object
2. `rpc-contract.test.js` (if relevant): any normalized error-handling or event-demux behavior
3. No native-level test required for the wrapper itself — the native handler is tested at the native tier (T062/T063)

## 9. Do not mock internals

Tests should only mock `src/NativeAppsFlyer` (via `setup.js`) and `NativeEventEmitter` (via the official RN manual mock). Dispatch logic now lives in `@appsflyer-sdk/js-core-plugin`, not in this repo — do not reach in and mock its internals; test through the public API surface (`index.ts`'s exports).

## 10. Avoid tautological tests

Do not assert constants equal themselves. Tests must be able to fail if the implementation breaks.
