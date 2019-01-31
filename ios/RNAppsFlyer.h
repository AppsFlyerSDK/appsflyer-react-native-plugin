
#if __has_include(<React/RCTBridgeModule.h>) //ver >= 0.40
#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>
#else //ver < 0.40
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#endif



@interface RNAppsFlyer : NSObject <RCTBridgeModule>

@end


  // Appsflyer JS objects
  #define afDevKey                        @"devKey"
  #define afAppId                         @"appId"
  #define afOneLinkId                     @"oneLinkId"
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
