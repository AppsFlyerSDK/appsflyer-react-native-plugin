---
paths:
  - "expo/**"
---

# Expo config plugin rules

Scope: `expo/` directory — `withAppsFlyer.js`, `withAppsFlyerIos.js`, `withAppsFlyerAndroid.js`.

**7.0.x context**: The core `RNAppsFlyer` module is now a TurboModule. The Expo config plugin's job (modifying AppDelegate / AndroidManifest at prebuild time) is unchanged, but the **New Architecture must be enabled** in the host app — the plugin itself doesn't enforce this at prebuild time. Validation of the config plugin against a New-Architecture-only baseline is an open task (T064).

## 1. Config plugin structure

```
expo/
├── withAppsFlyer.js          ← Entry point, composes iOS + Android plugins
├── withAppsFlyerIos.js       ← Modifies AppDelegate (ObjC + Swift) + Podfile
└── withAppsFlyerAndroid.js   ← Modifies AndroidManifest.xml
```

These are Expo Config Plugins — they run at `expo prebuild` time to modify native project files.

## 2. Swift AppDelegate support

Starting with Expo SDK 52 / RN 0.76, the default AppDelegate is **Swift** (not Objective-C).
`withAppsFlyerIos.js`'s `modifySwiftAppDelegate` handles this case explicitly (string-matches the
Expo SDK default Swift template for `didFinishLaunchingWithOptions`/`openURL`/`continueUserActivity`
and injects `handleLaunchOptions`/`handleOpen`/`continueUserActivity` calls, all via
`AppsFlyerAttribution.shared` — one `import react_native_appsflyer`, no `AppsFlyerLib` import needed)
— verified against the real `expo prebuild` output in `demos/appsflyer-expo-app`. `modifyObjcAppDelegate`
handles the legacy ObjC template the same way.

Both matchers are exact-string-match against one specific template shape. If Expo or RN changes
the default AppDelegate boilerplate again, the matcher silently misses (falls through to
`WarningAggregator.addWarningIOS`, not a build failure) rather than adapting — re-verify the
identifier strings against a fresh `expo prebuild` output whenever bumping the supported Expo SDK
version.

## 3. Manifest merge duplication

`withAppsFlyerAndroid.js` appends `tools:replace` entries to `AndroidManifest.xml` — not idempotent, so repeated `expo prebuild` (without `--clean`) duplicates entries and breaks the Android build (#672, full write-up in `known-issues-kb.md`). When touching this file: always check if the entry exists before appending.

## 4. Expo Go incompatibility

The plugin requires native modules unavailable in Expo Go. Only works in development builds (`eas build --profile development`) or bare workflow. This is documented but users miss it repeatedly (#542).

## 5. No test coverage

The Expo config plugins have **zero test coverage**. When modifying these files, manual testing with `expo prebuild --clean` on both platforms is required. Consider adding unit tests that mock the Expo config plugin API.

## 6. Peer dependency

`expo` is declared as an optional peer dependency. The plugin must work without Expo installed — guard all Expo-specific imports and config.

## 7. Testing changes

```bash
# Clean prebuild (recommended)
cd demos/demo && npx expo prebuild --clean

# Verify Android manifest
cat android/app/src/main/AndroidManifest.xml | grep -A5 "appsflyer"

# Verify iOS AppDelegate
cat ios/demo/AppDelegate.m  # or AppDelegate.swift for Expo 52+
```
