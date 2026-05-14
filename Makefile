# ─── AppsFlyer React Native Plugin — E2E Runner ─────────────────────────────
#
# Usage:
#   make e2e-ios                   Run all phases on iOS simulator
#   make e2e-android               Run all phases on Android emulator
#   make e2e-ios PHASE=phase_2     Run single phase on iOS
#   make e2e-android PHASE=phase_3 Run single phase on Android
#   make e2e-all                   Run full E2E on both platforms
#   make build-ios                 Build iOS example app
#   make build-android             Build Android example app
#   make e2e-ios-build             Build + run iOS E2E
#   make e2e-android-build         Build + run Android E2E
#   make report                   Show latest report
#   make clean                     Remove build artifacts and reports

SHELL := /bin/bash
RUNNER := scripts/af-scenario-runner.sh
PLAN := .af-e2e/test-plan.json

# Override these or set as env vars
IOS_SIMULATOR_UDID ?= $(shell xcrun simctl list devices booted 2>/dev/null | grep -oE '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}' | head -1)
ANDROID_SERIAL ?= $(shell adb devices 2>/dev/null | awk 'NR==2 && /device$$/{print $$1}')

# Optional: run a single phase
PHASE ?=
VERBOSE ?=

# Build flags
_PHASE_FLAG := $(if $(PHASE),--phase $(PHASE),)
_VERBOSE_FLAG := $(if $(VERBOSE),--verbose,)

# ─── iOS ────────────────────────────────────────────────────────────────────

.PHONY: build-ios
build-ios:
	@echo "Building iOS example app..."
	cd example/ios && xcodebuild build \
		-workspace example.xcworkspace \
		-scheme example \
		-configuration Debug \
		-destination 'platform=iOS Simulator,id=$(IOS_SIMULATOR_UDID)' \
		-derivedDataPath build \
		| tail -3

.PHONY: e2e-ios
e2e-ios:
	@test -n "$(IOS_SIMULATOR_UDID)" || { echo "Error: no booted iOS simulator found. Boot one first."; exit 1; }
	IOS_SIMULATOR_UDID=$(IOS_SIMULATOR_UDID) /bin/bash $(RUNNER) \
		--platform ios --plan $(PLAN) $(_PHASE_FLAG) $(_VERBOSE_FLAG)

.PHONY: e2e-ios-build
e2e-ios-build: build-ios e2e-ios

# ─── Android ────────────────────────────────────────────────────────────────

.PHONY: build-android
build-android:
	@echo "Building Android example app..."
	cd example/android && ./gradlew assembleDebug -q

.PHONY: e2e-android
e2e-android:
	@test -n "$(ANDROID_SERIAL)" || { echo "Error: no Android device/emulator found. Start one first."; exit 1; }
	ANDROID_SERIAL=$(ANDROID_SERIAL) /bin/bash $(RUNNER) \
		--platform android --plan $(PLAN) $(_PHASE_FLAG) $(_VERBOSE_FLAG)

.PHONY: e2e-android-build
e2e-android-build: build-android e2e-android

# ─── Both ───────────────────────────────────────────────────────────────────

.PHONY: e2e-all
e2e-all: e2e-ios e2e-android

# ─── Utilities ──────────────────────────────────────────────────────────────

.PHONY: report
report:
	@latest=$$(ls -t .af-e2e/reports/*.json 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then echo "No reports found."; exit 1; fi; \
	echo "Latest report: $$latest"; \
	python3 -m json.tool "$$latest" | head -40

.PHONY: reports
reports:
	@ls -lt .af-e2e/reports/*.json 2>/dev/null | head -10 || echo "No reports found."

.PHONY: clean
clean:
	rm -rf .af-e2e/reports/* .af-smoke/reports/*
	rm -rf example/ios/build
	cd example/android && ./gradlew clean -q 2>/dev/null || true
	@echo "Cleaned build artifacts and reports."

.PHONY: help
help:
	@echo "AppsFlyer React Native E2E Runner"
	@echo ""
	@echo "  make e2e-ios                   Run all E2E phases on iOS"
	@echo "  make e2e-android               Run all E2E phases on Android"
	@echo "  make e2e-ios PHASE=phase_1     Run single phase on iOS"
	@echo "  make e2e-android PHASE=phase_2 Run single phase on Android"
	@echo "  make e2e-ios VERBOSE=1         Run with verbose output"
	@echo "  make e2e-all                   Run on both platforms"
	@echo "  make e2e-ios-build             Build then run iOS"
	@echo "  make e2e-android-build         Build then run Android"
	@echo "  make build-ios                 Build iOS only"
	@echo "  make build-android             Build Android only"
	@echo "  make report                    Show latest report"
	@echo "  make reports                   List recent reports"
	@echo "  make clean                     Remove artifacts and reports"
