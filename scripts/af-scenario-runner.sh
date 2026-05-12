
#!/usr/bin/env bash
#
# af-scenario-runner.sh — Unified AppsFlyer plugin scenario runner
#
# Drives a JSON-driven scenario cycle for any AppsFlyer plugin using ADB
# (Android) and xcrun simctl (iOS). Reads a test plan, executes each phase,
# validates log output against expected patterns, and produces a structured
# JSON report. Used for both pre-publish E2E (.af-e2e/test-plan.json) and
# post-publish smoke (.af-smoke/rc-test-plan.json) — the runner is the same;
# the plan is what differs.
#
# Usage:
#   ./af-scenario-runner.sh --platform android --plan .af-e2e/test-plan.json
#   ./af-scenario-runner.sh --platform ios --plan .af-smoke/rc-test-plan.json
#   ./af-scenario-runner.sh --platform android --plan <plan> --phase phase_1
#   ./af-scenario-runner.sh --platform android --plan <plan> --dry-run
#   ./af-scenario-runner.sh --platform android --plan <plan> --build
#
# Requirements:
#   - bash 4+, jq
#   - Android: ADB in PATH, emulator booted
#   - iOS: Xcode CLI tools, simulator booted
#
# The script is agent-agnostic: any AI coding assistant (Cursor, Claude Code,
# GitHub Copilot, Windsurf) or a human can invoke it from a terminal.



set -euo pipefail

# Bash 5.2+ enables patsub_replacement by default, which makes `&` in the
# replacement string of ${var//pat/repl} expand to the matched pattern (sed
# style). That mangles deep link URLs like `?a=1&b=2` into `?a=1{{DEEP_LINK_URL}}b=2`
# when we substitute the URL into trigger templates below. Disable it so
# replacements are taken literally on every supported runner (macOS bash 3.2,
# Ubuntu bash 5.2+, etc.).
shopt -u patsub_replacement 2>/dev/null || true

# ─── Defaults ────────────────────────────────────────────────────────────────

PLATFORM=""
PLAN_FILE=""
PHASE_FILTER=""
DRY_RUN=false
BUILD_FIRST=false
VERBOSE=false
REPORT_DIR=""
LOG_TAG="AF_QA"

# Timestamps
RUN_ID=""
RUN_START=""

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNED_CHECKS=0
ABORTED=false

# ─── Colors ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Usage ───────────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --platform <android|ios>   Target platform (required)
  --plan <path>              Path to test-plan.json (required)
  --phase <phase_id>         Run only this phase (optional; runs all if omitted)
  --build                    Build the app before running (optional)
  --dry-run                  Show what would run without executing (optional)
  --verbose                  Print extra debug output (optional)
  --report-dir <path>        Override report output directory (optional)
  -h, --help                 Show this help

Examples:
  $(basename "$0") --platform android --plan .af-e2e/test-plan.json
  $(basename "$0") --platform ios --plan .af-smoke/rc-test-plan.json --phase phase_1
  $(basename "$0") --platform android --plan .af-e2e/test-plan.json --build --verbose
EOF
  exit 0
}

# ─── Logging helpers ─────────────────────────────────────────────────────────

log_info()  { echo -e "${CYAN}[INFO]${NC}  $*" >&2; }
log_ok()    { echo -e "${GREEN}[PASS]${NC}  $*" >&2; }
log_fail()  { echo -e "${RED}[FAIL]${NC}  $*" >&2; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
log_step()  { echo -e "${BOLD}────── $* ──────${NC}" >&2; }
log_debug() { if $VERBOSE; then echo -e "[DEBUG] $*" >&2; fi; }

# ─── Argument parsing ────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)  PLATFORM="$2"; shift 2 ;;
    --plan)      PLAN_FILE="$2"; shift 2 ;;
    --phase)     PHASE_FILTER="$2"; shift 2 ;;
    --build)     BUILD_FIRST=true; shift ;;
    --dry-run)   DRY_RUN=true; shift ;;
    --verbose)   VERBOSE=true; shift ;;
    --report-dir) REPORT_DIR="$2"; shift 2 ;;
    -h|--help)   usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[[ -z "$PLATFORM" ]] && { echo "Error: --platform is required"; usage; }
[[ -z "$PLAN_FILE" ]] && { echo "Error: --plan is required"; usage; }
[[ ! -f "$PLAN_FILE" ]] && { echo "Error: Plan file not found: $PLAN_FILE"; exit 1; }

PLAN_DIR="$(cd "$(dirname "$PLAN_FILE")" && pwd)"
PROJECT_ROOT="$(cd "$PLAN_DIR/.." && pwd)"

# Validate platform
case "$PLATFORM" in
  android|ios) ;;
  *) echo "Error: --platform must be 'android' or 'ios'"; exit 1 ;;
esac

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required but not installed. Install with: brew install jq"; exit 1; }

if [[ "$PLATFORM" == "android" ]]; then
  command -v adb >/dev/null 2>&1 || { echo "Error: adb not found in PATH"; exit 1; }
elif [[ "$PLATFORM" == "ios" ]]; then
  command -v xcrun >/dev/null 2>&1 || { echo "Error: xcrun not found (install Xcode CLI tools)"; exit 1; }
fi

# ─── Read plan ───────────────────────────────────────────────────────────────

PLAN=$(cat "$PLAN_FILE")
PLAN_ID=$(echo "$PLAN" | jq -r '._meta.plan_id // "unknown"')
PLUGIN_NAME=$(echo "$PLAN" | jq -r '._meta.plugin // "unknown"')

# Platform-specific config
PACKAGE_NAME=$(echo "$PLAN" | jq -r ".config.${PLATFORM}.package_name // .config.${PLATFORM}.bundle_id // \"\"")
APP_PATH=$(echo "$PLAN" | jq -r ".config.${PLATFORM}.apk_path // .config.${PLATFORM}.app_path // \"\"")
BUILD_CMD=$(echo "$PLAN" | jq -r ".config.${PLATFORM}.build_cmd // \"\"")
ACTIVITY=$(echo "$PLAN" | jq -r ".config.${PLATFORM}.activity // \"\"")

# Resolve relative paths against project root
if [[ -n "$APP_PATH" && "${APP_PATH:0:1}" != "/" ]]; then
  APP_PATH="${PROJECT_ROOT}/${APP_PATH}"
fi

# Report directory
if [[ -z "$REPORT_DIR" ]]; then
  REPORT_DIR=$(echo "$PLAN" | jq -r '.report.output_dir // ".af-smoke/reports/"')
fi
if [[ "${REPORT_DIR:0:1}" != "/" ]]; then
  REPORT_DIR="${PROJECT_ROOT}/${REPORT_DIR}"
fi

# Generate run ID
RUN_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID="${PLAN_ID}-${PLATFORM}-$(date +%Y%m%d_%H%M%S)"

log_info "Plan: ${PLAN_ID} | Plugin: ${PLUGIN_NAME} | Platform: ${PLATFORM}"
log_info "Package: ${PACKAGE_NAME}"
log_info "Run ID: ${RUN_ID}"

if $DRY_RUN; then
  log_warn "DRY RUN MODE — no commands will be executed"
fi

# ─── Setup report directory ──────────────────────────────────────────────────

mkdir -p "$REPORT_DIR"
REPORT_FILE="${REPORT_DIR}/${RUN_ID}.json"
PHASE_RESULTS="[]"

# ─── Platform helpers ────────────────────────────────────────────────────────

# --- Android ---

android_get_device() {
  adb devices | grep -w "device" | head -1 | awk '{print $1}'
}

android_is_installed() {
  adb shell pm list packages 2>/dev/null | grep -q "$PACKAGE_NAME"
}

android_uninstall() {
  log_info "Uninstalling $PACKAGE_NAME..."
  if android_is_installed; then
    adb uninstall "$PACKAGE_NAME" 2>/dev/null || true
  else
    log_info "App not installed, skipping uninstall"
  fi
}

android_install() {
  log_info "Installing $APP_PATH..."
  if [[ ! -f "$APP_PATH" ]]; then
    log_fail "APK not found at $APP_PATH"
    if [[ -n "$BUILD_CMD" ]]; then
      log_info "Hint: run with --build to build first, or manually: $BUILD_CMD"
    fi
    return 1
  fi
  adb install -r "$APP_PATH"
}

android_launch() {
  log_info "Launching $PACKAGE_NAME..."
  adb logcat -c
  adb shell am start -n "${PACKAGE_NAME}/${ACTIVITY}" 2>/dev/null || \
    adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 2>/dev/null
}

android_get_pid() {
  adb shell pidof "$PACKAGE_NAME" 2>/dev/null | tr -d '[:space:]'
}

android_collect_logs() {
  local log_file="$1"
  local tail_lines="${ANDROID_LOGCAT_TAIL_LINES:-2000}"

  # Always start from an empty file so each phase capture is self-contained.
  : > "$log_file"

  # Strategy 1: Read the app's af_qa_logs.txt from internal storage via
  # `run-as`. Required because Flutter debug APKs launched standalone (no
  # `flutter run` host) do not forward Dart `debugPrint` to logcat, so the
  # file is the only reliable source of [AF_QA] markers. The Documents dir
  # path on Android is `app_flutter/` for path_provider, but newer versions
  # may write directly under `files/`, so try both. `run-as` works because
  # `flutter build apk --debug` produces a debuggable APK.
  local found=0
  for path in app_flutter/af_qa_logs.txt files/af_qa_logs.txt; do
    if adb shell "run-as $PACKAGE_NAME cat $path 2>/dev/null" >> "$log_file" 2>/dev/null; then
      if [[ -s "$log_file" ]]; then
        log_debug "Pulled Android QA log from $path"
        found=1
        break
      fi
    fi
  done
  if [[ "$found" -eq 0 ]]; then
    log_debug "No af_qa_logs.txt found via run-as; relying on logcat only"
  fi

  # Strategy 2: Always also append logcat output. AppsFlyer SDK native logs
  # (HTTP response codes, etc.) reach logcat regardless of the Dart-print
  # routing, and the count_matches checks need them. Limit to the recent tail
  # so CI does not spend a minute dumping the whole emulator buffer every phase.
  adb logcat -d -t "$tail_lines" 2>&1 | grep -E "${LOG_TAG}|AppsFlyer|response code:|preparing data:" >> "$log_file" || true
}

android_background_app() {
  log_info "Backgrounding app (HOME key)..."
  adb shell input keyevent KEYCODE_HOME
}

android_trigger_deeplink() {
  local url="$1"
  log_info "Triggering deep link: $url"
  adb shell am start -W -a android.intent.action.VIEW -d "$url"
}

android_is_alive() {
  local pid
  pid=$(android_get_pid)
  [[ -n "$pid" ]]
}

# --- iOS ---

IOS_UDID=""
IOS_LAST_PID=""

ios_get_booted_udid() {
  xcrun simctl list devices booted -j 2>/dev/null | \
    jq -r '[.devices[][] | select(.state == "Booted")] | first | .udid // empty'
}

ios_ensure_udid() {
  if [[ -z "$IOS_UDID" ]]; then
    IOS_UDID=$(ios_get_booted_udid)
    if [[ -z "$IOS_UDID" ]]; then
      log_fail "No booted iOS simulator found. Boot one with: xcrun simctl boot <UDID>"
      exit 1
    fi
    log_info "Using simulator: $IOS_UDID"
  fi
}

ios_is_installed() {
  xcrun simctl listapps "$IOS_UDID" 2>/dev/null | grep -q "$PACKAGE_NAME" 2>/dev/null
}

ios_uninstall() {
  ios_ensure_udid
  log_info "Uninstalling $PACKAGE_NAME..."
  if ios_is_installed; then
    xcrun simctl uninstall "$IOS_UDID" "$PACKAGE_NAME" 2>/dev/null || true
  else
    log_info "App not installed, skipping uninstall"
  fi
}

ios_install() {
  ios_ensure_udid
  log_info "Installing $APP_PATH..."
  if [[ ! -d "$APP_PATH" ]]; then
    log_fail "App bundle not found at $APP_PATH"
    if [[ -n "$BUILD_CMD" ]]; then
      log_info "Hint: run with --build to build first, or manually: $BUILD_CMD"
    fi
    return 1
  fi
  xcrun simctl install "$IOS_UDID" "$APP_PATH"
}

ios_launch() {
  ios_ensure_udid
  log_info "Launching $PACKAGE_NAME..."
  # Capture launch output so we can pin log filtering to this PID. simctl
  # prints "<bundle_id>: <pid>" on success; anything else (already running,
  # error) leaves IOS_LAST_PID empty and the collector falls back to the
  # unfiltered window.
  local out
  out=$(xcrun simctl launch "$IOS_UDID" "$PACKAGE_NAME" 2>&1 || true)
  echo "$out"
  IOS_LAST_PID=$(echo "$out" | awk -F': ' '/^'"$PACKAGE_NAME"': [0-9]+$/ {print $2}' | tail -1)
  [[ -n "$IOS_LAST_PID" ]] && log_debug "Launched PID: $IOS_LAST_PID"
}

ios_get_pid() {
  xcrun simctl spawn "$IOS_UDID" launchctl list 2>/dev/null | \
    grep "$PACKAGE_NAME" | awk '{print $1}' | head -1
}

ios_collect_logs() {
  local log_file="$1"

  ios_ensure_udid

  # Always start from an empty file so each phase capture is self-contained.
  : > "$log_file"

  # Strategy 1: Read the app's af_qa_logs.txt from the simulator filesystem.
  # This file is the source of truth for [AF_QA] markers because the IOSink
  # in af_qa_logger.dart guarantees every line is appended.
  local sim_data_dir
  sim_data_dir="$HOME/Library/Developer/CoreSimulator/Devices/${IOS_UDID}/data"
  if [[ -d "$sim_data_dir" ]]; then
    local qa_log
    qa_log=$(find "$sim_data_dir/Containers/Data/Application" -name "af_qa_logs.txt" -maxdepth 4 2>/dev/null | head -1)
    if [[ -n "$qa_log" && -f "$qa_log" ]]; then
      log_debug "Found iOS QA log file: $qa_log"
      cat "$qa_log" >> "$log_file"
    fi
  fi

  # Strategy 2: Always also append simctl log show output. The file logger
  # only carries [AF_QA] lines; SDK HTTP traffic (response code:200, etc.)
  # only shows up via os_log and is required by count_matches checks.
  # Window is 240s so back-to-back phases (cold launch -> 60s settle -> deep
  # link -> 12s wait) still fit. The grep filter also captures URL-open
  # events from CoreSimulatorBridge / launchservices so deep-link triage has
  # something to look at when onDeepLinking doesn't fire.
  #
  # Pin the predicate to the current Runner PID when known so prior-run
  # entries that still sit inside the rolling window can't poison absent-
  # pattern checks (e.g. phase_1 no_fatal_errors). Falls back to unfiltered
  # when PID is unknown (first phase before launch, or `simctl launch`
  # failed to print one).
  log_debug "Appending simctl log show output"
  local predicate_args=()
  if [[ -n "$IOS_LAST_PID" ]]; then
    predicate_args=(--predicate "processIdentifier == $IOS_LAST_PID")
  fi
  xcrun simctl spawn "$IOS_UDID" log show \
    --last 240s --style compact ${predicate_args[@]+"${predicate_args[@]}"} 2>&1 | \
    grep -E "${LOG_TAG}|appsflyer|CFNetwork:Summary|response_status|response code|Opening URL|launchservices|openURL|continueUserActivity" >> "$log_file" || true

  # Best-effort screenshot for failure triage (no-op if nothing booted).
  local shot_dir="${log_file%/*}"
  local shot_file="${shot_dir}/${log_file##*/}.png"
  shot_file="${shot_file%_logs.txt.png}_screen.png"
  xcrun simctl io "$IOS_UDID" screenshot "$shot_file" 2>/dev/null || true
}

ios_background_app() {
  ios_ensure_udid
  log_info "Backgrounding app (launching Safari)..."
  xcrun simctl launch "$IOS_UDID" com.apple.mobilesafari 2>/dev/null || true
}

ios_trigger_deeplink() {
  local url="$1"
  ios_ensure_udid
  log_info "Triggering deep link: $url"
  xcrun simctl openurl "$IOS_UDID" "$url" 2>/dev/null || true
}

# ─── Platform dispatcher ────────────────────────────────────────────────────

platform_uninstall() {
  if [[ "$PLATFORM" == "android" ]]; then android_uninstall; else ios_uninstall; fi
}

platform_install() {
  if [[ "$PLATFORM" == "android" ]]; then android_install; else ios_install; fi
}

platform_launch() {
  if [[ "$PLATFORM" == "android" ]]; then android_launch; else ios_launch; fi
}

platform_collect_logs() {
  if [[ "$PLATFORM" == "android" ]]; then android_collect_logs "$1"; else ios_collect_logs "$1"; fi
}

platform_background() {
  if [[ "$PLATFORM" == "android" ]]; then android_background_app; else ios_background_app; fi
}

platform_trigger_deeplink() {
  if [[ "$PLATFORM" == "android" ]]; then android_trigger_deeplink "$1"; else ios_trigger_deeplink "$1"; fi
}

# Print the device-side af_qa_logs.txt to stdout (best effort, empty on miss).
# Used by `wait_for_qa_marker` to poll mid-phase without reshuffling the full
# log-collection pipeline.
platform_peek_qa_log() {
  if [[ "$PLATFORM" == "android" ]]; then
    for path in app_flutter/af_qa_logs.txt files/af_qa_logs.txt; do
      adb shell "run-as $PACKAGE_NAME cat $path 2>/dev/null" 2>/dev/null && return 0
    done
    return 0
  fi
  ios_ensure_udid
  local sim_data_dir
  sim_data_dir="$HOME/Library/Developer/CoreSimulator/Devices/${IOS_UDID}/data"
  [[ -d "$sim_data_dir" ]] || return 0
  local qa_log
  qa_log=$(find "$sim_data_dir/Containers/Data/Application" \
    -name "af_qa_logs.txt" -maxdepth 4 2>/dev/null | head -1)
  [[ -n "$qa_log" && -f "$qa_log" ]] || return 0
  cat "$qa_log" 2>/dev/null || true
}

# wait_for_qa_marker <marker_substring> <timeout_sec> [interval_sec]
# Polls the device-side QA log and returns 0 as soon as the marker
# appears, or after the timeout (also 0 — caller still runs validation against
# whatever logs exist). Lets local runs finish quickly while CI runs use the
# full ceiling for slow no-KVM emulators / cold macOS sims.
wait_for_qa_marker() {
  local marker="$1"
  local timeout_sec="$2"
  local interval="${3:-3}"
  local start_ts now elapsed remaining sleep_for

  start_ts=$(date +%s)
  log_info "Waiting up to ${timeout_sec}s for marker: ${marker} (poll every ${interval}s)"
  while true; do
    now=$(date +%s)
    elapsed=$(( now - start_ts ))
    if (( elapsed >= timeout_sec )); then
      break
    fi

    if platform_peek_qa_log | grep -qF -- "$marker" 2>/dev/null; then
      log_info "Marker observed after ${elapsed}s"
      return 0
    fi

    remaining=$(( timeout_sec - elapsed ))
    sleep_for="$interval"
    if (( sleep_for > remaining )); then
      sleep_for="$remaining"
    fi
    sleep "$sleep_for"
  done
  log_warn "Marker not observed within ${timeout_sec}s; proceeding to log collection anyway"
  return 0
}

LAST_CMD_OUTPUT=""

run_phase_command() {
  local label="$1"
  local command="$2"
  local allow_failure="$3"
  local output status

  log_info "${label}: ${command}"
  set +e
  output=$(eval "$command" 2>&1)
  status=$?
  set -e

  LAST_CMD_OUTPUT="$output"

  if [[ -n "$output" ]]; then
    printf '%s\n' "$output" >&2
  fi

  if [[ "$status" -ne 0 ]]; then
    if [[ "$allow_failure" == "true" ]]; then
      log_warn "${label} failed with exit code ${status}; continuing"
      return 0
    fi
    log_fail "${label} failed with exit code ${status}"
    return "$status"
  fi
}

deep_link_wait_marker() {
  local phase_json="$1"
  echo "$phase_json" | jq -r '
    [
      .checks[]?
      | select(.type == "log_contains")
      | .pattern
      | select(startswith("deepLinkValue="))
    ][0] // empty
  '
}

# ─── Build ───────────────────────────────────────────────────────────────────

build_app() {
  if [[ -z "$BUILD_CMD" ]]; then
    log_warn "No build_cmd configured in test plan for $PLATFORM"
    return 1
  fi
  log_step "Building app"
  log_info "Running: $BUILD_CMD"
  if ! $DRY_RUN; then
    (eval "$BUILD_CMD")
  fi
}

# ─── Log validation engine ───────────────────────────────────────────────────

# validate_check <log_file> <check_json>
# Returns a JSON object: {"status": "PASS|FAIL|WARN", "evidence": "..."}
validate_check() {
  local log_file="$1"
  local check_json="$2"

  local check_id check_type pattern description fail_action
  check_id=$(echo "$check_json" | jq -r '.id')
  check_type=$(echo "$check_json" | jq -r '.type')
  description=$(echo "$check_json" | jq -r '.description')
  fail_action=$(echo "$check_json" | jq -r '.fail_action // "fail"')

  local fail_status="FAIL"
  [[ "$fail_action" == "warn" ]] && fail_status="WARN"

  log_debug "Validating check: $check_id ($check_type)"

  case "$check_type" in

    log_contains)
      pattern=$(echo "$check_json" | jq -r '.pattern')
      local match
      match=$(grep -F "$pattern" "$log_file" 2>/dev/null | head -1 || true)
      if [[ -n "$match" ]]; then
        # Optional payload_check
        local payload_field payload_expected
        payload_field=$(echo "$check_json" | jq -r '.payload_check.field // empty')
        if [[ -n "$payload_field" ]]; then
          payload_expected=$(echo "$check_json" | jq -r '.payload_check.expected')
          if echo "$match" | grep -q "${payload_field}.*${payload_expected}" 2>/dev/null || \
             echo "$match" | grep -q "\"${payload_field}\":.*${payload_expected}" 2>/dev/null || \
             echo "$match" | grep -q "${payload_field}=${payload_expected}" 2>/dev/null || \
             echo "$match" | grep -q "${payload_field}: ${payload_expected}" 2>/dev/null; then
            jq -n --arg evidence "$(echo "$match" | head -c 500)" \
              '{status: "PASS", evidence: $evidence}'
          else
            echo "{\"status\":\"${fail_status}\",\"evidence\":\"Pattern found but payload check failed: ${payload_field} != ${payload_expected}\"}"
          fi
        else
          echo "{\"status\":\"PASS\",\"evidence\":$(echo "$match" | head -c 500 | jq -Rs .)}"
        fi
      else
        echo "{\"status\":\"${fail_status}\",\"evidence\":\"Pattern not found in logs: ${pattern}\"}"
      fi
      ;;

    count_matches)
      pattern=$(echo "$check_json" | jq -r '.pattern')
      local minimum
      minimum=$(echo "$check_json" | jq -r '.minimum // 1')
      local count
      count=$(grep -cE "$pattern" "$log_file" 2>/dev/null || echo "0")
      if [[ "$count" -ge "$minimum" ]]; then
        echo "{\"status\":\"PASS\",\"evidence\":\"Found ${count} matches (minimum: ${minimum})\"}"
      else
        echo "{\"status\":\"${fail_status}\",\"evidence\":\"Found only ${count} matches (minimum: ${minimum})\"}"
      fi
      ;;

    absent)
      local patterns_json patterns_arr status evidence
      patterns_json=$(echo "$check_json" | jq -r '.patterns // []')
      status="PASS"
      evidence="No forbidden patterns found"
      while IFS= read -r forbidden_pattern; do
        forbidden_pattern=$(echo "$forbidden_pattern" | jq -r '.')
        local found
        found=$(grep -F "$forbidden_pattern" "$log_file" 2>/dev/null | head -1 || true)
        if [[ -n "$found" ]]; then
          status="$fail_status"
          evidence="Forbidden pattern found: ${forbidden_pattern} -> $(echo "$found" | head -c 200)"
          break
        fi
      done < <(echo "$patterns_json" | jq -c '.[]')
      echo "{\"status\":\"${status}\",\"evidence\":$(echo "$evidence" | jq -Rs .)}"
      ;;

    regex_match)
      pattern=$(echo "$check_json" | jq -r '.pattern')
      local match
      match=$(grep -E "$pattern" "$log_file" 2>/dev/null | head -1 || true)
      if [[ -n "$match" ]]; then
        echo "{\"status\":\"PASS\",\"evidence\":$(echo "$match" | head -c 500 | jq -Rs .)}"
      else
        echo "{\"status\":\"${fail_status}\",\"evidence\":\"Regex not matched in logs: ${pattern}\"}"
      fi
      ;;

    *)
      echo "{\"status\":\"WARN\",\"evidence\":\"Unknown check type: ${check_type}\"}"
      ;;
  esac
}

# ─── Phase execution ─────────────────────────────────────────────────────────

# run_phase <phase_json>
run_phase() {
  local phase_json="$1"

  local phase_id phase_name requires_fresh scenario_ref wait_sec
  phase_id=$(echo "$phase_json" | jq -r '.id')
  phase_name=$(echo "$phase_json" | jq -r '.name')
  requires_fresh=$(echo "$phase_json" | jq -r '.requires_fresh_install // false')
  scenario_ref=$(echo "$phase_json" | jq -r '.scenario_ref // "N/A"')
  wait_sec=$(echo "$phase_json" | jq -r '.wait_after_launch_sec // 25')
  local wait_trigger_sec
  wait_trigger_sec=$(echo "$phase_json" | jq -r '.wait_after_trigger_sec // 5')

  log_step "Phase: ${phase_name} [${phase_id}] (Scenario: ${scenario_ref})"

  local phase_log_file="${REPORT_DIR}/${RUN_ID}_${phase_id}_logs.txt"
  local phase_status="PASS"
  local checks_json="{}"

  if $DRY_RUN; then
    log_info "[DRY RUN] Would execute phase: $phase_name"
    if [[ "$requires_fresh" == "true" ]]; then
      log_info "[DRY RUN] Would uninstall + reinstall $PACKAGE_NAME"
    fi
    log_info "[DRY RUN] Would launch app and wait ${wait_sec}s"
    log_info "[DRY RUN] Would collect logs and validate $(echo "$phase_json" | jq '.checks | length') checks"

    # Produce a dry-run result
    local dry_result
    dry_result=$(jq -n \
      --arg pid "$phase_id" \
      --arg ps "DRY_RUN" \
      '{phase_id: $pid, status: $ps, checks: {}, log_file: "N/A"}')
    PHASE_RESULTS=$(echo "$PHASE_RESULTS" | jq --argjson r "$dry_result" '. + [$r]')
    return
  fi

  # Fresh install if required
  if [[ "$requires_fresh" == "true" ]]; then
    platform_uninstall
    sleep 1
    if ! platform_install; then
      log_fail "Installation failed — aborting phase"
      phase_status="BLOCKED"
      local blocked_result
      blocked_result=$(jq -n \
        --arg pid "$phase_id" \
        --arg ps "$phase_status" \
        '{phase_id: $pid, status: $ps, checks: {}, log_file: "N/A", note: "Installation failed"}')
      PHASE_RESULTS=$(echo "$PHASE_RESULTS" | jq --argjson r "$blocked_result" '. + [$r]')
      return
    fi
    sleep 1

    platform_launch
    # Poll the QA log for the auto-run-complete marker rather than always
    # sleeping the full ceiling. Use a slower interval here because each ADB
    # `run-as cat` is costly on GitHub's emulator.
    wait_for_qa_marker "[AF_QA][AUTO_APIS] --- Auto run complete ---" "$wait_sec" 10
  fi

  # Pre-actions (deep link phases: background the app, etc.)
  local pre_actions
  pre_actions=$(echo "$phase_json" | jq -r ".pre_actions.${PLATFORM} // empty")
  if [[ -n "$pre_actions" && "$pre_actions" != "null" ]]; then
    log_info "Executing pre-actions..."
    while IFS= read -r action; do
      action=$(echo "$action" | jq -r '.')
      action="${action//\{\{BUNDLE_ID\}\}/$PACKAGE_NAME}"
      action="${action//\{\{PACKAGE_NAME\}\}/$PACKAGE_NAME}"
      if [[ "$PLATFORM" == "ios" ]]; then
        ios_ensure_udid
        action="${action//\{\{UDID\}\}/$IOS_UDID}"
      fi
      run_phase_command "Pre-action" "$action" true
      if [[ "$PLATFORM" == "ios" && "$action" == *"simctl launch"* && -n "$LAST_CMD_OUTPUT" ]]; then
        local new_pid
        new_pid=$(echo "$LAST_CMD_OUTPUT" | awk -F': ' '/^'"$PACKAGE_NAME"': [0-9]+$/ {print $2}' | tail -1)
        if [[ -n "$new_pid" ]]; then
          IOS_LAST_PID="$new_pid"
          log_debug "Pre-action updated PID: $IOS_LAST_PID"
        fi
      fi
    done < <(echo "$phase_json" | jq -c ".pre_actions.${PLATFORM}[]")
  fi

  # Trigger deep link if present
  local deep_link_url
  deep_link_url=$(echo "$phase_json" | jq -r '.deep_link_url // empty')
  if [[ -n "$deep_link_url" ]]; then
    # Use platform-specific trigger command or generic
    local trigger_cmd
    trigger_cmd=$(echo "$phase_json" | jq -r ".trigger.${PLATFORM} // empty")
    if [[ -n "$trigger_cmd" && "$trigger_cmd" != "null" ]]; then
      trigger_cmd="${trigger_cmd//\{\{DEEP_LINK_URL\}\}/$deep_link_url}"
      trigger_cmd="${trigger_cmd//\{\{BUNDLE_ID\}\}/$PACKAGE_NAME}"
      trigger_cmd="${trigger_cmd//\{\{PACKAGE_NAME\}\}/$PACKAGE_NAME}"
      if [[ "$PLATFORM" == "ios" ]]; then
        ios_ensure_udid
        trigger_cmd="${trigger_cmd//\{\{UDID\}\}/$IOS_UDID}"
      fi
      if ! run_phase_command "Deep link trigger" "$trigger_cmd" false; then
        log_warn "Deep link trigger failed; continuing to collect logs and run checks"
      fi
    else
      if ! platform_trigger_deeplink "$deep_link_url"; then
        log_warn "Deep link trigger failed; continuing to collect logs and run checks"
      fi
    fi

    local deep_link_marker
    deep_link_marker=$(deep_link_wait_marker "$phase_json")
    if [[ -n "$deep_link_marker" ]]; then
      wait_for_qa_marker "$deep_link_marker" "$wait_trigger_sec" 3
    else
      log_info "Waiting ${wait_trigger_sec}s for deep link to propagate..."
      sleep "$wait_trigger_sec"
    fi
  fi

  # Collect logs
  log_info "Collecting logs..."
  platform_collect_logs "$phase_log_file"

  local log_lines
  log_lines=$(wc -l < "$phase_log_file" 2>/dev/null | tr -d ' ')
  log_info "Collected ${log_lines} log lines"

  if [[ "$log_lines" -eq 0 ]]; then
    log_warn "No logs collected — check that the app is running and logging with [AF_QA]"
  fi

  # Validate each check
  local num_checks
  num_checks=$(echo "$phase_json" | jq '.checks | length')
  log_info "Running ${num_checks} checks..."

  local i=0
  while [[ $i -lt $num_checks ]]; do
    local check
    check=$(echo "$phase_json" | jq -c ".checks[$i]")
    local check_id
    check_id=$(echo "$check" | jq -r '.id')
    local check_desc
    check_desc=$(echo "$check" | jq -r '.description')
    local fail_action
    fail_action=$(echo "$check" | jq -r '.fail_action // "fail"')

    local result
    result=$(validate_check "$phase_log_file" "$check")
    local check_status
    check_status=$(echo "$result" | jq -r '.status')
    local evidence
    evidence=$(echo "$result" | jq -r '.evidence')

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [[ "$check_status" == "PASS" ]]; then
      log_ok "$check_id: $check_desc"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [[ "$check_status" == "WARN" ]]; then
      log_warn "$check_id: $check_desc — $evidence"
      WARNED_CHECKS=$((WARNED_CHECKS + 1))
    else
      log_fail "$check_id: $check_desc — $evidence"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      phase_status="FAIL"

      if [[ "$fail_action" == "abort" ]]; then
        log_fail "Abort triggered by $check_id — skipping remaining checks in this phase"
        ABORTED=true
        break
      fi
    fi

    checks_json=$(echo "$checks_json" | jq --arg k "$check_id" --argjson v "$result" '. + {($k): $v}')
    i=$((i + 1))
  done

  # Produce phase result
  local phase_result
  phase_result=$(jq -n \
    --arg pid "$phase_id" \
    --arg ps "$phase_status" \
    --argjson ch "$checks_json" \
    --arg lf "$phase_log_file" \
    '{phase_id: $pid, status: $ps, checks: $ch, log_file: $lf}')
  PHASE_RESULTS=$(echo "$PHASE_RESULTS" | jq --argjson r "$phase_result" '. + [$r]')

  echo ""
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  log_step "AppsFlyer Smoke Runner"
  log_info "Started at $RUN_START"

  # Verify device/simulator is available (skip in dry-run)
  if $DRY_RUN; then
    if [[ "$PLATFORM" == "android" ]]; then
      local device
      device=$(android_get_device 2>/dev/null || true)
      log_info "Android device: ${device:-<none — dry run>}"
    else
      IOS_UDID=$(ios_get_booted_udid 2>/dev/null || true)
      log_info "iOS simulator: ${IOS_UDID:-<none — dry run>}"
    fi
  else
    if [[ "$PLATFORM" == "android" ]]; then
      local device
      device=$(android_get_device)
      if [[ -z "$device" ]]; then
        log_fail "No Android device/emulator found. Start one with: emulator -avd <name>"
        exit 1
      fi
      log_info "Android device: $device"
    elif [[ "$PLATFORM" == "ios" ]]; then
      ios_ensure_udid
    fi
  fi

  # Build if requested
  if $BUILD_FIRST; then
    build_app
  fi

  # Get phases from the plan
  local num_phases
  num_phases=$(echo "$PLAN" | jq '.phases | length')
  log_info "Test plan has ${num_phases} phases"

  local p=0
  while [[ $p -lt $num_phases ]]; do
    local phase
    phase=$(echo "$PLAN" | jq -c ".phases[$p]")
    local pid
    pid=$(echo "$phase" | jq -r '.id')

    # Apply phase filter if set
    if [[ -n "$PHASE_FILTER" && "$pid" != "$PHASE_FILTER" ]]; then
      log_debug "Skipping phase $pid (filter: $PHASE_FILTER)"
      p=$((p + 1))
      continue
    fi

    run_phase "$phase"

    if $ABORTED; then
      log_warn "Run aborted after phase $pid"
      break
    fi

    p=$((p + 1))
  done

  # ── Final report ──────────────────────────────────────────────────────────

  local overall_status="PASS"
  if [[ $FAILED_CHECKS -gt 0 ]]; then
    overall_status="FAIL"
  fi
  if $ABORTED; then
    overall_status="ABORTED"
  fi

  local run_end
  run_end=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_epoch end_epoch duration_sec
  start_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$RUN_START" +%s 2>/dev/null || date -d "$RUN_START" +%s 2>/dev/null || echo "0")
  end_epoch=$(date +%s)
  duration_sec=$(( end_epoch - start_epoch ))

  local device_name=""
  if [[ "$PLATFORM" == "android" ]]; then
    device_name=$(android_get_device 2>/dev/null || echo "N/A")
  else
    device_name="${IOS_UDID:-N/A}"
  fi

  local report
  report=$(jq -n \
    --arg rid "$RUN_ID" \
    --arg plat "$PLATFORM" \
    --arg dev "$device_name" \
    --arg plan "$PLAN_ID" \
    --arg plugin "$PLUGIN_NAME" \
    --arg status "$overall_status" \
    --arg start "$RUN_START" \
    --arg end "$run_end" \
    --argjson dur "$duration_sec" \
    --argjson total "$TOTAL_CHECKS" \
    --argjson passed "$PASSED_CHECKS" \
    --argjson failed "$FAILED_CHECKS" \
    --argjson warned "$WARNED_CHECKS" \
    --argjson phases "$PHASE_RESULTS" \
    '{
      run_id: $rid,
      platform: $plat,
      device: $dev,
      plan_id: $plan,
      plugin: $plugin,
      overall_status: $status,
      started_at: $start,
      finished_at: $end,
      duration_sec: $dur,
      total_checks: $total,
      passed: $passed,
      failed: $failed,
      warned: $warned,
      phases: $phases
    }')

  # Write report
  if ! $DRY_RUN; then
    echo "$report" | jq '.' > "$REPORT_FILE"
    # Also write a latest.json symlink
    ln -sf "$(basename "$REPORT_FILE")" "${REPORT_DIR}/latest.json"
    log_info "Report saved to: $REPORT_FILE"
  fi

  # Print summary
  echo ""
  log_step "Summary"
  echo -e "  Plan:     ${PLAN_ID}"
  echo -e "  Plugin:   ${PLUGIN_NAME}"
  echo -e "  Platform: ${PLATFORM}"
  echo -e "  Device:   ${device_name}"
  echo -e "  Checks:   ${PASSED_CHECKS}/${TOTAL_CHECKS} passed, ${FAILED_CHECKS} failed, ${WARNED_CHECKS} warned"

  if [[ "$overall_status" == "PASS" ]]; then
    echo -e "  Status:   ${GREEN}${BOLD}PASS${NC}"
  elif [[ "$overall_status" == "ABORTED" ]]; then
    echo -e "  Status:   ${RED}${BOLD}ABORTED${NC}"
  else
    echo -e "  Status:   ${RED}${BOLD}FAIL${NC}"
  fi
  echo ""

  # Exit with appropriate code
  if [[ "$overall_status" != "PASS" ]]; then
    exit 1
  fi
}

main
