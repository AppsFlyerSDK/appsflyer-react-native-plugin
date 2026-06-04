---
name: version-bump
description: Bump plugin version across all 4 version surface files
argument-hint: [new-version e.g. 6.18.0]
allowed-tools:
  - Read
  - Edit
  - Bash
  - AskUserQuestion
---

## Version Bump

Bump the plugin version to `$ARGUMENTS` across all 4 files that must stay in sync.

### Version surface files

1. `package.json` — `"version": "X.Y.Z"`
2. `react-native-appsflyer.podspec` — `s.version = 'X.Y.Z'`
3. `ios/RNAppsFlyer.h` — `kAppsFlyerPluginVersion = @"X.Y.Z"`
4. `android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerConstants.java` — `PLUGIN_VERSION = "X.Y.Z"`

### Steps

1. If `$ARGUMENTS` is empty or not a valid semver, ask the user for the target version using AskUserQuestion.

2. Read all 4 files. Extract the current version from each. Verify they all match. If they don't match, STOP and report the mismatch — do not proceed with inconsistent state.

3. Show the user: `Current: X.Y.Z → Target: A.B.C` and confirm.

4. Edit all 4 files, replacing only the version string.

5. Run `npm test` to verify nothing broke.

6. Show a summary:
   ```
   Version bump: X.Y.Z → A.B.C
   Files updated: 4/4
   Tests: passed/failed
   ```

### Note — native SDK pins are separate

This command bumps the **plugin** version across the 4 surface files only. A **native-SDK** pin change is a different operation: it updates the podspec constants block (`APPSFLYER_IOS_SDK_VERSION` / `APPSFLYER_PURCHASE_CONNECTOR_VERSION`), which feeds both the CocoaPods `s.dependency` lines and the SPM `spm_dependency` calls. It does not touch the atomic-4 plugin-version files. See `.claude/rules/release-versioning.md` §8.

### Fail-closed guardrail

If any file cannot be read, or the version pattern is not found in any file, STOP and report which file failed. Do NOT partially update — all 4 files must be updated atomically or none.

DO NOT COMMIT. The user commits.
