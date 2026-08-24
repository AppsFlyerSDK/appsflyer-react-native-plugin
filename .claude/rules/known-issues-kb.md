# Known issues knowledge base

Issue-based KB derived from real GitHub issues. Reference when debugging user reports, reviewing PRs, or adding new features.

## Bridge architecture decisions (not GitHub issues, but recurring "why doesn't this buffer exist" questions)

### Listener-registration buffer removed on both platforms (2026-08)
**Context:** both native bridges used to hold `init`/listener-registration RPCs in a JS-repo-side queue (`RpcInitGate.kt` on Android; an `initCompleted`/`pendingRegistrations` gate in `RNAppsFlyerImpl.swift`, modeled on a Cordova prior-art fix, commit `9ee0552`) until `init` resolved, on the assumption native silently drops early registrations.
**Why removed:** confirmed against the vendored native RPC source on both platforms (`AppsFlyerRpcHandler.kt`; `AFRPCCoreHandler.swift`/`AFRPCListenerHandler.swift`) that registration is init-order-independent by design — each just assigns a delegate/callback on the persistent SDK singleton, and the `AppsFlyerRPC` README documents this as intended parity with the native SDK. The assumption didn't hold; removed after confirming with the SDK team.
**Do not re-add a buffer/gate on either platform** without first confirming an actual native regression (and filing it upstream) — see PR #693's review discussion. `bridge-patterns.md` §4, `native-ios.md` §4, and `native-android.md` §1 all point here instead of re-explaining this.
**Exceptions that remain** (native-side effects, not a buffering problem — each has its own entry below): `registerSessionReadyListener`'s TOCTOU crash, Android `registerDeepLinkListener`'s pre-init requirement. (iOS `registerDeepLinkListener`'s one-shot DDL bug was fixed upstream — see its entry below.)

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

### Android `registerDeepLinkListener` must be called before `init()` — no buffering on the native side
**Issues:** discovered while explaining the RN Android deep-link flow (2026-08-13), verified against the vendored native SDK source (`/Users/Amit.Levy/appsflyer-android-sdk/`)
**Root cause:** `AFDeepLinkManager.onDeepLinking()`/`onDeepLinkingSuccess()`/`onDeepLinkingError()` (`AFDeepLinkManager.java:239-267`) all guard on `if (listener != null)` with **zero buffering** — a result that arrives while `listener` is still null is dropped permanently. This is a real constraint, not conservative folklore (unlike the general listener-registration order-independence documented above).
**Fix:** register before `init()`, both platforms — see the canonical call order in `bridge-patterns.md` §4. (An earlier version of this entry relied on an RN-launch-timing coincidence to justify registering after `init()` on Android; that reasoning was dropped once the call order was unified across both platforms — no need to depend on timing margins anymore.)

### iOS `registerDeepLinkListener`-before-`init()` used to permanently break DDL resolution — fixed upstream
**Fixed upstream, verified against source** (`/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerLib/AppsFlyerLib.m`, commits `d67d33652` "fix: gate DDL resolve on devKey/appleAppID readiness" and `1900faf59` "fix(deep-linking): Ensure DDL delegate resolution is instance-specific"): `setDeepLinkDelegate:`'s one-shot (`dispatch_once`) DDL trigger now checks `_appsFlyerDevKey.length > 0 && _appleAppID.length > 0` before firing — if `registerDeepLinkListener` is called before `init()`, it now skips silently instead of firing a malformed request against the unconfigured `_route`. The `init(devKey, appId)` code path unconditionally retries `__resolveDeeplinkWithObject:` afterward (no-ops if already resolved or if no delegate is set yet), so the deferred-deep-link resolution now happens correctly regardless of call order. `registerDeepLinkListener` is safe to call before `init()` on iOS, same as Android — see `bridge-patterns.md` §4 for the now-unified call order.
**Historical symptom (for anyone still on an older SDK):** malformed DDL URL in logs — `[com.appsflyer.serial] [DDL] URL: https://(null)dlsdk.(null)/v1.0/ios/id?...` — if `registerDeepLinkListener` was called before `init()` had configured the host.

### `registerDeepLinkListener` fabricates `status: 'NOT_FOUND'` on payloads that never had a status field (js-core-plugin dependency)
**Issues:** discovered via `npm test` failures on `dev/js-core-migration` (2026-08-12): `compatibility.test.js`, `rpc-contract.test.js`, `index.test.js` all failing with an unexpected extra `status: "NOT_FOUND"` key.
**Root cause:** verified against the compiled dependency (`node_modules/@appsflyer-sdk/js-core-plugin/dist/appsflyer-sdk.js`, `normalizeDeepLinkStatus`/`normalizeDeepLinkData`, ~lines 47-91). `registerDeepLinkListener` unconditionally runs every payload on the merged `onDeepLinkReceived`/`onDeepLinking` channel through `normalizeDeepLinkStatus`, whose `default` branch returns `'NOT_FOUND'` for any status that isn't `found`/`notfound`/`not_found`/`failure`/`error` — including `undefined` (no status field at all). This channel also carries legacy `onAppOpenAttribution`-merged data (per this repo's own compat test) that was never a deep-link resolution and never had a `status` field, so those payloads get a fabricated `status: 'NOT_FOUND'` stamped on regardless.
**Not fixable from this repo:** `@appsflyer-sdk/js-core-plugin` is a real npm dependency (`node_modules/`), not vendored source — there's no checkout to patch, and `index.ts` calls its `registerDeepLinkListener` directly, which wraps our callback internally with `normalizeDeepLinkData` before we ever see the raw event, so there's no interception point to strip the fabricated field back out.
**Fix (this repo):** updated the three affected tests to assert the dependency's actual behavior (`{...payload, status: 'NOT_FOUND'}`) instead of raw pass-through, with a comment pointing back to this entry.
**Long-term fix:** file with the js-core-plugin owners — `normalizeDeepLinkStatus`'s missing-field case should leave `status` unset (or the caller should skip normalization entirely for attribution-only payloads) instead of collapsing "no status field" into the same branch as "unrecognized status string".

### Android deferred deep link delivers `status: 'FOUND'` with an always-empty `deepLink: {}` (js-core-plugin dependency, Map-format parser fed real JSON)
**Issues:** reported live (2026-08-24) via demo app logs on fresh install: `registerDeepLinkListener` fired with `{status: "FOUND", deepLink: {}}` — no fields at all, not even the UDL-privacy-gated `deep_link_value`. Same install's already-installed (warm/cold start) opens deliver a populated object.
**Root cause:** verified end-to-end against both sides of the wire. Native (`AppsFlyerRpcHandler.kt:694`, `af-android-plugin-bridge`) sends `data["deepLink"] = deepLink.clickEvent.toString()`, where `clickEvent` is a real `org.json.JSONObject` (`DeepLink.java`: `private final JSONObject clickEvent`) — `.toString()` produces genuine JSON syntax (colon-separated, no `=`). But `@appsflyer-sdk/js-core-plugin`'s `normalizeDeepLinkPayload` (`node_modules/@appsflyer-sdk/js-core-plugin/dist/appsflyer-sdk.js`) assumes the opposite format — Java's `Map.toString()` (`{key=value, key2=value2}`) — and parses via `body.split(', ')` + `pair.indexOf('=')`. JSON contains no `=` character anywhere, so `indexOf('=')` is `-1` for every field on every real payload, every iteration hits `continue`, and the function returns `{}` unconditionally — not a privacy omission, a total parse failure. This is format-independent: it doesn't matter what `clickEvent` actually contains, any real JSON string input to this parser yields `{}`.
**Why direct/warm-start links aren't visibly affected:** the same buggy handler backs `registerDeepLinkListener` for both direct and deferred UDL results — so the bug should hit both equally. The likely reason direct opens look fine in practice is that apps typically read the Intent URL directly via `Linking`/React Navigation's deep-link config on an already-installed open, never touching `registerDeepLinkListener`'s `deepLink` field for that path. Fresh install has no Intent URL to fall back on — the server-side click match delivered through `registerDeepLinkListener` is the only channel — so it's the only case fully exposed to the bug.
**Not fixable from this repo:** `@appsflyer-sdk/js-core-plugin` is a real npm dependency, not vendored source — `index.ts` calls its `registerDeepLinkListener` directly, which normalizes the payload internally before this repo's code ever sees it.
**Long-term fix:** file with the js-core-plugin owners — `normalizeDeepLinkPayload`'s docstring claims it targets Android's `Map.toString()` rendering, but the actual wire format from `af-android-plugin-bridge` 7.0.12+ is `JSONObject.toString()`; the parser needs a `JSON.parse()` branch (with the existing `key=value` parser kept only as a fallback for any older SDK still emitting the legacy Map format, if one exists).

## iOS build failures (22 issues)

### Header not found
**Issues:** #633 (`AppsFlyerConsent.h`), #602 (`AppsFlyerAdRevenueData.h`), #646 (`react_native_appsflyer-Swift.h`)
**Root cause:** two distinct causes reported under this symptom — (1) podspec pins native SDK version and cached pods have stale headers (`#633`, `#602`); (2) for `#646` specifically, mixed Swift/ObjC without the bridging header wired up.
**Fix:** for (1): `pod deintegrate && pod install --repo-update`, match plugin version to compatible native SDK. For (2): verify `RNAppsFlyer-Bridging-Header.h` is set in Xcode build settings.

### Symbol collision
**Issues:** #497, #541 (redefinition of `SUCCESS`)
**Root cause:** Native SDK enum name collides with other libraries.
**Fix:** Upgrade to plugin version where enum was namespaced.

### Android `handleInit` used to wipe any previously-registered conversion listener — fixed upstream (`af-android-plugin-bridge` 7.0.12, DELIVERY-128454)
**Root cause:** `AppsFlyerLibCore.init(devKey, conversionDataListener, context)` (`AppsFlyerLibCore.java:513`) unconditionally calls `setConversionDataListener(conversionDataListener)` — a `null` second argument wipes any listener registered before `init()` ran. The plugin_bridge's old `handleInit` hardcoded `appsFlyerLib.init(request.devKey, null, context)`, silently dropping a `registerConversionListener` call made before `init()`.
**Fixed upstream, verified against the pinned `7.0.12` artifact** (decompiled `AppsFlyerRpcHandler.class`, matches `AppsFlyerRpcHandler.kt:246` on `development`): `handleInit` now passes the handler's own stored `conversionListener` field instead of `null`. Same commit also changed the handler's context storage from a frozen `context: Context` field to a lazily-invoked `contextProvider: () -> Context` — a breaking constructor rename; see `native-android.md` §9 for the call-site fix required in this repo.
**Same commit also fixes** the session-ready stall below — the `contextProvider` rename is what makes it possible for this repo to hand `init()` a resolved `currentActivity` instead of a frozen non-Activity context.

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

### `registerSessionReadyListener` can crash on real (non-automated) app launch: `devKey`/`appleAppID` TOCTOU race (AppsFlyerRPCBridge unstructured Task)
**Issues:** discovered live in `demos/appsflyer-react-native-app` (2026-08-05), `AppsFlyerExample` — `*** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'devKey and appleAppID must be set before calling registerSessionReadyListener:'`
**Root cause:** verified against the vendored `AppsFlyerRPC` source checkout (`/Users/Amit.Levy/XCodeProjects/appsflyer.sdk.ios/AppsFlyerRPC/`). This is a TOCTOU race, not a plugin-code bug: `RNAppsFlyerImpl.swift`'s `dispatchToNative` correctly submits `init` then `registerSessionReadyListener` in order, each via `Task { @MainActor in AppsFlyerRPCBridge.shared.executeJson(...) }` — those two outer Tasks do start in FIFO order on MainActor, exactly as the code comment there claims. But `AppsFlyerRPCBridge.executeJson(_:completion:)` (`Bridge/AppsFlyerRPCBridge.swift:56-59`) immediately forks each call into its own **unstructured** `Task { await rpcClient.execute(...) }` with no actor isolation and no queue serializing it against any other in-flight RPC. So the *set* (`sdk.initialize(devKey:appId:)`, `AFRPCCoreHandler.swift:61`, from the `init` RPC) and the *check-then-use* (`AppsFlyerLib.registerSessionReadyListener:`'s own assertion + `sdk.registerSessionReadyListener` call, `AFRPCCoreHandler.swift:140`, from the second RPC) run as two independent racing Tasks on the concurrent thread pool — whichever wins the scheduler determines whether the assertion sees devKey/appleAppID as already set. `AFRPCRequestHandler` (the coordinator both calls funnel through) is a plain `NSObject`, not an actor, and has no lock serializing request *processing* (only `AFRPCHandlerStateActor` gates event *emission*) — so there is nothing anywhere in the vendored RPC layer preventing this. This one crashes the app outright on ordinary launch — it doesn't need the automated E2E "Run All Methods" pattern to trigger, and it's timing-dependent so it won't repro every launch.
**Not fixable from this repo:** the race is entirely inside the vendored `AppsFlyerRPC` framework's RPC dispatch (`AppsFlyerRPCBridge.executeJson`), not in `RNAppsFlyerImpl.swift`. Our bridge already does the correct thing per `native-ios.md` §4 (synchronous, in-order dispatch, no buffering) — there's no way to serialize RPC *processing* order from the calling side once each `executeJson` call has forked its own detached Task.
**Fix:** none available in this plugin. File with the AppsFlyer SDK team: `AppsFlyerRPCBridge.executeJson` needs to serialize RPC execution (e.g. an actor-isolated queue, or awaiting the previous in-flight `Task` before starting the next) instead of spawning unordered, unstructured `Task {}` per call.
**Fixed upstream (2026-08-23), verified against source:** `AppsFlyerRPCBridge.executeJson` now calls `RPCQueue.submit`, a single FIFO lane over an `AsyncStream` with one consumer `Task` that `await`s each `client.execute(...)` fully before dequeuing the next request (`Core/RPCQueue.swift`) — `initialize`'s `sdk.initialize(devKey:appId:)` is guaranteed to complete before `registerSessionReadyListener` is even parsed.
**Correction (2026-08-23, same day):** this entry previously claimed `submit`/`setEventHandler` are "lock-guarded and safe to call directly from any thread" and that `RNAppsFlyerImpl.swift`'s `Task { @MainActor in ... }` wrapper could be dropped. That was wrong — verified against the framework's actual generated header (`AppsFlyerRPC-Swift.h`) and source (`README.md` §11: "`AppsFlyerRPCBridge` is `@MainActor` and `@objcMembers`"), both `executeJson` and `setEventHandler` are `@MainActor`-isolated, not lock-guarded. Calling them synchronously from `RNAppsFlyerImpl.swift`'s nonisolated context is a Swift 6 concurrency compile error, confirmed live via Xcode. The `Task { @MainActor in ... }` wrapper is reinstated for both calls — see `native-ios.md` §3. This does not reopen the TOCTOU race described above: the bridge's internal `RPCQueue` stream serializes enqueue order regardless of which thread submits (verified against `AppsFlyerRPCBridgeOrderingTests.swift`'s concurrent-callers test), so the Task hop only satisfies the compiler, it isn't what provides the ordering guarantee. Do **not** "fix" the compile error with `MainActor.assumeIsolated` instead — `RNAppsFlyer.mm` doesn't override `methodQueue`, so `executeRpc` runs on RN's shared background method queue by default, and `assumeIsolated` traps if called off-main-thread (the framework's own `testExecuteJson_calledFromBackgroundThread_completesSuccessfully` confirms off-main-thread calls are expected and must keep working).

### Android session-ready used to silently stall if `init()` ran after the host Activity's first `onResume` — fixed in this repo once `af-android-plugin-bridge` 7.0.12 made the context lazy
**Issues:** flagged in PR #693 review (pazlavi): "need to verify if the Android SDK will work correctly if we initialized with the Application context after the Activity's `onResume` passes"
**Root cause:** `AndroidLifecycleManagerImpl.registerLifecycleListener()` (`internal/android_lifecycle/AndroidLifecycleManagerImpl.kt:36-40`, still true as of the current checkout — verified against `/Users/Amit.Levy/appsflyer-android-sdk/`) only manually replays a missed `onActivityResumed` transition when the context passed to `init()` is literally an `Activity`. Android's own `registerActivityLifecycleCallbacks` never retroactively fires for an already-resumed Activity. `RNAppsFlyerModule.kt` used to pass `context = reactApplicationContext` (a `ContextWrapper`, never an `Activity`) — so for a typical single-Activity RN app (JS starts only after the host Activity's first `onResume`), the backfill could never apply and `onBecameForeground`/`SessionReadyManager` wouldn't fire until a second real resume.
**Fixed in this repo (not upstream):** the DELIVERY-128454 bundle (7.0.12) renamed `AppsFlyerRpcHandler`'s constructor param from a frozen `context: Context` field to `contextProvider: () -> Context`, invoked fresh on every call — `handleInit` calls `contextProvider()` at the moment `init()` actually dispatches, with its own code comment confirming intent: `// init registers lifecycle callbacks and triggers onActivityResumed when an Activity is passed`. `RNAppsFlyerModule.kt` now supplies `contextProvider = { reactApplicationContext.currentActivity ?: reactApplicationContext }`, so by the time `init()` dispatches, `currentActivity` is normally already resumed and the backfill fires immediately. Native-side gate is unchanged — the fix is entirely in how this repo now feeds it. See `native-android.md` §9.
**Residual risk:** if `init()` somehow dispatches before any Activity has resumed (`currentActivity` still null), this falls back to the old `reactApplicationContext` behavior and the stall can still occur — not expected on RN's normal launch path, but not structurally impossible either. No contract test yet for this fallback path.

### `registerConversionListener`'s callback intermittently never fires on Android — `init`/`registerConversionListener` executor lane-split race, fixed
**Issues:** discovered via `make e2e-android` intermittent failures (2026-08-24) — `is_first_launch_true` phase aborted: `registerConversionListener` RPC succeeded but no `onConversionDataSuccess`/`Fail` event was ever emitted natively. Reproduced via fresh logcat, not a log-truncation artifact.
**Root cause:** `AppsFlyerRpcHandler`'s `conversionListener` field (`AppsFlyerRpcHandler.kt:127`) is a plain unsynchronized `var`, written by `handleRegisterConversionListener` and read by `handleInit` (`appsFlyerLib.init(request.devKey, conversionListener, contextProvider())`, line 246). `RNAppsFlyerModule.kt`'s `executeRpc` routed `registerConversionListener`/`unregisterConversionListener` onto the single-thread `listenerExecutor` FIFO lane, but **`init` was missing from `LISTENER_LIFECYCLE_METHODS`** and ran on the separate 4-thread `rpcExecutor` pool instead. `example/src/App.tsx` (and any real app following the documented call order) fires `registerConversionListener(...)` and `init(...)` back-to-back without awaiting either — so with no shared FIFO lane between them, there's no ordering guarantee: if `init`'s task on `rpcExecutor` runs before `registerConversionListener`'s task on `listenerExecutor`, `handleInit` reads `conversionListener` as still `null` and the native SDK captures that for the session — the real listener registered moments later never gets the conversion-data callback for that launch. Intermittent because it depends on which pool's worker thread the scheduler runs first.
**Fix:** added `"init"` to `LISTENER_LIFECYCLE_METHODS` in `RNAppsFlyerModule.kt` so `init` shares the same single-thread FIFO lane as the 3 listener register/unregister pairs — restores JS-call-order execution ordering for the field `init` reads. `start`/`logEvent` were deliberately left on `rpcExecutor` (`IsListenerLifecycleCallTest.kt` still asserts `start` routes to the pool lane) — `handleStart`/`handleLogEvent` don't touch any of the 3 listener fields, and `start` can block 5-10s (native-android.md §3), which would head-of-line-block the listener lane if moved there.
**Regression test:** `IsListenerLifecycleCallTest.kt` — `init routes to the listener lane`.

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
**Root cause:** pre-js-core-migration, the core method type surface was hand-maintained directly in `index.ts` (no separate `index.d.ts`) and drifted from actual native output. That surface now comes from `@appsflyer-sdk/js-core-plugin` — see `typescript-types.md`.
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
**Root cause:** When the plugin is referenced via `"file:.."` in `package.json` (local development), both the plugin root and the example app get their own `node_modules/react-native`. The plugin's `src/rn-transport.ts` creates a `NativeEventEmitter` from its copy, while the app runtime uses the example's copy — two separate event bus instances. All event callbacks (`onDeepLink`, `onInstallConversionData`, `onAppOpenAttribution`) silently fail because listeners register on bus A while native emits on bus B.
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
