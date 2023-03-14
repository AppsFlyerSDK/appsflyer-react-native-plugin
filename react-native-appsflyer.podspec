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
  s.source_files     = 'ios/**/*.{h,m}'
  s.platform         = :ios, "9.0"
  s.static_framework = true
  s.dependency 'React'

  # AppsFlyerFramework
  if defined?($RNAppsFlyerStrictMode) && ($RNAppsFlyerStrictMode == true)
    Pod::UI.puts "#{s.name}: Using AppsFlyerFramework/Strict mode"
    s.dependency 'AppsFlyerFramework/Strict', '6.9.1'
    s.xcconfig = {'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) AFSDK_NO_IDFA=1' }
  else
    if !defined?($RNAppsFlyerStrictMode)
      Pod::UI.puts "#{s.name}: Using default AppsFlyerFramework. You may require App Tracking Transparency. Not allowed for Kids apps."
      Pod::UI.puts "#{s.name}: You may set variable `$RNAppsFlyerStrictMode=true` in Podfile to use strict mode for kids apps."
    end
    s.dependency 'AppsFlyerFramework', '6.9.1'
  end
end
