---
paths:
  - "package.json"
  - "CHANGELOG.md"
  - "*.podspec"
---

# Release and versioning rules

## Version surface — 3 literals must stay in sync

| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"7.0.2"` |
| `ios/RNAppsFlyer.h` | `kAppsFlyerPluginVersion` | `@"7.0.2"` |
| `android/…/RNAppsFlyerConstants.kt` | `PLUGIN_VERSION` | `"7.0.2"` |

`react-native-appsflyer.podspec` reads `s.version = pkg["version"]` from `package.json` at pod-install time — it is **not** a separate literal to edit; doing so has no effect.

## Version scheme

Plugin version mirrors native SDK major.minor, with its own independent patch number (e.g. `7.0.2` wraps iOS SDK `7.0.13` / Android `af-android-sdk` `7.0.1`).

## Semver rules

| Change type | Bump | Trigger |
|-------------|------|---------|
| Major | — | Removed public method, changed signature |
| Minor | New API additions | New exported method/constant |
| Patch | Native SDK updates, bug fixes, doc-only | Everything else |

## Deprecation pattern

```ts
console.warn('validateAndLogInAppPurchase is deprecated. Use AppsFlyerPurchaseConnector instead.');

/** @deprecated Use AppsFlyerPurchaseConnector instead */
export function validateAndLogInAppPurchase(...): void;
```

Deprecated methods must keep working at runtime. Add a backward-compat test in `__tests__/compatibility.test.js`.

## CHANGELOG format

```markdown
## 7.0.2
 Release date: *2026-08-25*

- React Native >> Description of change
- React Native >> Another change
```

- Entries use the `React Native >>` prefix
- Dates in ISO format (YYYY-MM-DD)
- Newest version at top
- Breaking changes get their own "Breaking changes" subsection with before/after

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `dev/DELIVERY-{ticket}/description` | `dev/DELIVERY-128515/latest-rpc-module-update` |
| Release | `releases/{major}.x.x/{major}.{minor}.x/{version}-rc{N}` | `releases/7.x.x/7.0.x/7.0.2-rc1` |
| Hotfix | `{author}-patch-{N}` | `al-af-patch-1` |

## Tag convention

All tags use the `v` prefix (`v6.18.0`, `v7.0.2`, ...). `release.yml` tags every production release (`v$VERSION`) and every RC (`v$VERSION-rcN`).

## Native SDK dependency update

1. Update `react-native-appsflyer.podspec` dependency version
2. Update `android/build.gradle` dependency version
3. Confirm existing bridge methods still compile against new headers
4. Check the native SDK's CHANGELOG for breaking changes affecting the bridge
5. If new native APIs were added, decide whether to bridge them (minor bump if yes)

## Release checklist

1. All 3 version constants updated and matching
2. CHANGELOG.md updated with a new entry at top
3. `npm test` passes
4. `npx tsc --noEmit` passes
5. Manual test on iOS simulator and Android emulator
6. Demo app builds and runs on both platforms

See `release.yml`/`promote-release.yml` for the actual RC → QA → production automation.
