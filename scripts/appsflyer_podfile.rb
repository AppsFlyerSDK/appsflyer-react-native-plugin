# AppsFlyer React Native — Podfile helper for the opt-in SPM native-SDK path.
#
# Usage (ios/Podfile):
#   require Pod::Executable.execute_command('node', ['-p',
#     'require.resolve("react-native-appsflyer/scripts/appsflyer_podfile.rb", {paths: [process.argv[1]]})',
#     __dir__]).strip
#   ...
#   post_install do |installer|
#     react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)
#     appsflyer_embed_native_sdk_spm!(installer)   # <-- one line
#   end
#
# Why this is needed: when $RNAppsFlyerUseNativeSDKSPM is enabled, the AppsFlyer
# iOS SDK is resolved as an SPM product. CocoaPods embeds *pod* frameworks into the
# app but not *SPM* products, so without this the app crashes at launch with
# "dyld: Library not loaded: @rpath/AppsFlyerLib.framework/AppsFlyerLib".
#
# This helper adds an "Embed AppsFlyer SPM Frameworks" Run Script build phase to the
# app target that copies (and, on device builds, re-signs) the SPM frameworks into the
# app bundle. It is a no-op unless the SPM flag is enabled, and is idempotent.
require 'xcodeproj'

AF_SPM_EMBED_PHASE_NAME = 'Embed AppsFlyer SPM Frameworks'.freeze

AF_SPM_EMBED_SCRIPT = <<~'SH'.freeze
  set -e
  DEST="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"
  for fw in AppsFlyerLib PurchaseConnector; do
    SRC="${BUILT_PRODUCTS_DIR}/${fw}.framework"
    if [ -d "$SRC" ]; then
      mkdir -p "$DEST"
      rsync -a --delete "$SRC/" "$DEST/${fw}.framework/"
      if [ "${CODE_SIGNING_REQUIRED:-NO}" != "NO" ] && [ -n "${EXPANDED_CODE_SIGN_IDENTITY:-}" ]; then
        codesign --force --sign "${EXPANDED_CODE_SIGN_IDENTITY}" "$DEST/${fw}.framework"
      fi
    fi
  done
SH

# Adds the embed build phase to the app target(s). Pass the `installer` from post_install
# so we modify the SAME user-project object CocoaPods saves (modifying a separately-opened
# copy gets clobbered by CocoaPods' own integration save).
def appsflyer_embed_native_sdk_spm!(installer)
  return unless defined?($RNAppsFlyerUseNativeSDKSPM) && $RNAppsFlyerUseNativeSDKSPM == true

  found_app_target = false
  modified_projects = []

  installer.aggregate_targets.each do |aggregate|
    project = aggregate.user_project
    next if project.nil?

    aggregate.user_targets.each do |app_target|
      next unless app_target.respond_to?(:product_type) &&
                  app_target.product_type == 'com.apple.product-type.application'

      found_app_target = true
      next if app_target.shell_script_build_phases.any? { |p| p.name == AF_SPM_EMBED_PHASE_NAME } # idempotent

      phase = app_target.new_shell_script_build_phase(AF_SPM_EMBED_PHASE_NAME)
      phase.shell_script = AF_SPM_EMBED_SCRIPT
      modified_projects << project
      Pod::UI.puts "[AppsFlyer] Embedded SPM frameworks into target '#{app_target.name}'."
    end
  end

  # Save only the projects we actually modified, once each.
  modified_projects.uniq.each(&:save)

  # Warn only when there is genuinely no app target — NOT on idempotent re-runs
  # where the phase already exists (found_app_target is true but nothing changed).
  unless found_app_target
    Pod::UI.warn('[AppsFlyer] SPM embed: no application target found; framework not embedded.')
  end
end
