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
  s.source_files     = 'ios/**/*.{h,m,swift}'
  s.platform         = :ios, "12.0"
  s.static_framework = true
  s.swift_version    = '5.0'
  s.dependency 'React'
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
  
  # AppsFlyerPurchaseConnector
  if defined?($AppsFlyerPurchaseConnector) && ($AppsFlyerPurchaseConnector == true)
    Pod::UI.puts "#{s.name}: Including PurchaseConnector."
    s.dependency 'PurchaseConnector', '6.17.1'
  end

  # AppsFlyerFramework
  if defined?($RNAppsFlyerStrictMode) && ($RNAppsFlyerStrictMode == true)
    Pod::UI.puts "#{s.name}: Using AppsFlyerFramework/Strict mode"
    s.dependency 'AppsFlyerFramework/Strict', '6.17.1'
    s.xcconfig = {'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) AFSDK_NO_IDFA=1' }
  else
    if !defined?($RNAppsFlyerStrictMode)
      Pod::UI.puts "#{s.name}: Using default AppsFlyerFramework. You may require App Tracking Transparency. Not allowed for Kids apps."
      Pod::UI.puts "#{s.name}: You may set variable `$RNAppsFlyerStrictMode=true` in Podfile to use strict mode for kids apps."
    end
    s.dependency 'AppsFlyerFramework', '6.17.1'
  end
end
