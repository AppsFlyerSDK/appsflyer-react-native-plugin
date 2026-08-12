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

### iOS deferred deep link permanently fails to resolve if `registerDeepLinkListener` is called before `init()` — one-shot DDL request built with an unconfigured host
**Issues:** discovered live in `demos/appsflyer-react-native-app` (2026-08-09) — native log `[com.appsflyer.serial] [DDL] URL: https://(null)dlsdk.(null)/v1.0/ios/id?sdk_version=7.0&af_sig=...`
**Root cause:** verified against the vendored native SDK source (`/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerLib/`). `AppsFlyerLib`'s `-init` (run once, at singleton construction) sets `_route = [[AFSDKRouter alloc] init]` — the trivial no-arg initializer, which leaves `_host`/`_hostPrefix` unset (nil). `_route` is only replaced with a properly configured instance (`initWithHost:hostPrefix:` or `initWithAppleId:`) inside the native method that processes `init(devKey, appId)`, once `_appleAppID`/`_appsFlyerDevKey` are actually set (`AppsFlyerLib.m` ~line 379). Separately, `setDeepLinkDelegate:` — which is what `registerDeepLinkListener`'s underlying RPC call (`subscribeForDeepLink` / `registerDeeplinkListener`) triggers on the native SDK — kicks off deferred-deep-link (DDL) resolution via a `dispatch_once` block ("Resolve DeepLink just right after set delegate", `AppsFlyerLib.m` ~line 3185), calling `__resolveDeeplinkWithObject:` immediately and unconditionally, with **no gate on `init()` having run first**. If `registerDeepLinkListener` is registered before `init()` completes, this one-shot DDL request fires immediately using the still-unconfigured `_route` (nil host, nil hostPrefix), producing a malformed URL (`https://(null)dlsdk.(null)/v1.0/ios/id?...`, confirmed via `AFSDKRouter.m`'s `DDLURL:`/`getRelevantPrefix:`) that cannot resolve to a real host. Because the trigger is a `dispatch_once`, **this is not a retryable race** — once burned on a malformed request, no later, correctly-configured attempt happens for the rest of that app process's lifetime; only relaunching the app gets another chance.
**This contradicts `bridge-patterns.md` §4's general claim** that listener registration is "init-order-independent by design" — that claim holds for `registerConversionListener` (confirmed: `setDelegate:`, the conversion-data delegate setter, only assigns `_delegate` and logs a deprecation warning, with zero eager network trigger) but does **not** hold for `registerDeepLinkListener`, which is now a second documented exception alongside `registerSessionReadyListener`'s TOCTOU crash (see above).
**Not fixable from this repo's JS layer beyond correct call ordering**: the one-shot trigger and the router's default nil-host state are both inside the vendored `AppsFlyerLib` binary.
**Fix:** call `registerDeepLinkListener` only after `init()` has resolved (or at minimum after native has received `devKey`/`appId`), never before or concurrently with it — mirroring the same constraint `registerSessionReadyListener` already has, for a different underlying native reason. `demos/appsflyer-react-native-app`'s `AppsFlyer.js` already does this (`registerDeepLinkListener` is called after `await appsFlyer.init(...)` resolves, inside `AFInit`). `registerConversionListener` has no such constraint and may still register before `init()` per `bridge-patterns.md` §4.
**Long-term fix:** file with the AppsFlyer SDK team — `setDeepLinkDelegate:`'s one-shot DDL trigger should either wait for `init()`/`start()` to have configured the host first, or be made retryable instead of a single `dispatch_once` shot.

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
**Root cause:** Config plugin only modified ObjC AppDelegate. Expo 52+ defaults to Swift.
**Fix:** `withAppsFlyerIos.js`'s `modifySwiftAppDelegate` now handles the Swift template directly (verified against real `expo prebuild` output). Also fixed as part of the same pass: the plugin never injected `AppsFlyerLib.shared().handleLaunchOptions(launchOptions)` into `didFinishLaunchingWithOptions` (needed for cold-start deep link/attribution resolution) on either ObjC or Swift, and the Swift `continue(userActivity, restorationHandler:)` injection hardcoded `nil` instead of forwarding the real `restorationHandler` closure — both now match the manually-integrated reference pattern in `demos/appsflyer-react-native-app`'s `AppDelegate.swift`.

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

### `registerSessionReadyListener` can crash on real (non-automated) app launch: `devKey`/`appleAppID` TOCTOU race (AppsFlyerRPCBridge unstructured Task)
**Issues:** discovered live in `demos/appsflyer-react-native-app` (2026-08-05), `AppsFlyerExample` — `*** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'devKey and appleAppID must be set before calling registerSessionReadyListener:'`
**Root cause:** verified against the vendored `AppsFlyerRPC` source checkout (`/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC/`). This is a TOCTOU race, not a plugin-code bug: `RNAppsFlyerImpl.swift`'s `dispatchToNative` correctly submits `init` then `registerSessionReadyListener` in order, each via `Task { @MainActor in AppsFlyerRPCBridge.shared.executeJson(...) }` — those two outer Tasks do start in FIFO order on MainActor, exactly as the code comment there claims. But `AppsFlyerRPCBridge.executeJson(_:completion:)` (`Bridge/AppsFlyerRPCBridge.swift:56-59`) immediately forks each call into its own **unstructured** `Task { await rpcClient.execute(...) }` with no actor isolation and no queue serializing it against any other in-flight RPC. So the *set* (`sdk.initialize(devKey:appId:)`, `AFRPCCoreHandler.swift:61`, from the `init` RPC) and the *check-then-use* (`AppsFlyerLib.registerSessionReadyListener:`'s own assertion + `sdk.registerSessionReadyListener` call, `AFRPCCoreHandler.swift:140`, from the second RPC) run as two independent racing Tasks on the concurrent thread pool — whichever wins the scheduler determines whether the assertion sees devKey/appleAppID as already set. `AFRPCRequestHandler` (the coordinator both calls funnel through) is a plain `NSObject`, not an actor, and has no lock serializing request *processing* (only `AFRPCHandlerStateActor` gates event *emission*) — so there is nothing anywhere in the vendored RPC layer preventing this. Same failure class as the off-actor `applicationState` read documented below (native concurrency bug inside the vendored `AppsFlyerRPC`/`AppsFlyerLib` dependency), but this one crashes the app outright on ordinary launch — it doesn't need the automated E2E "Run All Methods" pattern to trigger, and it's timing-dependent so it won't repro every launch.
**Not fixable from this repo:** the race is entirely inside the vendored `AppsFlyerRPC` framework's RPC dispatch (`AppsFlyerRPCBridge.executeJson`), not in `RNAppsFlyerImpl.swift`. Our bridge already does the correct thing per `native-ios.md` §4 (synchronous, in-order dispatch, no buffering) — there's no way to serialize RPC *processing* order from the calling side once each `executeJson` call has forked its own detached Task.
**Fix:** none available in this plugin. File with the AppsFlyer SDK team: `AppsFlyerRPCBridge.executeJson` needs to serialize RPC execution (e.g. an actor-isolated queue, or awaiting the previous in-flight `Task` before starting the next) instead of spawning unordered, unstructured `Task {}` per call.

### Android session-ready can silently stall if `init()` runs after the host Activity's first `onResume` (RNAppsFlyerModule Application-context timing)
**Issues:** flagged in PR #693 review (pazlavi): "need to verify if the Android SDK will work correctly if we initialized with the Application context after the Activity's `onResume` passes"
**Root cause:** verified against the vendored native SDK source (`/Users/Amit.Levy/appsflyer-android-sdk/`). `RNAppsFlyerModule.kt` passes `reactApplicationContext` (a `ContextWrapper`, never literally an `Activity`) into `AppsFlyerRpcHandler`, which forwards it unchanged to `appsFlyerLib.init(devKey, null, context)`. `AndroidUtils.getApplicationInstance()` (`internal/util/AndroidUtils.java:202-216`) safely resolves this down to the real `Application` — no crash risk, the unsafe cast path is try/caught. But `AndroidLifecycleManagerImpl.registerLifecycleListener()` (`internal/android_lifecycle/AndroidLifecycleManagerImpl.kt:23-43`) only manually replays a missed `onActivityResumed` transition when the *init-time context itself* is literally an `Activity` (`if (context is Activity) { activityLifecycleCallbacks?.onActivityResumed(context) }`). Since `reactApplicationContext` is never an `Activity`, this backfill can never apply to our TurboModule's init call. Android's own `registerActivityLifecycleCallbacks` never retroactively fires for an already-resumed Activity (a platform limitation, not an AppsFlyer bug) — so if `init()` runs after the host Activity's first `onResume` (plausible as the *default* path for a single-Activity RN app, since JS only starts running after `ReactActivity`'s first resume), `onBecameForeground` — which drives `SessionReadyManager`'s foreground evaluation, i.e. everything `registerSessionReadyListener`/`start()` depend on — won't fire until the *next* real `onResume` (backgrounding + re-foregrounding, or a second Activity resuming). For a typical single-Activity app that can mean never, until the user manually does that. Only documented native-side guidance is a soft javadoc recommendation ("should be called inside your Application class's onCreate", `AppsFlyerLib.java:266-268`) — nothing enforces it or warns about this specific consequence.
**Not fixable from this repo:** `af-android-plugin-bridge` is a compiled Maven dependency now (`android/build.gradle`), not vendored source — `AppsFlyerRpcHandler`'s `context` field is fixed at construction and never re-resolved per RPC call, so there's no way to retroactively hand it a fresher `currentActivity` at the moment `init()` actually dispatches, even though `reactApplicationContext.currentActivity` would very likely be non-null by then. Same failure class as the iOS session-ready stall above (native lifecycle/threading gap the plugin can't patch), just triggered by Android's lifecycle-callback registration gap instead of iOS's off-thread `applicationState` read.
**Fix:** none available in this plugin. File with the AppsFlyer Android SDK team: either (a) accept an `Activity`/context supplier that can be re-resolved lazily at first-foreground-check time instead of frozen at `init()`, or (b) have `AndroidLifecycleManagerImpl` fall back to checking the actual current lifecycle state (e.g. via `ProcessLifecycleOwner`) instead of only replaying a backfill when the init-time context happens to be an `Activity`.

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
