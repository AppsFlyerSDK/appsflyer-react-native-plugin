
#if __has_include(<React/RCTBridgeModule.h>) //ver >= 0.40
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTEventDispatcher.h>
#else //ver < 0.40
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#endif

#import "AppsFlyerAttribution.h"
#import <objc/message.h>
//#if __has_include(<AppsFlyerLib/AppsFlyerLib.h>) // from Pod
//#import <AppsFlyerLib/AppsFlyerLib.h>
//#else
//#import "AppsFlyerLib.h"
//#endif


@interface RNAppsFlyer: RCTEventEmitter <RCTBridgeModule, AppsFlyerLibDelegate, AppsFlyerDeepLinkDelegate>
@property (readwrite, nonatomic) BOOL isManualStart;
@end


static NSString *const NO_DEVKEY_FOUND              = @"No 'devKey' found or its empty";
static NSString *const NO_APPID_FOUND               = @"No 'appId' found or its empty";
static NSString *const NO_EVENT_NAME_FOUND          = @"No 'eventName' found or its empty";
static NSString *const EMPTY_OR_CORRUPTED_LIST      = @"No arguments found or list is corrupted";
static NSString *const SUCCESS                      = @"Success";
static NSString *const INVALID_URI                  = @"Invalid URI";
static NSString *const IOS_14_ONLY                  = @"Feature only supported on iOS 14 and above";

  // Appsflyer JS objects
  #define afDevKey                                  @"devKey"
  #define afAppId                                   @"appId"
  #define afIsDebug                                 @"isDebug"
  #define timeToWaitForATTUserAuthorization         @"timeToWaitForATTUserAuthorization"

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
  #define afDeepLink                      @"onDeepLinkListener"
  #define afOnDeepLinking                 @"onDeepLinking"

// User Invites, Cross Promotion
#define afCpAppID                       @"crossPromotedAppId"
#define afUiChannel                     @"channel"
#define afUiCampaign                    @"campaign"
#define afUiRefName                     @"referrerName"
#define afUiImageUrl                    @"referrerImageUrl"
#define afUiCustomerID                  @"customerID"
#define afUiBaseDeepLink                @"baseDeepLink"

//RECEIPT VALIDATION
#define afProductIdentifier                       @"productIdentifier"
#define afTransactionId                     @"transactionId"
#define afPrice                    @"price"
#define afCurrency                    @"currency"
#define afAdditionalParameters                  @"additionalParameters"
static NSString *const NO_PARAMETERS_ERROR                  = @"No purchase parameters found";
static NSString *const VALIDATE_SUCCESS                  = @"In-App Purchase Validation success";
static NSString *const VALIDATE_FAILED                 = @"In-App Purchase Validation failed with error: ";



