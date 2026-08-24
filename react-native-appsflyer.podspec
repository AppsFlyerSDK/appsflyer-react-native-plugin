require 'json'
pkg = JSON.parse(File.read("package.json"))

Pod::Spec.new do |s|
  s.name             = pkg["name"]
  s.version          = pkg["version"]
  s.summary          = pkg["description"]
  s.requires_arc     = true
  s.license          = pkg["license"]
  s.homepage         = pkg["homepage"]
  s.author           = pkg["author"]
  s.source           = { :git => pkg["repository"]["url"] }
  s.source_files     = 'ios/**/*.{h,m,mm,swift}'
  s.private_header_files = 'ios/RNAppsFlyer.h', 'ios/RNAppsFlyer-Bridging-Header.h'
  s.script_phase = {
    :name => 'Generate primary module header for Swift import',
    :script => <<~'SCRIPT',
      set -e
      patched=0
      for f in \
        "${PODS_ROOT}/Target Support Files/react-native-appsflyer/react-native-appsflyer-umbrella.h" \
        "${TARGET_BUILD_DIR}/${PRODUCT_NAME}/react-native-appsflyer-umbrella.h"; do
        if [ -f "$f" ]; then
          sed -i '' '/AppsFlyerRPC/d' "$f"
          patched=1
        fi
      done
      if [ "$patched" -eq 0 ]; then
        echo "error: react-native-appsflyer: no umbrella header found at either candidate path — Swift import workaround did not run" >&2
        exit 1
      fi

      mkdir -p "${PODS_ROOT}/Headers/Public/react_native_appsflyer"
      echo '#import "react-native-appsflyer-umbrella.h"' > "${PODS_ROOT}/Headers/Public/react_native_appsflyer/react_native_appsflyer.h"
    SCRIPT
    :execution_position => :before_compile
  }
  s.platform         = :ios, "13.0"
  s.static_framework = true
  s.swift_version    = '5.9'
  s.dependency 'React'

  # AppsFlyerPurchaseConnector
  if defined?($AppsFlyerPurchaseConnector) && ($AppsFlyerPurchaseConnector == true)
    Pod::UI.puts "#{s.name}: Including PurchaseConnector."
    s.dependency 'PurchaseConnector', '7.0.1'
  end

  # AppsFlyerFramework (via AppsFlyerRPC)
  if defined?($RNAppsFlyerStrictMode) && ($RNAppsFlyerStrictMode == true)
    Pod::UI.puts "#{s.name}: Using AppsFlyerFramework/Strict mode"
    s.dependency 'AppsFlyerRPC/Strict', '7.0.13'
    s.xcconfig = {'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) AFSDK_NO_IDFA=1' }
  else
    unless defined?($RNAppsFlyerStrictMode)
      Pod::UI.puts "#{s.name}: Using default AppsFlyerFramework. You may require App Tracking Transparency. Not allowed for Kids apps."
      Pod::UI.puts "#{s.name}: You may set variable `$RNAppsFlyerStrictMode=true` in Podfile to use strict mode for kids apps."
    end
    s.dependency 'AppsFlyerRPC', '7.0.13'
  end

  install_modules_dependencies(s) if respond_to?(:install_modules_dependencies, true)
end
