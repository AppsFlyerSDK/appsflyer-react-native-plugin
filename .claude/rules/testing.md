---
paths:
  - "__tests__/**"
  - "jest.config.js"
---

# Testing conventions

## Framework and config

- Jest via `react-native` preset with `ts-jest` for TypeScript support
- Setup: `__tests__/setup.js` — mocks `src/NativeAppsFlyer` so every `executeRpc` call returns a configurable resolved Promise; mocks `NativeEventEmitter` via RN's official manual mock
- Run: `npm test` (jest with coverage)

## Test files

| File | Focus |
|------|-------|
| `index.test.js` | Core API surface — each typed wrapper calls `executeRpc` with the correct method name and params |
| `rpc-contract.test.js` | Generic `executeRpc` round-trip: normalized success/error shapes, event-channel pass-through, listener-registration wiring, unsupported-method normalization |
| `threading.test.js` | `start()` settles with a distinguishable timeout failure instead of hanging |
| `compatibility.test.js` | Backward compat for consent, StoreKit, callbacks |
| `linting.test.js` | ESLint validation of source files |
| `purchase-connector.test.ts` | PurchaseConnector models + interface (legacy bridge, unchanged) |

## Mock-and-verify pattern

All JS tests mock `src/NativeAppsFlyer.executeRpc` and assert against the serialized request:

```js
NativeAppsFlyer.executeRpc.mockResolvedValue(JSON.stringify({ success: true, data: null }));
await AppsFlyer.setCustomerUserId('uid-123');
const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
expect(JSON.parse(requestJson)).toEqual({ method: 'setCustomerUserId', params: { customerId: 'uid-123' } });
```

Never assert on `NativeModules.RNAppsFlyer` — unused in the TurboModule path.

## Event listener tests

Use `freshModule()` (`rpc-contract.test.js`) for a clean module instance — it resets modules and re-requires `index.ts` + `NativeAppsFlyer` + `NativeEventEmitter` fresh, since listener-registration state is module-level. Test the event channel by constructing a `NativeEventEmitter` from the fresh mock and calling `.emit('RNAppsFlyer_rpcEvent', envelopePayload)` directly.

## Compatibility tests

`compatibility.test.js` verifies the public API still works for known patterns. On a breaking change, update/remove the relevant compat test and add a migration-guide pointer.

## Linting-as-tests

`linting.test.js` runs ESLint programmatically inside Jest — enforces lint in CI without a separate lint step.

## Adding a new RPC method

1. `index.test.js`: assert the JS wrapper calls `executeRpc` with the exact method name and param object
2. `rpc-contract.test.js` (if relevant): normalized error-handling or event-demux behavior
3. No native-level test needed for the wrapper itself — native handlers are tested at the native tier

## Do not mock internals

Only mock `src/NativeAppsFlyer` (via `setup.js`) and `NativeEventEmitter` (official RN manual mock). Dispatch logic lives in `@appsflyer-sdk/js-core-plugin` — don't reach in and mock its internals; test through `index.ts`'s public exports.

## Avoid tautological tests

Don't assert constants equal themselves — a test must be able to fail if the implementation breaks.

## Known coverage gaps

Native-level iOS XCTest / Android JUnit for the RPC handlers, Expo config plugin tests, and live-device quickstart scenarios (killed-state deep link, full parity) are not yet covered.
