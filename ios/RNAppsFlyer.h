
#if __has_include(<React/RCTBridgeModule.h>) //ver >= 0.40
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTEventDispatcher.h>
#else //ver < 0.40
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#endif



@interface RNAppsFlyer : RCTEventEmitter <RCTBridgeModule>

@end

static NSString *const NO_DEVKEY_FOUND              = @"No 'devKey' found or its empty";
static NSString *const NO_APPID_FOUND               = @"No 'appId' found or its empty";
static NSString *const NO_EVENT_NAME_FOUND          = @"No 'eventName' found or its empty";
static NSString *const EMPTY_OR_CORRUPTED_LIST      = @"No arguments found or list is corrupted";
static NSString *const SUCCESS                      = @"Success";
static NSString *const IOS_14_ONLY                  = @"Feature only supported on iOS 14 and above";

  // Appsflyer JS objects
  #define afDevKey                        @"devKey"
  #define afAppId                         @"appId"
  #define afIsDebug                       @"isDebug"
  #define advertisingIdWaitInterval       @"advertisingIdWaitInterval"

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

// User Invites, Cross Promotion
#define afCpAppID                       @"crossPromotedAppId"
#define afUiChannel                     @"channel"
#define afUiCampaign                    @"campaign"
#define afUiRefName                     @"referrerName"
#define afUiImageUrl                    @"referrerImageUrl"
#define afUiCustomerID                  @"customerID"
#define afUiBaseDeepLink                @"baseDeepLink"


