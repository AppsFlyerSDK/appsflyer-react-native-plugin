# appsflyer-react-native-plugin

React Native bridge plugin wrapping the AppsFlyer iOS and Android native SDKs via a **New-Architecture TurboModule** (RN ≥ 0.76 required). Every native capability is routed through a single `executeRpc(requestJson)` call — no bespoke native method per feature.

## Before writing any non-trivial code

Use the **context7 MCP** to pull current best-practice documentation for any library or API you are about to touch. Focus on: performance (avoid redundant bridge crossings, prefer batched calls), efficiency (minimal allocations on the hot path, no blocking on the JS thread), clean code (idiomatic React Native / Swift / Kotlin patterns), and testability (seams that allow mocking at the TurboModule boundary without hitting native).

```
# Example: before changing TurboModule codegen or NativeEventEmitter wiring
mcp__context7__resolve-library-id  →  /facebook/react-native
mcp__context7__query-docs           →  "TurboModule NativeEventEmitter performance"
```

Pull docs for: `react-native` (TurboModule / Codegen), `jest` (mock patterns), `swift` / `kotlin` as needed. Prefer context7 over training-data recall for any versioned API — React Native's New Architecture APIs changed significantly in 0.74–0.76.

## Architecture

```
src/NativeAppsFlyer.ts          ← TurboModule Codegen spec (single executeRpc entry point)
index.js                        ← JS API surface — typed wrappers over callRpc / NativeEventEmitter
index.d.ts                      ← Hand-maintained TypeScript declarations
ios/RNAppsFlyer.mm              ← iOS TurboModule (NativeAppsFlyerSpec, delegates to Swift impl)
ios/RNAppsFlyerImpl.swift       ← iOS RPC dispatch + event-channel wiring
android/…/RNAppsFlyerModule.kt  ← Android TurboModule (NativeAppsFlyerSpec)
android/…/RNAppsFlyerPackage.kt ← Android package registration
ios/Frameworks/                 ← Vendored AppsFlyerRPC.xcframework (Phase A; replaced by CocoaPods in Phase B)
android/libs/                   ← Vendored plugin_bridge + af-android-sdk .aar (Phase A; replaced by Maven in Phase B)
expo/                           ← Expo config plugin (withAppsFlyer*)
PurchaseConnector/              ← Optional purchase validation module (TS) — legacy bridge, out of scope for this rewrite
```

Two native modules per platform: `RNAppsFlyer` (core, TurboModule) and `PCAppsFlyer` (purchase connector, still legacy bridge — untouched).

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

- `onDeepLinking` / conversion-data / `registerSessionReadyListener` registration must be called **synchronously, before `init`'s promise settles** — not because native buffers/gates these (it doesn't; registration is init-order-independent by design on both platforms), but because deferring into `init(...).then(...)` delays *dispatch*, which delays the one callback that's supposed to trigger `start()`. See `.claude/rules/bridge-patterns.md` §4.
- `appId` is required on iOS (numeric Apple ID), unused on Android — pass it unconditionally to `init(devKey, appId)`; no `Platform.select()` needed. Confirmed against Android's own RPC source (`plugin_bridge`'s `InitRequest` data class has no `appId` field at all — the parser reads only `devKey` and silently ignores any extra JSON fields).
- `index.js` is the published entry point with no transpilation — write ES module syntax compatible with Metro
- `index.d.ts` is hand-maintained — verify against the `data-model.md` Method Catalog and test on both platforms when changing
- Every native call goes through `callRpc` / `callRpcVoid` / `callRpcWithCallback` → `NativeAppsFlyer.executeRpc` — do **not** reach for `NativeModules` directly
- Any blocking native RPC call (e.g. `start`, `logEvent`, purchase validation) must dispatch off the JS thread — TurboModule codegen defaults do not guarantee this; verify with the native implementation
- Do **not** add a `CallbackGuard` (`WeakReference`) to the TurboModule — that pattern fixed an Old-Architecture bridge destruction bug that doesn't exist under TurboModules; Promises are held strongly by the bridge

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
