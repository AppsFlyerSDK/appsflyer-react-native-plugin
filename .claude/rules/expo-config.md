---
paths:
  - "expo/**"
---

# Expo config plugin rules

Scope: `expo/withAppsFlyer.js`, `withAppsFlyerIos.js`, `withAppsFlyerAndroid.js`. These run at `expo prebuild` time to modify native project files; the host app must have New Architecture enabled (not enforced by the plugin itself).

## Structure

```
expo/
├── withAppsFlyer.js          ← Entry point, composes iOS + Android plugins
├── withAppsFlyerIos.js       ← Modifies AppDelegate (ObjC + Swift) + Podfile
└── withAppsFlyerAndroid.js   ← Modifies AndroidManifest.xml
```

## Swift AppDelegate support

`withAppsFlyerIos.js`'s `modifySwiftAppDelegate` string-matches Expo's default Swift AppDelegate template (`didFinishLaunchingWithOptions`/`openURL`/`continueUserActivity`) and injects `handleLaunchOptions`/`handleOpen`/`continueUserActivity` calls via `AppsFlyerAttribution.shared` (one `import react_native_appsflyer`, no `AppsFlyerLib` import needed). `modifyObjcAppDelegate` handles the legacy ObjC template the same way.

Expo SDK 58's scene-based template inherits `openURL`/`continueUserActivity` from `ExpoAppDelegate` instead of declaring them. When `class AppDelegate: ExpoAppDelegate` is present and a handler is missing, `modifySwiftAppDelegate` inserts it and forwards to `super`, so Expo subscribers keep receiving the event. It skips a handler the app already declares, and it adds nothing for other superclasses.

The ObjC matcher and the Swift `didFinishLaunchingWithOptions` matcher are still exact-string-match against one template shape — if Expo/RN changes that boilerplate, the matcher silently misses (falls through to `WarningAggregator.addWarningIOS`, not a build failure) instead of adapting. Re-verify the matched strings against a fresh `expo prebuild` output whenever bumping the supported Expo SDK version.

## Manifest edits

`withAppsFlyerAndroid.js` never adds `tools:replace` entries. It sets `xmlns:tools` only when missing and adds the purchase-connector gradle property only when absent. With `preferAppsFlyerBackupRules` it deletes `android:dataExtractionRules`/`android:fullBackupContent` and removes those names from `tools:replace`. Repeated `expo prebuild` cannot duplicate entries from this file.

Expo runs mods in reverse `plugins` order, so list `react-native-appsflyer` before the plugin that adds the backup attributes (e.g. `expo-secure-store`). Listed after it, our mod runs first, finds nothing to remove, and `preferAppsFlyerBackupRules` silently does nothing.

## Expo Go incompatibility

Requires native modules unavailable in Expo Go — only works in development builds (`eas build --profile development`) or bare workflow.

## Test coverage

- `__tests__/expo-app-delegate.test.js` covers Swift AppDelegate patching against the Expo SDK 54/57/58 templates in `__tests__/fixtures/app-delegates/`.
- `__tests__/expo-android-backup-rules.test.js` covers the stale `tools:replace` cleanup in `preferAppsFlyerBackupRules`.
- Podfile flags, the ObjC AppDelegate path, and the purchase-connector flag have no tests. Manual test with `expo prebuild --clean` on both platforms after any change.

## Peer dependency

`expo` is an optional peer dependency — guard all Expo-specific imports/config so the plugin works without Expo installed.

## Testing changes

```bash
cd demos/demo && npx expo prebuild --clean
cat android/app/src/main/AndroidManifest.xml | grep -A5 "appsflyer"
cat ios/demo/AppDelegate.swift  # or AppDelegate.m pre-Expo-52
```
