---
name: release-check
description: Validate release readiness across all checkpoints
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

## Release Readiness Check

Verify all release checkpoints. Report as a pass/fail checklist.

### Checks to run

1. **Version sync** — All 4 version constants match:
   - `package.json` version
   - `react-native-appsflyer.podspec` s.version
   - `ios/RNAppsFlyer.h` kAppsFlyerPluginVersion
   - `android/.../RNAppsFlyerConstants.java` PLUGIN_VERSION

2. **CHANGELOG** — `CHANGELOG.md` has an entry for the current version at the top.

3. **Tests** — `npm test` passes with no failures.

4. **Types** — `npx tsc --noEmit` passes (PurchaseConnector TypeScript check).

5. **Lint** — `npm run lint` passes with no errors.

6. **Production logging** — No `console.log` calls in `index.js` that aren't inside a callback fallback pattern. Grep and report any found.

7. **Type exports** — Every named export from `index.js` has a matching declaration in `index.d.ts`. List any mismatches.

8. **Git state** — `git status` shows no uncommitted changes (warn if there are staged changes, that's expected pre-commit).

### Output format

```markdown
## Release Readiness: vX.Y.Z

- [x] Version sync — all 4 files match (X.Y.Z)
- [x] CHANGELOG — entry found for X.Y.Z
- [ ] Tests — 2 failures (list them)
- [x] Types — clean
- [x] Lint — clean
- [x] Production logging — no leaks
- [ ] Type exports — missing: AppsFlyerPurchaseConnectorConfig
- [x] Git state — clean

**Result: NOT READY** (2 checks failed)
```

### Fail-closed guardrail

If `npm test` or `npx tsc` cannot run (missing node_modules, broken config), report the setup error. Do not skip the check or mark it as passed.

DO NOT COMMIT or fix anything. This is a read-only audit.
