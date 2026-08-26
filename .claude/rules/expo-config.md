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

Both matchers are exact-string-match against one template shape — if Expo/RN changes the default AppDelegate boilerplate, the matcher silently misses (falls through to `WarningAggregator.addWarningIOS`, not a build failure) instead of adapting. Re-verify the matched strings against a fresh `expo prebuild` output whenever bumping the supported Expo SDK version.

## Manifest merge is not idempotent

`withAppsFlyerAndroid.js` appends `tools:replace` entries to `AndroidManifest.xml` without checking for existing entries — repeated `expo prebuild` (without `--clean`) duplicates them and breaks the Android build. Always check if the entry exists before appending.

## Expo Go incompatibility

Requires native modules unavailable in Expo Go — only works in development builds (`eas build --profile development`) or bare workflow.

## No test coverage

Zero test coverage on the config plugins. Manual test with `expo prebuild --clean` on both platforms after any change.

## Peer dependency

`expo` is an optional peer dependency — guard all Expo-specific imports/config so the plugin works without Expo installed.

## Testing changes

```bash
cd demos/demo && npx expo prebuild --clean
cat android/app/src/main/AndroidManifest.xml | grep -A5 "appsflyer"
cat ios/demo/AppDelegate.swift  # or AppDelegate.m pre-Expo-52
```
