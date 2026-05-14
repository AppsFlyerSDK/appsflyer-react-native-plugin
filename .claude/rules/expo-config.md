---
paths:
  - "expo/**"
---

# Expo config plugin rules

Scope: `expo/` directory — `withAppsFlyer.js`, `withAppsFlyerIos.js`, `withAppsFlyerAndroid.js`.

## 1. Config plugin structure

```
expo/
├── withAppsFlyer.js          ← Entry point, composes iOS + Android plugins
├── withAppsFlyerIos.js       ← Modifies AppDelegate for deep link handling
├── withAppsFlyerAndroid.js   ← Modifies AndroidManifest.xml
└── withAppsFlyerAppDelegate.js ← AppDelegate code injection
```

These are Expo Config Plugins — they run at `expo prebuild` time to modify native project files.

## 2. Swift AppDelegate problem (critical, unresolved)

Starting with Expo SDK 52 / RN 0.76, the default AppDelegate is **Swift** (not Objective-C). The plugin's `withAppsFlyerAppDelegate.js` modifies ObjC code and **fails silently** on Swift AppDelegates (#638, #620).

Until this is fixed:
- Do not assume AppDelegate is ObjC in config plugin code
- Test with both `expo prebuild` (Swift default) and legacy ObjC projects
- This is the #1 Expo compatibility blocker

## 3. Manifest merge duplication

`withAppsFlyerAndroid.js` appends `tools:replace` entries to `AndroidManifest.xml`. Running `expo prebuild` multiple times (without `--clean`) causes **duplicate entries** that break the Android build (#672).

Fix pattern: always check if the entry exists before appending. Use idempotent modifications.

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
