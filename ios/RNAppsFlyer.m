#import "AppsFlyerTracker.h"
#import "RNAppsFlyer.h"

@implementation RNAppsFlyer


static NSString *const NO_DEVKEY_FOUND       = @"No 'devKey' found or its empty";
static NSString *const NO_APPID_FOUND        = @"No 'appId' found or its empty";

static NSString *const NO_EVENT_NAME_FOUND   = @"No 'eventName' found or its empty";
static NSString *const NO_EVENT_VALUES_FOUND = @"No 'eventValues' found or Dictionary its empty";

static NSString *const SUCCESS         = @"Success";


RCT_EXPORT_MODULE()


RCT_EXPORT_METHOD(initSdk: (NSDictionary*)initSdkOptions
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback
                  )
{
    
    NSString* devKey = nil;
    NSString* appId = nil;
    BOOL isDebug = NO;

    if (![initSdkOptions isKindOfClass:[NSNull class]]) {

        id value = nil;
        devKey = (NSString*)[initSdkOptions objectForKey: afDevKey];
        appId = (NSString*)[initSdkOptions objectForKey: afAppId];

        value = [initSdkOptions objectForKey: afIsDebug];
        if ([value isKindOfClass:[NSNumber class]]) {
            // isDebug is a boolean that will come through as an NSNumber
            isDebug = [(NSNumber*)value boolValue];
        }
    }

    NSError* error = nil;

    if (!devKey || [devKey isEqualToString:@""]) {
        error = [NSError errorWithDomain:NO_DEVKEY_FOUND code:0 userInfo:nil];
        
    }
    else if (!appId || [appId isEqualToString:@""]) {
        error = [NSError errorWithDomain:NO_APPID_FOUND code:1 userInfo:nil];
    }


    if(error != nil){
        errorCallback(error);
    }
    else{
        [AppsFlyerTracker sharedTracker].appleAppID = appId;
        [AppsFlyerTracker sharedTracker].appsFlyerDevKey = devKey;
        // [AppsFlyerTracker sharedTracker].delegate = self;  // moved to 'pluginInitialize'
        [AppsFlyerTracker sharedTracker].isDebug = isDebug;
        [[AppsFlyerTracker sharedTracker] trackAppLaunch];
        
        successCallback(@[SUCCESS]);
                }
}


RCT_EXPORT_METHOD(trackEvent: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
    NSString* error = nil;
    
    if (!eventName || [eventName isEqualToString:@""]) {
        error = [NSError errorWithDomain:NO_DEVKEY_FOUND code:2 userInfo:nil];
    }
    else if (!eventValues || [eventValues count] == 0) {
        error = [NSError errorWithDomain:NO_EVENT_VALUES_FOUND code:3 userInfo:nil];
    }
    
    if(error != nil){
         errorCallback(error);
    }
    else{
        
        [[AppsFlyerTracker sharedTracker] trackEvent:eventName withValues:eventValues];
        
        //TODO wait callback from SDK
        successCallback(@[SUCCESS]);
     }
    }



RCT_EXPORT_METHOD(getAppsFlyerUID: (RCTResponseSenderBlock)callback)
{
    NSString *uid = [[AppsFlyerTracker sharedTracker] getAppsFlyerUID];
    callback(@[[NSNull null], uid]);
}

RCT_EXPORT_METHOD(trackLocation: (double)longitude latitude:(double)latitude callback:(RCTResponseSenderBlock)callback)
{
    [[AppsFlyerTracker sharedTracker] trackLocation:longitude latitude:latitude];

    NSArray *events = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    callback(@[[NSNull null], events]);
}

@end
