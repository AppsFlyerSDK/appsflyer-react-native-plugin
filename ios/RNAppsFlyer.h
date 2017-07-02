
#import <React/RCTBridgeModule.h>  //for react-native ver >= 0.40
//#import "RCTBridgeModule.h"        //for react-native ver < 0.40

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
