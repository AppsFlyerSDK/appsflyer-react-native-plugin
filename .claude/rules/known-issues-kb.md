# Known issues knowledge base

Issue-based KB derived from real GitHub issues. Reference when debugging user reports, reviewing PRs, or adding new features.

## Deep linking (62 issues — #1 category)

### Listener not firing
**Issues:** #650, #647, #630, #305, #292
**Root cause:** `onDeepLink` registered after `initSdk`, or native AppDelegate/MainActivity setup missing.
**Fix:** Register listeners before `initSdk`. Verify `continueUserActivity`/`openURL` in AppDelegate, intent filters in AndroidManifest.
**Test:** Killed state → open deep link → verify callback fires within 5s.

### Deferred deep link not working
**Issues:** #650 (Android), #305 (iOS)
**Root cause:** Conversion data round-trip is slow or fails. No "completed with no result" callback.
**Fix:** Use `onInstallConversionData` as fallback. Check `is_first_launch` flag.

### Inconsistent payload shape
**Issues:** #292, #242
**Root cause:** Android returns stringified JSON where iOS returns an object in some versions.
**Fix:** Always `JSON.parse` if typeof is string. Type definitions should reflect the union.

## iOS build failures (22 issues)

### Header not found
**Issues:** #633 (`AppsFlyerConsent.h`), #602 (`AppsFlyerAdRevenueData.h`), #646 (`react_native_appsflyer-Swift.h`)
**Root cause:** Podspec pins native SDK version; cached pods have stale headers.
**Fix:** `pod deintegrate && pod install --repo-update`. Match plugin version to compatible native SDK.

### Symbol collision
**Issues:** #497, #541 (redefinition of `SUCCESS`)
**Root cause:** Native SDK enum name collides with other libraries.
**Fix:** Upgrade to plugin version where enum was namespaced.

## Android build failures (13 issues)

### Namespace not specified
**Issues:** #583, #561
**Root cause:** AGP 8.0+ requires `namespace` in build.gradle. Plugin pre-6.15.1 lacks it.
**Fix:** Upgrade plugin to 6.15.1+.

### AndroidManifest merge conflicts
**Issues:** #627, #631
**Root cause:** Plugin manifest declares `tools:replace` that conflicts with other libraries.
**Fix:** Add explicit `tools:replace` in app's main AndroidManifest.xml.

## Native module null / not found (13 issues)

### RNAppsFlyer is null
**Issues:** #587, #401, #174, #333
**Root cause:** Autolinking not triggered after install, or New Architecture enabled with old plugin version.
**Fix:** Run `pod install` (iOS) / Gradle sync (Android). For New Architecture: upgrade to 6.15.1+. Restart Metro: `npx react-native start --reset-cache`.

## Expo compatibility (18 issues)

### Swift AppDelegate not supported
**Issues:** #638, #620
**Root cause:** Config plugin only modifies ObjC AppDelegate. Expo 52+ defaults to Swift.
**Fix:** Pending upstream fix. Workaround: manual native setup.

### Duplicate manifest entries
**Issues:** #672
**Root cause:** `withAppsFlyerAndroid.js` not idempotent.
**Fix:** Use `expo prebuild --clean` (not just `expo prebuild`).

## Runtime crashes (18 issues)

### Double callback invocation
**Issues:** #601
**Root cause:** Native bridge calls JS callback more than once.
**Fix:** `CallbackGuard` added in 6.17.8 (Android). Every new callback method must use it.

### ConcurrentModificationException
**Issues:** #447
**Root cause:** Thread safety issue in native Android SDK.
**Fix:** Upgrade native SDK to patched version.

### App hangs indefinitely on iOS during automated RPC runs (registerSessionReadyListener thread-safety stall)
**Issues:** discovered in E2E testing (2026-07-28), `demos/appsflyer-expo-app`
**Root cause:** `AppsFlyerLib.registerSessionReadyListener:` (inside the vendored `AppsFlyerRPC`/`AppsFlyerLib` native SDK, `AFRPCCoreHandler.handle`) reads `UIApplication.applicationState` from a background Swift-concurrency executor, not `@MainActor`. Main Thread Checker logs "UI API called on a background thread" at that call site, and in a specific timing window this stalls indefinitely — the app's "Run All Methods" button spins forever with no error, no timeout, no crash. Backgrounding then foregrounding the app unsticks it, because that forces UIKit's run loop to process whatever was pending. This is **not** a bug in this plugin's JS or Swift bridge code — `RNAppsFlyerImpl.swift` already correctly hops registration calls through `Task { @MainActor in ... }` (see `native-ios.md` §3); the unsafe read happens one layer deeper, inside the compiled `AppsFlyerLib` dependency itself, so it can't be patched in this repo.
**Fix (test app only, not a plugin-code fix):** `demos/appsflyer-expo-app/rpcCatalog.js`'s `start` catalog entry used to re-register `registerSessionReadyListener` (production pattern per `bridge-patterns.md` §4), which re-triggers the buggy native call every run. Since the session is already ready by that point in the catalog, `start` now checks `isSessionReady()` first and calls `appsFlyer.start()` directly, only falling back to registering if genuinely not ready — and `unregisterSessionReadyListener`'s catalog entry was moved to run *after* `start` instead of before it, so `index.js`'s internal registration guard (`ensureSessionReadyListenerRegistered`) is still marked "already requested" and doesn't re-fire the native call.
**Long-term fix:** file with AppsFlyer SDK team against `AppsFlyerLib`/`AppsFlyerRPC` — `registerSessionReadyListener:`'s implementation should read `UIApplication.applicationState` on the main thread (or avoid reading it from a background executor at all).
**Follow-up (2026-08-02a):** the `start` catalog guard only prevents *re-registration*; it can't prevent the stall on the catalog's very first, legitimate `registerSessionReadyListener` call (needed once per normal usage), which can still wedge the native RPC executor and hang every subsequent `await` in `runAll` (e.g. `isSessionReady`, then everything after it) with no error. A first pass added an 8s timeout (`withTimeout`) around each button-triggered call so a wedge fails fast instead of hanging forever — but once the executor is actually wedged, every remaining queued call times out too, so a run just became "everything fails after 8s each" instead of "hangs forever". That timeout was extended to bail out of the whole run (marking the rest `skipped`) on the first timeout, rather than paying `RPC_TIMEOUT_MS` per remaining method.
**Follow-up (2026-08-02b) — structural fix:** the real fix is to stop racing button-triggered RPCs against the registration at all. `demos/appsflyer-expo-app/App.js` now runs `init`/`setIsDebug`/`onInstallConversionData`/`onInstallConversionFailure`/`onDeepLink`/`registerSessionReadyListener` once automatically on mount, via a `useEffect`, mirroring `example/src/App.tsx`'s `runAutoFlow` order exactly — `init()` fired but NOT awaited, listener registrations as synchronous statements right after (bridge-patterns.md §4; an earlier draft of this fix `await`ed `init()` before registering listeners, which is the exact too-late `.then()` anti-pattern that rule warns about, and silently broke the callback — see follow-up 2026-08-02c). The registerSessionReadyListener callback sets `sessionReady` state; the "Run All Methods" button (`RPC_CATALOG`, everything else) stays disabled with a "Waiting for session…" label until it fires, then shows "Session ready". `start` is simplified to a direct `appsFlyer.start()` call with no isSessionReady-check-then-register fallback, since by the time Run All is enabled the session is already known ready.
**Follow-up (2026-08-02c) — the stall still reproduces at bootstrap, confirmed:** even with correct registration ordering, `registerSessionReadyListener`'s native call can still stall and never invoke its callback — reproduced live, confirmed fixed by backgrounding then foregrounding the app (matches this entry's original root-cause description exactly). This is unavoidable: `registerSessionReadyListener` must fire once, unconditionally, at real app launch — there's no button-triggered path to defer it to. `App.js` now shows a hint ("Stuck? ... background the app, then reopen it") if `sessionReady` hasn't fired within 6s, so the demo doesn't look silently broken. This is UX-only; the native race itself remains unpatched and unpatchable from this repo.

## Event tracking / logEvent (13 issues)

### 404 on logEvent
**Issues:** #491, #390
**Root cause:** Wrong `appId` on Android (should be package name or omitted, not iOS App Store ID).
**Fix:** Use `Platform.select()` for `appId`. On Android: omit or use package name.

### "no devKey" error
**Issues:** #645
**Root cause:** `logEvent` called before `initSdk` completes.
**Fix:** Await `initSdk` resolution before calling `logEvent`.

### logEvent callback never fires on Android (CallbackGuard WeakReference)
**Issues:** discovered in E2E testing (2026-05-12)
**Root cause:** `CallbackGuard` (added in 6.17.8) wraps `Callback` in `WeakReference<Callback>`. All other methods invoke callbacks synchronously before the `@ReactMethod` returns, so the strong reference on the call stack keeps them alive. `logEvent` is the only method where the callback fires asynchronously — `AppsFlyerRequestListener.onSuccess()` runs on a background thread ~2s later after the HTTP round-trip. By then, GC has collected the weakly-referenced `Callback`.
**Symptoms:** Native SDK sends events successfully (200 OK in logcat), but JS success/error callbacks are silently swallowed. No error logged.
**Fix:** Use the Promise-based API (`logEvent(name, values)` without callbacks → returns Promise) which uses `Promise` instead of `Callback`. `Promise` is held strongly by the bridge and is not affected.
**Long-term fix:** `CallbackGuard` should use a strong reference for async callbacks, or `logEvent` should keep a strong reference alongside the `WeakReference`.

## Privacy / ATT / compliance (20 issues)

### ITMS-91064 App Store rejection
**Issues:** #673
**Root cause:** `static_framework = true` places PrivacyInfo.xcprivacy where Apple's tooling doesn't scan.
**Fix:** Use dynamic linking (`static_framework = false`).

### ATT popup not showing
**Issues:** #328, #619
**Root cause:** `waitForATTUserAuthorization` must be set before `start()`. User must be prompted first.
**Fix:** Call `requestTrackingAuthorization` before `initSdk`, set timeout value.

### Android AD_ID permission
**Issues:** #593, #562
**Root cause:** Google Play requires explicit `AD_ID` permission declaration.
**Fix:** Add `<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>` to app manifest.

## TypeScript types (11 issues)

### Types don't match runtime
**Issues:** #670, #575, #475, #194
**Root cause:** `index.d.ts` is hand-maintained and drifts from actual native output.
**Fix:** Verify types against native output on both platforms. Use `patch-package` as user workaround.

## RN version compatibility (13 issues)

### podspecPath / config.js invalid
**Issues:** #458, #421, #403, #395
**Root cause:** RN 0.68+ changed `react-native.config.js` schema.
**Fix:** Upgrade plugin to version matching RN version.

### NativeEventEmitter warning
**Issues:** #335
**Root cause:** RN 0.65+ requires `addListener`/`removeListeners` on native modules.
**Fix:** Upgrade to plugin version with stub methods.

### Event callbacks silent with local path dependency (file:..)
**Issues:** SO#79083213, discovered during E2E 2026-05-12
**Root cause:** When the plugin is referenced via `"file:.."` in `package.json` (local development), both the plugin root and the example app get their own `node_modules/react-native`. The plugin's `index.js` creates a `NativeEventEmitter` from its copy, while the app runtime uses the example's copy — two separate event bus instances. All event callbacks (`onDeepLink`, `onInstallConversionData`, `onAppOpenAttribution`) silently fail because listeners register on bus A while native emits on bus B.
**Fix:** In the example/demo app's `metro.config.js`, add `extraNodeModules` to force all `react-native` imports to resolve from the example's `node_modules`, and `blockList` to prevent Metro from resolving the parent's copy:
```js
extraNodeModules: {
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  react: path.resolve(__dirname, 'node_modules/react'),
},
blockList: [
  new RegExp(path.resolve(pluginRoot, 'node_modules/react-native').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*'),
  new RegExp(path.resolve(pluginRoot, 'node_modules/react').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*'),
],
```
**Note:** This only affects local development. npm consumers have a single `react-native` instance and are unaffected.
