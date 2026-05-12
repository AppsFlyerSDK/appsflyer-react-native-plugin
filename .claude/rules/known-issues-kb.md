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

## Event tracking / logEvent (13 issues)

### 404 on logEvent
**Issues:** #491, #390
**Root cause:** Wrong `appId` on Android (should be package name or omitted, not iOS App Store ID).
**Fix:** Use `Platform.select()` for `appId`. On Android: omit or use package name.

### "no devKey" error
**Issues:** #645
**Root cause:** `logEvent` called before `initSdk` completes.
**Fix:** Await `initSdk` resolution before calling `logEvent`.

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
