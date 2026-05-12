---
paths:
  - "package.json"
  - "CHANGELOG.md"
  - "*.podspec"
---

# Release and versioning rules

Scope: version bumps, CHANGELOG.md, release branches, native SDK alignment.

## 1. Version surface — 4 files must stay in sync

| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"6.17.9"` |
| `react-native-appsflyer.podspec` | `s.version` | `'6.17.9'` |
| `ios/RNAppsFlyer.h` | `kAppsFlyerPluginVersion` | `@"6.17.9"` |
| `android/…/RNAppsFlyerConstants.java` | `PLUGIN_VERSION` | `"6.17.9"` |

Missing any one of these causes version mismatch bugs. Historical commits that were solely version constant syncs: `45a0cfeb`, `20c80b46`, `0b19d154`.

## 2. Version scheme

Plugin version mirrors native SDK major.minor, with its own patch:
- `6.17.9` = plugin wrapping iOS SDK 6.17.8 + Android SDK 6.17.5
- The plugin patch number is independent of native SDK patch numbers

## 3. Semver rules

| Change type | Bump | Examples |
|-------------|------|---------|
| Major | Never happened in 6.x era | Would require: removed public method, changed signature |
| Minor | New API additions | 6.9.1 (separated initSDK/startSDK), 6.13.0 (DMA support), 6.17.0 (Purchase Connector) |
| Patch | Native SDK updates, bug fixes, doc-only | 6.17.7 (SDK-only), 6.17.8 (bug fixes + new flags) |

## 4. Deprecation pattern

```js
// In index.js — runtime warning
console.warn('validateAndLogInAppPurchase is deprecated. Use AppsFlyerPurchaseConnector instead.');

// In index.d.ts — type annotation
/** @deprecated Use AppsFlyerPurchaseConnector instead */
export function validateAndLogInAppPurchase(...): void;
```

Deprecated methods must continue to work at runtime. Add a backward-compat test in `__tests__/compatibility.test.js`.

## 5. CHANGELOG format

```markdown
## 6.17.9
 Release date: *2025-01-15*

- React Native >> Description of change
- React Native >> Another change
```

Rules:
- Entries use `React Native >>` prefix
- Dates use ISO format (YYYY-MM-DD)
- Newest version at top (reverse chronological)
- Breaking changes get a separate "Breaking changes" subsection with before/after

## 6. Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `dev/DELIVERY-{ticket}/description` | `dev/DELIVERY-115184/update-6.17.9` |
| Release | `releases/6.x.x/6.{minor}.x/6.{minor}.{patch}-rc{N}` | `releases/6.x.x/6.17.x/6.17.9-rc3` |
| Hotfix | `{author}-patch-{N}` | `al-af-patch-1` |

## 7. Tag convention

Pre-6.x: tags use `v` prefix (`v1.2.0` through `v5.4.40`). The 6.x series has no tags — releases tracked via branches and CHANGELOG.

## 8. Native SDK dependency update

When updating the native SDK version:
1. Update `react-native-appsflyer.podspec` dependency version
2. Update `android/build.gradle` dependency version
3. Test that all existing bridge methods still compile against new headers
4. Check CHANGELOG of native SDK for breaking changes that affect the bridge
5. If native SDK added new APIs, decide whether to bridge them (minor bump if yes)

## 9. Release checklist

1. All 4 version constants updated and matching
2. CHANGELOG.md updated with new entry at top
3. `npm test` passes
4. `npx tsc --noEmit` passes
5. Manual test on iOS simulator and Android emulator
6. Demo app builds and runs on both platforms
