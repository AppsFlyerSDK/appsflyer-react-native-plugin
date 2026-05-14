---
paths:
  - "android/**"
---

# Native Android bridge rules

Scope: `android/` directory — `RNAppsFlyerModule.java`, `RNAppsFlyerPackage.java`, `RNAppsFlyerConstants.java`, `RNUtil.java`.

## 1. Module structure

- `RNAppsFlyerModule extends ReactContextBaseJavaModule` — registered via `RNAppsFlyerPackage implements ReactPackage`
- Methods exposed with `@ReactMethod` annotation
- Method names match JS calls exactly (e.g., JS `initSdkWithCallBack` → Java `initSdkWithCallBack(ReadableMap, Callback, Callback)`)

## 2. CallbackGuard pattern (critical)

Added in 6.17.8 to fix double-invocation crashes (#601). Wraps every `Callback` with:
- `AtomicBoolean` to ensure single invocation
- `WeakReference<Callback>` to handle bridge destruction gracefully

```java
private static class CallbackGuard {
    private final AtomicBoolean called = new AtomicBoolean(false);
    private final WeakReference<Callback> ref;
    // invoke() checks-and-sets atomically
}
```

**Every new method that accepts a Callback must use CallbackGuard.** The React Native bridge crashes if a callback is invoked more than once — this is not optional.

## 3. Constants export

`getConstants()` exports `AFInAppEventType.*` constants to JS. These are available in JS as `RNAppsFlyer.ACHIEVEMENT_UNLOCKED`, etc.

## 4. Event emission

Uses `reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, data)`. Data is serialized to a JSON string before emission (matching iOS behavior).

## 5. NativeEventEmitter stubs

Lines ~1078-1085 in `RNAppsFlyerModule.java` have empty `addListener` and `removeListeners` method stubs annotated with `@ReactMethod`. These are required by RN's built-in `NativeEventEmitter` since RN 0.65. Do not remove them — their absence causes yellow-box warnings (#335).

## 6. Purchase Connector conditional compilation

Gradle `sourceSets` conditionally includes `includeConnector` or `excludeConnector` directory based on the `appsflyer.enable_purchase_connector` gradle property. This toggles whether `PCAppsFlyer` Java classes are compiled.

## 7. Version constant

`PLUGIN_VERSION` in `RNAppsFlyerConstants.java` — must be updated on every release, synchronized with the other 3 version locations.

## 8. Namespace requirement (AGP 8+)

`build.gradle` must include `namespace` for Android Gradle Plugin 8.0+. This was added in plugin 6.15.1. Older versions cause `Namespace not specified` build failures (#583, #561).

## 9. Common Android build failures from issues

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `Namespace not specified` (#583, #561) | AGP 8+ requires namespace in build.gradle | Upgrade plugin to 6.15.1+ |
| `Multiple entries: android:allowBackup=REPLACE` (#627) | AndroidManifest merge conflict | Add `tools:replace` in app's main manifest |
| `ConcurrentModificationException` (#447) | Thread safety in native SDK | Upgrade native SDK |
| `IllegalAccessException on logEvent` (#464) | Reflection issue in native SDK | Upgrade native SDK |
| `null is not an object (RNAppsFlyer.logEvent)` (#333) | Autolinking not triggered | Run Gradle sync, clear Metro cache |

## 10. ReadableMap conversion

`RNUtil.java` handles `ReadableMap` ↔ JSON conversion. When adding new methods that accept complex objects from JS, use `RNUtil` for conversion — do not write custom conversion logic.
