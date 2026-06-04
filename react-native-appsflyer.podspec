require 'json'
pkg = JSON.parse(File.read("package.json"))

# `unless defined?` guards keep CocoaPods from warning "already initialized constant"
# when it evaluates the podspec more than once during a single `pod install`.
APPSFLYER_IOS_SDK_VERSION                    = '6.18.0' unless defined?(APPSFLYER_IOS_SDK_VERSION)
APPSFLYER_PURCHASE_CONNECTOR_VERSION         = '6.18.1' unless defined?(APPSFLYER_PURCHASE_CONNECTOR_VERSION)
APPSFLYER_SPM_CORE_DYNAMIC_URL               = 'https://github.com/AppsFlyerSDK/AppsFlyerFramework-Dynamic' unless defined?(APPSFLYER_SPM_CORE_DYNAMIC_URL)
APPSFLYER_SPM_PURCHASE_CONNECTOR_DYNAMIC_URL = 'https://github.com/AppsFlyerSDK/PurchaseConnector-Dynamic' unless defined?(APPSFLYER_SPM_PURCHASE_CONNECTOR_DYNAMIC_URL)

Pod::Spec.new do |s|
  spm_requested = defined?($RNAppsFlyerUseNativeSDKSPM) && $RNAppsFlyerUseNativeSDKSPM == true
  spm_available = defined?(spm_dependency) ? true : false
  strict_mode   = defined?($RNAppsFlyerStrictMode) && $RNAppsFlyerStrictMode == true
  # SPM resolves the native SDK only for the default (non-Strict) core, when requested and available.
  use_spm       = spm_requested && spm_available && !strict_mode

  s.name             = pkg["name"]
  s.version          = pkg["version"]
  s.summary          = pkg["description"]
  s.requires_arc     = true
  s.license          = pkg["license"]
  s.homepage         = pkg["homepage"]
  s.author           = pkg["author"]
  s.source           = { :git => pkg["repository"]["url"] }
  s.source_files     = 'ios/**/*.{h,m,swift}'
  s.platform         = :ios, "12.0"
  s.static_framework = !use_spm
  s.swift_version    = '5.0'
  # React dependency. The SPM path builds this pod as its own dynamic framework
  # (use_frameworks! :linkage => :dynamic), where it must link React-Core so RCTEventEmitter
  # (the base of RNAppsFlyer/PCAppsFlyer) resolves. install_modules_dependencies (RN 0.71+)
  # wires React-Core and the linker config for that; the legacy static path keeps `React`.
  if use_spm && defined?(install_modules_dependencies)
    install_modules_dependencies(s)
  else
    s.dependency 'React'
  end
  s.exclude_files = [
    "ios/AFAdRevenueData.h",
    "ios/AppsFlyerConsent.h",
    "ios/AppsFlyerCrossPromotionHelper.h",
    "ios/AppsFlyerDeepLink.h",
    "ios/AppsFlyerDeepLinkObserver.h",
    "ios/AppsFlyerDeepLinkResult.h",
    "ios/AppsFlyerLinkGenerator.h",
    "ios/AppsFlyerShareInviteHelper.h",
    "ios/AppsFlyerLib.h"
  ]

  if spm_requested && !spm_available
    Pod::UI.warn "#{s.name}: $RNAppsFlyerUseNativeSDKSPM set but React Native's spm_dependency helper is unavailable (requires RN 0.75+). Falling back to CocoaPods for the native SDK."
  end
  if spm_requested && strict_mode
    Pod::UI.puts "#{s.name}: $RNAppsFlyerUseNativeSDKSPM is ignored because $RNAppsFlyerStrictMode is enabled. AppsFlyerFramework/Strict is static-only and unsupported through SPM in this release. Falling back to CocoaPods for the native SDK."
  end

  # AppsFlyer core SDK. Strict mode forces the CocoaPods path (static-only); the default core can use SPM when opted in.
  if strict_mode
    Pod::UI.puts "#{s.name}: Using AppsFlyerFramework/Strict mode"
    s.dependency 'AppsFlyerFramework/Strict', APPSFLYER_IOS_SDK_VERSION
    s.xcconfig = {'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) AFSDK_NO_IDFA=1' }
  else
    if !defined?($RNAppsFlyerStrictMode)
      Pod::UI.puts "#{s.name}: Using default AppsFlyerFramework. You may require App Tracking Transparency. Not allowed for Kids apps."
      Pod::UI.puts "#{s.name}: You may set variable `$RNAppsFlyerStrictMode=true` in Podfile to use strict mode for kids apps."
    end
    if use_spm
      spm_dependency(s, url: APPSFLYER_SPM_CORE_DYNAMIC_URL, requirement: { kind: 'exactVersion', version: APPSFLYER_IOS_SDK_VERSION }, products: ['AppsFlyerLib-Dynamic'])
    else
      s.dependency 'AppsFlyerFramework', APPSFLYER_IOS_SDK_VERSION
    end
  end

  # PurchaseConnector (optional). PurchaseConnector-Dynamic has no transitive core dependency; the core block above declares the dynamic core.
  if defined?($AppsFlyerPurchaseConnector) && ($AppsFlyerPurchaseConnector == true)
    Pod::UI.puts "#{s.name}: Including PurchaseConnector."
    if use_spm
      spm_dependency(s, url: APPSFLYER_SPM_PURCHASE_CONNECTOR_DYNAMIC_URL, requirement: { kind: 'exactVersion', version: APPSFLYER_PURCHASE_CONNECTOR_VERSION }, products: ['PurchaseConnector-Dynamic'])
    else
      s.dependency 'PurchaseConnector', APPSFLYER_PURCHASE_CONNECTOR_VERSION
    end
  end
end
