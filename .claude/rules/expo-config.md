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

Expo SDK 58's scene-based template inherits `openURL`/`continueUserActivity` from `ExpoAppDelegate` instead of declaring them. The matcher requires `AppDelegate` subclassing exactly `ExpoAppDelegate` (`\b` word boundary; whitespace allowed around `:`), so other superclasses are skipped. When that class is present and a handler is missing, `modifySwiftAppDelegate` inserts it and forwards to `super`, so Expo subscribers keep receiving the event; it also skips a handler the app already declares.

The ObjC matcher and all three Swift injections into existing methods (`didFinishLaunchingWithOptions`, `openURL`, `continueUserActivity`) are exact-string-match against one template shape (only the missing-handler detection uses regexes) — if Expo/RN changes that boilerplate, the matcher silently misses (falls through to `WarningAggregator.addWarningIOS`, not a build failure) instead of adapting. Re-verify the matched strings against a fresh `expo prebuild` output whenever bumping the supported Expo SDK version.

## Manifest edits

`withAppsFlyerAndroid.js` never adds `tools:replace` entries. With `preferAppsFlyerBackupRules` it sets `xmlns:tools` when missing, deletes `android:dataExtractionRules`/`android:fullBackupContent`, and removes those names from `tools:replace`. The purchase-connector gradle property is added only when absent. Repeated `expo prebuild` cannot duplicate entries from this file. With the flag off, the plugin does not touch the manifest.

Expo runs mods in reverse `plugins` order, so list `react-native-appsflyer` before the plugin that adds the backup attributes (e.g. `expo-secure-store`). Listed after it, our mod runs first, finds nothing to remove, and `WarningAggregator` warns about plugin order.

## Expo Go incompatibility

Requires native modules unavailable in Expo Go — only works in development builds (`eas build --profile development`) or bare workflow.

## Test coverage

- `__tests__/expo-app-delegate.test.js`: Swift SDK 54/57/58 fixtures, ObjC AppDelegate, Podfile strict-mode and purchase-connector flags.
- `__tests__/expo-android-backup-rules.test.js`: `tools:replace` cleanup, purchase-connector Gradle property, manifest with no application tag.
- Still run `expo prebuild --clean` on both platforms after any plugin change.

## Peer dependency

`expo` is an optional peer dependency — guard all Expo-specific imports/config so the plugin works without Expo installed.

## Testing changes

```bash
cd demos/demo && npx expo prebuild --clean
cat android/app/src/main/AndroidManifest.xml | grep -A5 "appsflyer"
cat ios/demo/AppDelegate.swift  # or AppDelegate.m pre-Expo-52
```
