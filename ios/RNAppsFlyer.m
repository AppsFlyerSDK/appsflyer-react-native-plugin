#import "RNAppsFlyer.h"

#if __has_include(<AppsFlyerLib/AppsFlyerTracker.h>) // from Pod
#import <AppsFlyerLib/AppsFlyerTracker.h>
#else
#import "AppsFlyerTracker.h"
#endif


@interface RNAppsFlyer() <AppsFlyerTrackerDelegate>

@end

@implementation RNAppsFlyer

@synthesize bridge = _bridge;


static NSString *const NO_DEVKEY_FOUND              = @"No 'devKey' found or its empty";
static NSString *const NO_APPID_FOUND               = @"No 'appId' found or its empty";
static NSString *const NO_EVENT_NAME_FOUND          = @"No 'eventName' found or its empty";
static NSString *const NO_EMAILS_FOUND_OR_CORRUPTED = @"No 'emails' found, or list is corrupted";
static NSString *const SUCCESS                      = @"Success";


RCT_EXPORT_MODULE()


RCT_EXPORT_METHOD(initSdk: (NSDictionary*)initSdkOptions
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback
                  )
{
    
    NSString* devKey = nil;
    NSString* appId = nil;
    BOOL isDebug = NO;
    BOOL isConversionData = NO;

    if (![initSdkOptions isKindOfClass:[NSNull class]]) {

        id isDebugValue = nil;
        id isConversionDataValue = nil;
        devKey = (NSString*)[initSdkOptions objectForKey: afDevKey];
        appId = (NSString*)[initSdkOptions objectForKey: afAppId];

        isDebugValue = [initSdkOptions objectForKey: afIsDebug];
        if ([isDebugValue isKindOfClass:[NSNumber class]]) {
            // isDebug is a boolean that will come through as an NSNumber
            isDebug = [(NSNumber*)isDebugValue boolValue];
        }
        isConversionDataValue = [initSdkOptions objectForKey: afConversionData];
        if ([isConversionDataValue isKindOfClass:[NSNumber class]]) {
            isConversionData = [(NSNumber*)isConversionDataValue boolValue];
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
        if(isConversionData == YES){
            [AppsFlyerTracker sharedTracker].delegate = self;
        }
        
        [AppsFlyerTracker sharedTracker].appleAppID = appId;
        [AppsFlyerTracker sharedTracker].appsFlyerDevKey = devKey;
        [AppsFlyerTracker sharedTracker].isDebug = isDebug;
        [[AppsFlyerTracker sharedTracker] trackAppLaunch];
        
        successCallback(@[SUCCESS]);
                }
}

RCT_EXPORT_METHOD(trackAppLaunch)
{
    [[AppsFlyerTracker sharedTracker] trackAppLaunch];
}


RCT_EXPORT_METHOD(trackEvent: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
    NSString* error = nil;
    
    if (!eventName || [eventName isEqualToString:@""]) {
        error = [NSError errorWithDomain:NO_DEVKEY_FOUND code:2 userInfo:nil];
    }
    // else if (!eventValues || [eventValues count] == 0) {
    //     error = [NSError errorWithDomain:NO_EVENT_VALUES_FOUND code:3 userInfo:nil];
    // }
    
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

RCT_EXPORT_METHOD(setCustomerUserId: (NSString *)userId callback:(RCTResponseSenderBlock)callback)
{
    [[AppsFlyerTracker sharedTracker] setCustomerUserID:userId];
    
    callback(@[SUCCESS]);
}
    
RCT_EXPORT_METHOD(stopTracking: (BOOL)isStopTracking callback:(RCTResponseSenderBlock)callback)
{
    [AppsFlyerTracker sharedTracker].isStopTracking  = isStopTracking;
    
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(trackLocation: (double)longitude latitude:(double)latitude callback:(RCTResponseSenderBlock)callback)
{
    [[AppsFlyerTracker sharedTracker] trackLocation:longitude latitude:latitude];

    NSArray *events = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    callback(@[[NSNull null], events]);
}



RCT_EXPORT_METHOD(setUserEmails: (NSDictionary*)options
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
    NSArray *emails = nil;
    id emailsCryptTypeId = nil;
    EmailCryptType emailsCryptType = EmailCryptTypeNone;
    
    if (![options isKindOfClass:[NSNull class]]) {
        emails = (NSArray*)[options valueForKey: afEmails];
        
        emailsCryptTypeId = [options objectForKey: afEmailsCryptType];
        if ([emailsCryptTypeId isKindOfClass:[NSNumber class]]) {
            
            int _t = [emailsCryptTypeId intValue];
            
            switch (_t) {
                case EmailCryptTypeSHA1:
                    emailsCryptType = EmailCryptTypeSHA1;
                    break;
                case EmailCryptTypeMD5:
                    emailsCryptType = EmailCryptTypeMD5;
                    break;
                default:
                    emailsCryptType = EmailCryptTypeNone;
            }
        }
    }
    
    NSError* error = nil;
    
    if (!emails || [emails count] == 0) {
        error = [NSError errorWithDomain:NO_EMAILS_FOUND_OR_CORRUPTED code:0 userInfo:nil];
    }
    
    if(error != nil){
        errorCallback(error);
    }
    else{
        [[AppsFlyerTracker sharedTracker] setUserEmails:emails withCryptType:emailsCryptType];
        successCallback(@[SUCCESS]);
    }
}



-(void)onConversionDataReceived:(NSDictionary*) installData {
    
    NSDictionary* message = @{
                              @"status": afSuccess,
                              @"type": afOnInstallConversionDataLoaded,
                              @"data": installData
                              };
    
    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:message waitUntilDone:NO];
  }


-(void)onConversionDataRequestFailure:(NSError *) _errorMessage {
    
    NSDictionary* errorMessage = @{
                                   @"status": afFailure,
                                   @"type": afOnInstallConversionFailure,
                                   @"data": _errorMessage.localizedDescription
                                   };
    
    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:errorMessage waitUntilDone:NO];
    }


- (void) onAppOpenAttribution:(NSDictionary*) attributionData {
    
    NSDictionary* message = @{
                                   @"status": afSuccess,
                                   @"type": afOnAppOpenAttribution,
                                   @"data": attributionData
                                   };
    
    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:message waitUntilDone:NO];
}

- (void) onAppOpenAttributionFailure:(NSError *)_errorMessage {
   
    NSDictionary* errorMessage = @{
                                   @"status": afFailure,
                                   @"type": afOnAttributionFailure,
                                   @"data": _errorMessage.localizedDescription
                                   };

    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:errorMessage waitUntilDone:NO];
}


-(void) handleCallback:(NSDictionary *) message{
    NSError *error;
    
    if ([NSJSONSerialization isValidJSONObject:message]) {
        NSData *jsonMessage = [NSJSONSerialization dataWithJSONObject:message
                                                              options:0
                                                                error:&error];
        if (jsonMessage) {
            NSString *jsonMessageStr = [[NSString alloc] initWithBytes:[jsonMessage bytes] length:[jsonMessage length] encoding:NSUTF8StringEncoding];
            
            NSString* status = (NSString*)[message objectForKey: @"status"];
            
            if([status isEqualToString:afSuccess]){
                [self reportOnSuccess:jsonMessageStr];
            }
            else{
                [self reportOnFailure:jsonMessageStr];
            }
            
            NSLog(@"jsonMessageStr = %@",jsonMessageStr);
        } else {
            NSLog(@"%@",error);
        }
    }
    else{
        [self reportOnFailure:@"failed to parse Response"];
    }
}

-(void) reportOnFailure:(NSString *)errorMessage {
    [self.bridge.eventDispatcher sendAppEventWithName:afOnInstallConversionData body:errorMessage];
}

-(void) reportOnSuccess:(NSString *)data {
    [self.bridge.eventDispatcher sendAppEventWithName:afOnInstallConversionData body:data];
}

@end
