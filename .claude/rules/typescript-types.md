---
paths:
  - "index.ts"
---

# TypeScript type conventions

Scope: the `PurchaseConnector`/`RNTransport` types hand-maintained in `index.ts` (see root `CLAUDE.md` — no separate `index.d.ts`/`index.js`). Core RPC method types are owned by `@appsflyer-sdk/js-core-plugin`, re-exported via `export *` — not maintained here. Drift history: `known-issues-kb.md` → "Types don't match runtime".

## Rules

1. **No `any` for known shapes.** Use `Record<string, unknown>` for genuinely dynamic data, not `any`.
2. **Platform-conditional types**: where iOS and Android return different shapes, document both in JSDoc (`@platform ios`/`@platform android`); use a union type if the difference is structural.
3. **Deprecation**: mark with `@deprecated` JSDoc, keep the signature working at runtime until removal (see `release-versioning.md` §4).
4. **New exports**: every named export needs a matching type — there's no separate step, they're the same declaration.

## Validation

```bash
npx tsc --noEmit  # type-checks index.ts + PurchaseConnector TS files
```

`tsc` doesn't validate that a type matches actual runtime output — cross-check against `specs/001-turbomodule-rpc-bridge/data-model.md` §Method Catalog and test on both platforms.
