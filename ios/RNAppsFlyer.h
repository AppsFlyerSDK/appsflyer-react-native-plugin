
#import "RCTBridgeModule.h"

@interface RNAppsFlyer : NSObject <RCTBridgeModule,AppsFlyerTrackerDelegate>

@end


  // Appsflyer JS objects
  #define afDevKey                        @"devKey"
  #define afAppId                         @"appId"
  #define afIsDebug                       @"isDebug"

  #define afEmailsCryptType               @"emailsCryptType"
  #define afEmails                        @"emails"

// Appsflyer native objects
  #define afConversionData                @"onInstallConversionDataListener"
  #define afOnInstallConversionData       @"onInstallConversionData"
  #define afSuccess                       @"success"
  #define afFailure                       @"failure"
  #define afOnAttributionFailure          @"onAttributionFailure"
  #define afOnAppOpenAttribution          @"onAppOpenAttribution"
  #define afOnInstallConversionFailure    @"onInstallConversionFailure"
  #define afOnInstallConversionDataLoaded @"onInstallConversionDataLoaded"
