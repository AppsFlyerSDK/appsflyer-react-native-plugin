# Known issues knowledge base

Issue-based KB derived from real GitHub issues. Reference when debugging user reports, reviewing PRs, or adding new features. Resolved issues are kept only where the root cause explains a non-obvious current constraint — otherwise they're cut once fixed.

## Bridge architecture: no listener-registration buffer

Both native bridges used to hold `init`/listener-registration RPCs in a JS-side queue until `init` resolved, on the assumption native silently drops early registrations. That assumption was wrong: registration just assigns a delegate/callback on the persistent native SDK singleton, confirmed against native RPC source on both platforms — it's init-order-independent by design. The buffer was removed on both platforms.

**Do not re-add a buffer/gate on either platform** without first confirming an actual native regression. `bridge-patterns.md`, `native-ios.md`, and `native-android.md` all point here instead of re-explaining this.

**Real exception** (native-side effect, not a buffering problem): Android `registerDeepLinkListener`'s pre-init requirement, below.

## Deep linking

### Listener not firing
**Root cause:** `onDeepLink`/`registerDeepLinkListener` registered after `init`, or native AppDelegate/MainActivity setup missing.
**Fix:** Register listeners before `init`. Verify `continueUserActivity`/`openURL` in AppDelegate, intent filters in AndroidManifest.

### Deferred deep link not working
**Root cause:** Conversion data round-trip is slow or fails; no "completed with no result" callback.
**Fix:** Use `onInstallConversionData` as fallback. Check `is_first_launch`.

### Inconsistent payload shape
**Root cause:** Android returns stringified JSON where iOS returns an object in some versions.
**Fix:** Always `JSON.parse` if `typeof` is string. Type definitions should reflect the union.

### Android `registerDeepLinkListener` must be called before `init()` — still true, no native buffering
**Root cause:** `AFDeepLinkManager`'s `onDeepLinking()`/`onDeepLinkingSuccess()`/`onDeepLinkingError()` guard on `if (listener != null)` with zero buffering — a result arriving while `listener` is still null is dropped permanently. Real constraint, not folklore.
**Fix:** Register before `init()`, both platforms (canonical order in `bridge-patterns.md`).

### `registerDeepLinkListener` fabricates `status: 'NOT_FOUND'` on payloads with no status field
**Root cause:** `@appsflyer-sdk/js-core-plugin`'s `normalizeDeepLinkStatus` defaults any unrecognized/missing status to `'NOT_FOUND'`, including legacy `onAppOpenAttribution`-merged payloads that never had a status field.
**Not fixable from this repo** — real npm dependency, no interception point. Tests assert the dependency's actual behavior (`{...payload, status: 'NOT_FOUND'}`) rather than raw pass-through.
**Long-term fix:** needs to ship upstream in js-core-plugin.

### Android deferred deep link delivers `status: 'FOUND'` with an always-empty `deepLink: {}`
**Root cause:** native sends `deepLink.clickEvent.toString()` as real JSON, but js-core-plugin's `normalizeDeepLinkPayload` parses it assuming Java's `Map.toString()` format (`key=value` pairs). JSON has no `=`, so every field fails to parse and the function returns `{}` unconditionally.
**Why direct/warm-start opens look fine:** apps typically read the Intent URL directly via `Linking` on those paths, never touching this field — fresh install has no Intent URL to fall back on, so it's fully exposed.
**Not fixable from this repo** — real npm dependency. **Long-term fix:** js-core-plugin needs a `JSON.parse()` branch for the actual `af-android-plugin-bridge` 7.0.12+ wire format.

## iOS build failures

### Header not found
**Root cause:** either stale cached pod headers after a version bump, or mixed Swift/ObjC without the bridging header wired up.
**Fix:** `pod deintegrate && pod install --repo-update` for stale headers; verify `RNAppsFlyer-Bridging-Header.h` is set in Xcode build settings for the bridging-header case.

## Android build failures

### Namespace not specified
**Root cause:** AGP 8.0+ requires `namespace` in `build.gradle`.
**Fix:** upgrade plugin to 6.15.1+.

### AndroidManifest merge conflicts
**Root cause:** plugin manifest declares `tools:replace` that conflicts with other libraries.
**Fix:** add explicit `tools:replace` in the app's main AndroidManifest.xml.

## Native module null / not found

### RNAppsFlyer is null
**Root cause:** autolinking not triggered after install, or New Architecture enabled with an old plugin version.
**Fix:** `pod install` (iOS) / Gradle sync (Android); upgrade to 6.15.1+ for New Architecture; restart Metro with `--reset-cache`.

## Expo compatibility

### Duplicate manifest entries
**Root cause:** `withAppsFlyerAndroid.js` is not idempotent.
**Fix:** use `expo prebuild --clean`, not plain `expo prebuild`.

## Runtime crashes

### Double callback invocation
**Root cause:** native bridge calls the JS callback more than once.
**Fix:** `CallbackGuard` on Android — every new callback method must use it (legacy bridge only, see `native-android.md`).

### ConcurrentModificationException
**Root cause:** thread-safety issue in the native Android SDK.
**Fix:** upgrade native SDK to a patched version.

### Android session-ready can stall if `init()` runs before the host Activity's first `onResume`
**Root cause:** `AndroidLifecycleManagerImpl` only replays a missed `onActivityResumed` transition when the context passed to `init()` is literally an `Activity`. `RNAppsFlyerModule.kt` supplies `{ reactApplicationContext.currentActivity ?: reactApplicationContext }` (lazy, fresh per call) to cover the normal case, but if `init()` dispatches before any Activity has resumed, this falls back to `reactApplicationContext` and the stall can still occur.
**Not expected on RN's normal launch path; no contract test yet for this fallback.**

## Event tracking / logEvent

### 404 on logEvent
**Root cause:** wrong `appId` on Android (should be package name or omitted, not the iOS App Store ID).
**Fix:** `Platform.select()` for `appId`; omit or use package name on Android.

### "no devKey" error
**Root cause:** `logEvent` called before `init` completes.
**Fix:** await `init` resolution before calling `logEvent`.

### logEvent callback never fires on Android (legacy `CallbackGuard`)
**Root cause:** `CallbackGuard` wraps `Callback` in a `WeakReference`. Every other method invokes its callback synchronously (keeping it alive via the call stack), but `logEvent`'s callback fires ~2s later on a background thread after GC has already collected it.
**Fix:** use the Promise-based `logEvent` API — Promises are held strongly by the bridge and unaffected.

## Privacy / ATT / compliance

### ITMS-91064 App Store rejection
**Root cause:** `static_framework = true` places `PrivacyInfo.xcprivacy` where Apple's tooling doesn't scan it.
**Fix:** use dynamic linking (`static_framework = false`).

### ATT popup not showing
**Root cause:** ATT authorization must be requested and resolved before `start()`.
**Fix:** call `requestTrackingAuthorization` before `init`, with a timeout.

### Android AD_ID permission
**Root cause:** Google Play requires explicit `AD_ID` permission declaration.
**Fix:** add `<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>` to the app manifest.

## RN version compatibility

### Event callbacks silent with local path dependency (`file:..`)
**Root cause:** with a `"file:.."` dependency, the plugin and the app get separate `node_modules/react-native` copies — `src/rn-transport.ts` builds its `NativeEventEmitter` from one copy while the app runtime uses the other, so listeners register on one event bus while native emits on the other.
**Fix:** in the app's `metro.config.js`, force `react-native`/`react` to resolve from the app's own `node_modules` via `extraNodeModules`, and `blockList` the plugin's copies:
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
Only affects local development — npm consumers have a single `react-native` instance.
