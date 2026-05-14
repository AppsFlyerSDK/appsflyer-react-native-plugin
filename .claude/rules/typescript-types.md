---
paths:
  - "index.d.ts"
  - "**/*.d.ts"
---

# TypeScript type definitions

Scope: `index.d.ts` and any `.d.ts` files in the repo.

## 1. Hand-maintained, not generated

`index.d.ts` is manually maintained — not generated from source. It declares the module via `declare module "react-native-appsflyer"`. This means types can (and do) drift from actual runtime behavior.

## 2. Chronic drift problem

This is a recurring source of issues (#670, #575, #475, #218, #194):
- Types say one shape, native returns another
- `any` fallback types defeat TypeScript's purpose
- Deep link data shape differs between iOS and Android, but types assume a single shape

**When changing any JS API or native return value, update `index.d.ts` in the same PR.**

## 3. Type conventions

```typescript
// Callback overload + Promise overload pattern
export function initSdk(options: InitSdkOptions, successC?: SuccessCB, errorC?: ErrorCB): Promise<string>;

// Event listener registration — returns cleanup function
export function onDeepLink(callback: (data: UnifiedDeepLinkData) => void): () => void;

// Enum-like frozen objects
export const AFPurchaseType: { SUBSCRIPTION: string; ONE_TIME_PURCHASE: string };
```

## 4. Rules for modifying types

1. **Match runtime**: types must reflect what native actually returns, not what the docs say it should return. Test on both platforms before updating.
2. **No `any` for known shapes**: if the native return type is known, type it. Use `Record<string, unknown>` for truly dynamic data, not `any`.
3. **Platform-conditional types**: where iOS and Android return different shapes, document both in JSDoc. Use union types if the difference is structural.
4. **Deprecation**: mark deprecated methods with `@deprecated` JSDoc tag. Keep the type signature for backward compatibility until removal.
5. **New exports**: every named export from `index.js` needs a matching type in `index.d.ts`. Missing types = broken TypeScript consumers.

## 5. Stale header

The file header says "Sync with v5.1.1" — this is misleading (last real sync was long ago). Do not rely on this header for version tracking.

## 6. Validation approach

After changing types:
```bash
npx tsc --noEmit  # catches type errors in PurchaseConnector TS files
```

For `index.d.ts` specifically, manual review against the JS implementation is required — `tsc` doesn't validate `.d.ts` against `.js`.
