---
paths:
  - "ios/**"
---

# Native iOS bridge rules

Scope: `ios/` directory — `RNAppsFlyer.h`, `RNAppsFlyer.m`, `PCAppsFlyer.h`, `PCAppsFlyer.m`, `AppsFlyerAttribution.h/.m`.

## 1. Module structure

- `RNAppsFlyer` extends `RCTEventEmitter` (not `RCTBridgeModule` directly) — this enables `sendEventWithName:body:`
- Conforms to `AppsFlyerLibDelegate` and `AppsFlyerDeepLinkDelegate`
- Registered via `RCT_EXPORT_MODULE()` with no custom name

## 2. Method export naming

| JS call | ObjC selector |
|---------|--------------|
| `initSdkWithCallBack(options, success, error)` | `initSdkWithCallBack:successCallback:errorCallback:` |
| `initSdkWithPromise(options)` | `initSdkWithPromise:initSdkWithPromiseWithResolver:rejecter:` |
| `logEvent(name, values, success, error)` | `logEvent:eventValues:successCallback:errorCallback:` |
| `getAppsFlyerUID(callback)` | `getAppsFlyerUID:` |

Follow the existing naming convention when adding new methods. Promise variants use `RCT_EXPORT_METHOD` with `resolver:(RCTPromiseResolveBlock)` and `rejecter:(RCTPromiseRejectBlock)`.

## 3. Threading

- Delegate callbacks use `performSelectorOnMainThread:withObject:waitUntilDone:NO` to dispatch to main thread before emitting JS events
- `logCrossPromotionAndOpenStore` uses `dispatch_async(dispatch_get_main_queue(), ...)` for UI operations
- All event emissions to JS must happen on the main thread

## 4. IDFA strict mode

`#ifndef AFSDK_NO_IDFA` guards ATT-related code. The podspec supports `$RNAppsFlyerStrictMode` which uses `AppsFlyerFramework/AppsFlyerFrameworkStrict` — this excludes IDFA access entirely.

When adding ATT or IDFA-dependent code, always wrap in `#ifndef AFSDK_NO_IDFA`.

## 5. Version constant

`kAppsFlyerPluginVersion` in `RNAppsFlyer.h` — must be updated on every release. This is separate from the podspec version and package.json version (see release-versioning.md).

## 6. Podspec dependency

`react-native-appsflyer.podspec` pins the native SDK version via `s.dependency 'AppsFlyerFramework'`. Header-not-found errors (#633, #602, #646) are almost always caused by:
- Stale pod cache (fix: `pod deintegrate && pod install --repo-update`)
- Podfile.lock pinning a different native SDK version than the podspec expects
- Strict mode missing headers (`AppsFlyerFrameworkStrict` has different headers)

## 7. Event names

`supportedEvents` returns a fixed array. Adding a new event type requires:
1. Add to the `supportedEvents` array in `RNAppsFlyer.m`
2. Add matching event name constant on Android
3. Add listener registration method in `index.js`
4. Add type in `index.d.ts`

## 8. Common iOS build failures from issues

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `react_native_appsflyer-Swift.h not found` (#646) | Mixed Swift/ObjC without bridging header | Check Xcode build settings for Swift bridging |
| `AppsFlyerConsent.h not found` (#633) | Native SDK version mismatch | Match plugin version to compatible native SDK |
| `Redefinition of SUCCESS` (#497, #541) | Enum collision with other libs | Update to plugin version where enum was namespaced |
| `unsupported Swift architecture` (#656) | Release build architecture mismatch | Check `EXCLUDED_ARCHS` build settings |
