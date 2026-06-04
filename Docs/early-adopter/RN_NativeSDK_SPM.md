# Native AppsFlyer iOS SDK via SPM (early adopter)

> Private early-adopter guide. Not linked from the public README. Supported only for selected early adopters on validated RN/Xcode setups — not an unofficial GA feature.

## TL;DR

An opt-in Podfile flag makes CocoaPods resolve the **native AppsFlyer iOS SDK binary** through Swift Package Manager (`spm_dependency`) instead of the `AppsFlyerFramework` pod. The plugin itself still installs the normal way (npm/yarn → CocoaPods → autolinking). CocoaPods stays the default and the fallback. Requires RN 0.75+ and dynamic frameworks.

## What this changes (and what it doesn't)

This does **not** install the React Native plugin via SPM. Only the native SDK binary's resolution changes:

- **Changes:** with the flag set, CocoaPods resolves the native SDK through SPM (`spm_dependency`) instead of the `AppsFlyerFramework` pod.
- **Unchanged:** your JS API, the bridge, and autolinking.

CocoaPods remains the default and fallback indefinitely. Nothing is auto-enabled.

## Why this matters

CocoaPods is in maintenance mode and the iOS ecosystem is moving to SPM:

- Google discontinues CocoaPods support for its iOS SDKs immediately after **Q2 2026**, publishing exclusively via SPM.
- Sentry ends CocoaPods publishing for its SDKs at the **end of June 2026**.
- React Native is officially moving to SPM. The `spm_dependency` helper landed in **0.75**; first-class SPM for RN libraries (including local package refs) is targeted for **0.84**.

As an app's *other* SDKs go SPM-only, that app may drop CocoaPods entirely. This mode is the on-ramp: it lets the app keep resolving the AppsFlyer native SDK while CocoaPods is phased out, without waiting for full plugin-as-SPM support in RN core.

This matches where the RN ecosystem is converging — not a one-off. Sentry's RN SDK ships the identical pattern: opt-in (`SENTRY_USE_SPM=1`), `spm_dependency` in the podspec (not a standalone `Package.swift`), CocoaPods as the unchanged default, RN 0.75+. See [sentry-react-native PR #6182](https://github.com/getsentry/sentry-react-native/pull/6182) and tracking issue [#5780](https://github.com/getsentry/sentry-react-native/issues/5780).

Full plugin-as-SPM (a `Package.swift` that vends the plugin itself) is **not** yet possible for RN libraries, because React Native does not publish itself as a Swift package. That's gated on RN 0.84+ ([proposal #587](https://github.com/react-native-community/discussions-and-proposals/issues/587)).

## Setup

Add to your `ios/Podfile`:

```ruby
$RNAppsFlyerUseNativeSDKSPM = true
use_frameworks! :linkage => :dynamic
# optional — only if you use the Purchase Connector:
$AppsFlyerPurchaseConnector = true
```

Then add the embed helper below (also a Podfile change), and run `cd ios && pod install` once.

## Required: embed the SPM framework

CocoaPods embeds *pod* frameworks but **not** *SPM* products. Because the AppsFlyer SDK is now an SPM product, it is **not** copied into your app, and the app crashes at launch:

```
dyld: Library not loaded: @rpath/AppsFlyerLib.framework/AppsFlyerLib
```

The plugin ships a one-line Podfile helper that embeds it for you. Two additions to your `ios/Podfile`:

```ruby
# 1. near the top, next to the existing react_native_pods require:
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve("react-native-appsflyer/scripts/appsflyer_podfile.rb", {paths: [process.argv[1]]})', __dir__]).strip

# 2. inside post_install, after react_native_post_install(...):
appsflyer_embed_native_sdk_spm!(installer)
```

Then `cd ios && pod install`. The helper auto-detects your app target, is idempotent, re-signs the framework on device builds, and is a **no-op when the SPM flag is off** — so it's safe to leave in your Podfile permanently. (This embedding is the cost of the CocoaPods-bridged SPM path; a future plugin-as-SPM build on RN 0.84+ would use the static product and need no embedding.)

## Requirements

| Requirement | Detail |
|---|---|
| RN 0.75+ | `spm_dependency` landed in 0.75.0. Below 0.75 the flag is ignored — the plugin warns and falls back to CocoaPods. No hard failure. |
| Dynamic frameworks | `spm_dependency` forces dynamic frameworks. Set `use_frameworks! :linkage => :dynamic`. Static linking with SPM packages causes duplicate-symbol errors. |
| Not Strict mode | Unsupported in v1. See below. |
| Not Expo | Unsupported in v1. See below. |

### Strict mode is unsupported in v1

If `$RNAppsFlyerStrictMode` is enabled, the entire native dependency path — core **and** Purchase Connector — stays on CocoaPods, even when `$RNAppsFlyerUseNativeSDKSPM` is true. `AppsFlyerFramework/Strict` ships static-only, so it can't link under forced dynamic frameworks. A hybrid SPM-core + CocoaPods-Strict graph is unsafe, so Strict disables the whole SPM path. A Strict early adopter gets no SPM benefit in v1.

### Expo is unsupported in v1

The config plugin (`expo/withAppsFlyerIos.js`) does not yet set the Podfile global flag or the dynamic-framework linkage during `expo prebuild`, so the SPM path is never configured on an Expo-managed project. Use bare CocoaPods if you need this mode.

## Troubleshooting

**Duplicate symbols.** This is the known failure mode of `spm_dependency` under dynamic frameworks. Disable the flag and return to CocoaPods (see [Rollback](#rollback)). If it persists on a validated setup, report the configuration to the AppsFlyer team.

## Rollback

Disable the flag in your Podfile:

```ruby
# Podfile — remove or set to false
$RNAppsFlyerUseNativeSDKSPM = false
```

Then clear CocoaPods state and reinstall:

```bash
cd ios && rm -rf Pods Podfile.lock && pod install
```

This returns you fully to the CocoaPods-resolved native SDK.

## Privacy manifest

The dynamic SPM xcframeworks bundle `PrivacyInfo.xcprivacy` inside each `.framework` (the Apple-scannable location), so the SPM/dynamic path is privacy-manifest-friendly as a side effect. This is **not** "the ITMS-91064 fix" — treat it only as a byproduct of dynamic linking. Before any App Store submission, still confirm the privacy manifest reaches the final app archive.

## Known caveat — Purchase Connector binary drift

Pinning the SPM Purchase Connector to `6.18.1` currently links the **6.18.0** binary: the upstream `PurchaseConnector-Dynamic` 6.18.1 tag points its binary target at the 6.18.0 asset (upstream tag/binary drift). The version string is correct; the linked binary is one patch behind. This is tracked with the AppsFlyer SDK team and will be re-checked on the next Purchase Connector bump.
