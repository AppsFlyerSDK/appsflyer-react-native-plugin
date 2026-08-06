#!/bin/bash
# Bumps native dependency versions in the podspec/build.gradle. See
# specs/003-release-workflow-rpc-bump/contracts/bump-native-deps-cli.md for the CLI contract.
set -uo pipefail

PODSPEC=""
BUILD_GRADLE=""
IOS_SDK_VERSION=""
ANDROID_SDK_VERSION=""
ANDROID_PLUGIN_BRIDGE_VERSION=""
PC_VERSION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --podspec) PODSPEC="$2"; shift 2 ;;
    --build-gradle) BUILD_GRADLE="$2"; shift 2 ;;
    --ios-sdk-version) IOS_SDK_VERSION="$2"; shift 2 ;;
    --android-sdk-version) ANDROID_SDK_VERSION="$2"; shift 2 ;;
    --android-plugin-bridge-version) ANDROID_PLUGIN_BRIDGE_VERSION="$2"; shift 2 ;;
    --pc-version) PC_VERSION="$2"; shift 2 ;;
    *) echo "::error::Unknown flag: $1"; exit 1 ;;
  esac
done

if [[ -z "$PODSPEC" || -z "$BUILD_GRADLE" ]]; then
  echo "::error::--podspec and --build-gradle are required"
  exit 1
fi

failures=()

# bump_line <file> <grep-pattern> <sed-pattern> <label> <new_value>
# Applies sed, then verifies the substitution actually landed by re-checking the pattern
# still matches with the new value — a non-matching sed is a silent no-op otherwise (FR-004).
bump_line() {
  local file="$1" grep_pattern="$2" sed_expr="$3" label="$4" new_value="$5"

  if [[ ! "$new_value" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc[0-9]+)?$ ]]; then
    failures+=("$label: version '$new_value' is not X.Y.Z")
    return
  fi

  local before
  before=$(grep -E "$grep_pattern" "$file" || true)
  if [[ -z "$before" ]]; then
    failures+=("$label: pattern not found in $file")
    return
  fi

  # -i.bak form is portable across GNU and BSD (macOS) sed; -i alone is GNU-only.
  sed -i.bak -E "$sed_expr" "$file" && rm -f "${file}.bak"

  local after
  after=$(grep -E "$grep_pattern" "$file" || true)
  if [[ "$after" != *"$new_value"* ]]; then
    failures+=("$label: substitution did not apply as expected in $file")
    return
  fi

  echo "$file: $before -> $after"
}

if [[ -n "$IOS_SDK_VERSION" ]]; then
  bump_line "$PODSPEC" \
    "s\.dependency 'AppsFlyerRPC', '[^']*'" \
    "s/s\.dependency 'AppsFlyerRPC', '[^']*'/s.dependency 'AppsFlyerRPC', '${IOS_SDK_VERSION}'/" \
    "AppsFlyerRPC" "$IOS_SDK_VERSION"

  bump_line "$PODSPEC" \
    "s\.dependency 'AppsFlyerRPC/Strict', '[^']*'" \
    "s/s\.dependency 'AppsFlyerRPC\/Strict', '[^']*'/s.dependency 'AppsFlyerRPC\/Strict', '${IOS_SDK_VERSION}'/" \
    "AppsFlyerRPC/Strict" "$IOS_SDK_VERSION"
fi

if [[ -n "$PC_VERSION" ]] && grep -q "PurchaseConnector" "$PODSPEC"; then
  bump_line "$PODSPEC" \
    "s\.dependency 'PurchaseConnector', '[^']*'" \
    "s/s\.dependency 'PurchaseConnector', '[^']*'/s.dependency 'PurchaseConnector', '${PC_VERSION}'/" \
    "PurchaseConnector" "$PC_VERSION"
fi

# af-android-sdk and af-android-plugin-bridge are both versioned by the af-android-sdk-bom
# platform import now (one line, one version) — release.yml always supplies both flags with
# the same value, so both bump the same BOM line; bumping it twice with an identical value is
# a harmless no-op on the second call.
if [[ -n "$ANDROID_SDK_VERSION" ]]; then
  bump_line "$BUILD_GRADLE" \
    "platform\('com\.appsflyer:af-android-sdk-bom:[^']*'\)" \
    "s/platform\('com\.appsflyer:af-android-sdk-bom:[^']*'\)/platform('com.appsflyer:af-android-sdk-bom:${ANDROID_SDK_VERSION}')/" \
    "af-android-sdk" "$ANDROID_SDK_VERSION"
fi

if [[ -n "$ANDROID_PLUGIN_BRIDGE_VERSION" ]]; then
  bump_line "$BUILD_GRADLE" \
    "platform\('com\.appsflyer:af-android-sdk-bom:[^']*'\)" \
    "s/platform\('com\.appsflyer:af-android-sdk-bom:[^']*'\)/platform('com.appsflyer:af-android-sdk-bom:${ANDROID_PLUGIN_BRIDGE_VERSION}')/" \
    "af-android-plugin-bridge" "$ANDROID_PLUGIN_BRIDGE_VERSION"
fi

if [[ ${#failures[@]} -gt 0 ]]; then
  for f in "${failures[@]}"; do
    echo "::error::$f"
  done
  exit 1
fi
