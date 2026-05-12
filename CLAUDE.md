# appsflyer-react-native-plugin

React Native bridge plugin wrapping the AppsFlyer iOS and Android native SDKs via `NativeModules`.

## Architecture

```
index.js          ← JS API surface (plain JS, no build step)
index.d.ts        ← Hand-maintained TypeScript declarations
ios/RNAppsFlyer.m ← iOS bridge (RCTEventEmitter subclass)
android/…/RNAppsFlyerModule.java ← Android bridge (ReactContextBaseJavaModule)
expo/             ← Expo config plugin (withAppsFlyer*)
PurchaseConnector/ ← Optional purchase validation module (TS)
```

Two native modules per platform: `RNAppsFlyer` (core) and `PCAppsFlyer` (purchase connector).

## Commands

```bash
# Tests
npm test                        # Jest with coverage
npx jest --testPathPattern=index # Run specific test file

# Lint
npm run lint                    # ESLint check
npm run lint:fix                # ESLint autofix

# TypeScript
npx tsc --noEmit                # Type-check (no output)

# iOS
cd demos/demo/ios && pod install --repo-update

# Android
cd demos/demo/android && ./gradlew clean
```

## Version surface (all must stay in sync)

| File | Field |
|------|-------|
| `package.json` | `version` |
| `react-native-appsflyer.podspec` | `s.version` |
| `ios/RNAppsFlyer.h` | `kAppsFlyerPluginVersion` |
| `android/…/RNAppsFlyerConstants.java` | `PLUGIN_VERSION` |

## Critical constraints

- `onDeepLink` listener must register **before** `initSdk` — not after, not in a late-mounting component
- `appId` is required on iOS (numeric Apple ID), optional on Android — use `Platform.select()`
- `index.js` is the published entry point with no transpilation — write ES module syntax compatible with Metro
- `index.d.ts` is hand-maintained and drifts from runtime behavior — verify against native output on both platforms
- Callbacks must fire exactly once across the bridge — Android uses `CallbackGuard` (AtomicBoolean + WeakReference)
- Native SDK delegate callbacks must dispatch to main thread before emitting to JS

## Do not duplicate

See `~/.claude/CLAUDE.md` for: ObjC/Swift conventions, security checklist, testing expectations, memory safety, threading patterns. Those apply here too.

## Rules

Domain-specific rules live in `.claude/rules/`:

| File | Scope |
|------|-------|
| `bridge-patterns.md` | JS ↔ native bridge contract |
| `native-ios.md` | iOS bridge: ObjC, CocoaPods, RCTEventEmitter |
| `native-android.md` | Android bridge: Java module, Gradle, CallbackGuard |
| `testing.md` | Jest patterns, mocks, coverage gaps |
| `typescript-types.md` | index.d.ts conventions, public API surface |
| `expo-config.md` | Expo config plugin (withAppsFlyer*) |
| `known-issues-kb.md` | Issue-based KB with real GitHub issue references |
| `release-versioning.md` | Versioning, CHANGELOG, native SDK alignment |
