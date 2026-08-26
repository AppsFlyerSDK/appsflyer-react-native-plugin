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
index.ts                        ← JS API surface AND type declarations in one file — re-exports @appsflyer-sdk/js-core-plugin's AppsFlyerSDK (built on RNTransport / NativeEventEmitter) plus the PurchaseConnector surface; package.json's "main"/"types" both point here directly (no build step, no separate index.js/index.d.ts)
ios/RNAppsFlyer.mm              ← iOS TurboModule (NativeAppsFlyerSpec, delegates to Swift impl)
ios/RNAppsFlyerImpl.swift       ← iOS RPC dispatch + event-channel wiring
android/…/RNAppsFlyerModule.kt  ← Android TurboModule (NativeAppsFlyerSpec)
android/…/RNAppsFlyerPackage.kt ← Android package registration
expo/                           ← Expo config plugin (withAppsFlyer*)
PurchaseConnector/              ← Optional purchase validation module (TS) — legacy bridge, out of scope for this rewrite
```

Two native modules per platform: `RNAppsFlyer` (core, TurboModule) and `PCAppsFlyer` (purchase connector, still legacy bridge — untouched). Native SDKs are real CocoaPods (`AppsFlyerRPC`, pinned in the podspec) / Maven (`af-android-sdk`, `af-android-plugin-bridge`, pinned in `android/build.gradle`) dependencies — nothing is vendored.

RPC method dispatch, wire-name/param resolution, and event demuxing live in the `@appsflyer-sdk/js-core-plugin` npm dependency, not in this repo — `index.ts` only supplies the `RNTransport` glue (`src/rn-transport.ts`) and re-exports that package's public API. See `.claude/rules/bridge-patterns.md`.

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
cd demos/appsflyer-react-native-app/ios && pod install --repo-update

# Android
cd demos/appsflyer-react-native-app/android && ./gradlew clean
```

## Version surface — 3 literals must stay in sync (podspec is derived, not a 4th literal)

| File | Field |
|------|-------|
| `package.json` | `version` |
| `ios/RNAppsFlyer.h` | `kAppsFlyerPluginVersion` |
| `android/…/RNAppsFlyerConstants.kt` | `PLUGIN_VERSION` |

`react-native-appsflyer.podspec` reads `s.version = pkg["version"]` from `package.json` at pod-install time — editing it directly does nothing. See `.claude/rules/release-versioning.md` §1.

## Critical constraints

- `onDeepLinking` / conversion-data / `registerSessionReadyListener` registration must be called **synchronously, before `init`'s promise settles** — not because native buffers/gates these (it doesn't; registration is init-order-independent by design on both platforms), but because deferring into `init(...).then(...)` delays *dispatch*, which delays the one callback that's supposed to trigger `start()`. See `.claude/rules/bridge-patterns.md` §4.
- `appId` is required on iOS (numeric Apple ID), unused on Android — pass it unconditionally to `init({devKey, appId})`; no `Platform.select()` needed. Confirmed against Android's own RPC source (`plugin_bridge`'s `InitRequest` data class has no `appId` field at all — the parser reads only `devKey` and silently ignores any extra JSON fields).
- `index.ts` is the published entry point (`package.json` `main`/`types`) with no transpilation step — write syntax compatible with Metro/Node directly; there is no separate `index.js`/`index.d.ts` pair
- `index.ts` only hand-maintains the `RNTransport` glue and the `PurchaseConnector` surface now — the core RPC method types come from `@appsflyer-sdk/js-core-plugin` (re-exported via `export *`). Verify any core-method type change against that dependency, not against a local interface.
- Every native call goes through `RNTransport.call` (`src/rn-transport.ts`) → `NativeAppsFlyer.executeRpc` — do **not** reach for `NativeModules` directly. `callRpc`/`callRpcVoid` no longer exist; dispatch now lives in `@appsflyer-sdk/js-core-plugin`.
- Any blocking native RPC call (e.g. `start`, `logEvent`, purchase validation) must dispatch off the JS thread — TurboModule codegen defaults do not guarantee this; verify with the native implementation
- Do **not** add a `CallbackGuard` (`WeakReference`) to the TurboModule — that pattern fixed an Old-Architecture bridge destruction bug that doesn't exist under TurboModules; Promises are held strongly by the bridge

## Writing code and docs

After writing or editing any code or docs-about-code in this repo, run the `deslop-comments` skill on the touched files before considering the change done — strip zero-loss comments, collapse "why"/workaround notes to one line, keep only directives/license verbatim. Prevents comment/doc bloat from accumulating across sessions.

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
| `typescript-types.md` | type declaration conventions (in `index.ts`), public API surface |
| `expo-config.md` | Expo config plugin (withAppsFlyer*) |
| `known-issues-kb.md` | Issue-based KB with real GitHub issue references |
| `release-versioning.md` | Versioning, CHANGELOG, native SDK alignment |
