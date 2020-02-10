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

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(initSdk: (NSDictionary*)initSdkOptions
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {

    NSError *error = [self callSdkInternal:initSdkOptions];

    if(error){
        errorCallback(error);
    }
    else{
        successCallback(@[SUCCESS]);
    }
}


RCT_EXPORT_METHOD(initSdkWithPromise: (NSDictionary*)initSdkOptions
                  initSdkWithPromiseWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = [self callSdkInternal:initSdkOptions];

    if(error) {
        reject([NSString stringWithFormat: @"%ld", (long)error.code], error.domain, error);
    } else {
       resolve(@[SUCCESS]);
    }
}

RCT_EXPORT_METHOD(trackAppLaunch) {
    [[AppsFlyerTracker sharedTracker] trackAppLaunch];
}

RCT_EXPORT_METHOD(trackEvent: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    NSError *error = [self trackEventInternal:eventName eventValues:eventValues];

    if(error) {
        errorCallback(error);
    } else {
        //TODO wait callback from SDK
        successCallback(@[SUCCESS]);
    }
}

RCT_EXPORT_METHOD(trackEventWithPromise: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  trackEventWithPromiseWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSError *error = [self trackEventInternal:eventName eventValues:eventValues];

    if(error){
        reject([NSString stringWithFormat: @"%ld", (long)error.code], error.domain, error);
    }
    else{
         //TODO wait callback from SDK
        resolve(@[SUCCESS]);
    }
}

RCT_EXPORT_METHOD(getAppsFlyerUID: (RCTResponseSenderBlock)callback) {
    NSString *uid = [[AppsFlyerTracker sharedTracker] getAppsFlyerUID];
    callback(@[[NSNull null], uid]);
}

RCT_EXPORT_METHOD(setCustomerUserId: (NSString *)userId callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerTracker sharedTracker] setCustomerUserID:userId];
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(stopTracking: (BOOL)isStopTracking callback:(RCTResponseSenderBlock)callback) {
    [AppsFlyerTracker sharedTracker].isStopTracking  = isStopTracking;
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(trackLocation: (double)longitude latitude:(double)latitude callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerTracker sharedTracker] trackLocation:longitude latitude:latitude];
    NSArray *events = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    callback(@[[NSNull null], events]);
}

RCT_EXPORT_METHOD(setUserEmails: (NSDictionary*)options
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
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

 -(NSError *) callSdkInternal:(NSDictionary*)initSdkOptions {

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
        return error;
    }
    else{
        if(isConversionData == YES){
            [AppsFlyerTracker sharedTracker].delegate = self;
        }

        [AppsFlyerTracker sharedTracker].appleAppID = appId;
        [AppsFlyerTracker sharedTracker].appsFlyerDevKey = devKey;
        [AppsFlyerTracker sharedTracker].isDebug = isDebug;
        [[AppsFlyerTracker sharedTracker] trackAppLaunch];

        return nil;
    }
}

-(NSError *) trackEventInternal: (NSString *)eventName eventValues:(NSDictionary *)eventValues {

    if (!eventName || [eventName isEqualToString:@""]) {
        NSError *error = [NSError errorWithDomain:NO_EVENT_NAME_FOUND code:2 userInfo:nil];
        return error;
    }

    [[AppsFlyerTracker sharedTracker] trackEvent:eventName withValues:eventValues];
    return nil;
}

RCT_EXPORT_METHOD(setAdditionalData: (NSDictionary *)additionalData callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerTracker sharedTracker] setAdditionalData:additionalData];
    callback(@[SUCCESS]);
}

//USER INVITES

RCT_EXPORT_METHOD(setAppInviteOneLinkID: (NSString *)oneLinkID callback:(RCTResponseSenderBlock)callback) {
    [AppsFlyerTracker sharedTracker].appInviteOneLinkID = oneLinkID;
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(setCurrencyCode: (NSString *)currencyCode callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerTracker sharedTracker] setCurrencyCode:currencyCode];
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(generateInviteLink: (NSDictionary *)inviteLinkOptions
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseSenderBlock)errorCallback) {

    NSDictionary* customParams = (NSDictionary*)[inviteLinkOptions objectForKey: @"userParams"];

    if (![inviteLinkOptions isKindOfClass:[NSNull class]]) {

        [AppsFlyerShareInviteHelper generateInviteUrlWithLinkGenerator:^AppsFlyerLinkGenerator * _Nonnull(AppsFlyerLinkGenerator * _Nonnull generator) {

            [generator setChannel:[inviteLinkOptions objectForKey: @"channel"]];
            [generator setReferrerCustomerId:[inviteLinkOptions objectForKey: @"customerID"]];
            [generator setCampaign:[inviteLinkOptions objectForKey: @"campaign"]];
            [generator setReferrerName:[inviteLinkOptions objectForKey: @"referrerName"]];
            [generator setReferrerImageURL:[inviteLinkOptions objectForKey: @"referrerImageUrl"]];
            [generator setDeeplinkPath:[inviteLinkOptions objectForKey: @"deeplinkPath"]];
            [generator setBaseDeeplink:[inviteLinkOptions objectForKey: @"baseDeeplink"]];

            if (![customParams isKindOfClass:[NSNull class]]) {
                [generator addParameters:customParams];
            }

            return generator;
        } completionHandler:^(NSURL * _Nullable url) {

            NSString * resultURL = url.absoluteString;
            if(resultURL != nil){
                successCallback(@[resultURL]);
            }
        }];
    }

}

//CROSS PROMOTION
RCT_EXPORT_METHOD(trackCrossPromotionImpression: (NSString *)appId campaign:(NSString *)campaign) {
    if (appId != nil && ![appId isEqualToString:@""]) {
        [AppsFlyerCrossPromotionHelper trackCrossPromoteImpression:appId campaign:campaign];
    }
}

RCT_EXPORT_METHOD(trackAndOpenStore: (NSString *)appID
                  campaign:(NSString *)campaign
                  customParams:(NSDictionary *)customParams) {

    if (appID != nil && ![appID isEqualToString:@""]) {
        [AppsFlyerShareInviteHelper generateInviteUrlWithLinkGenerator:^AppsFlyerLinkGenerator * _Nonnull(AppsFlyerLinkGenerator * _Nonnull generator) {
            if (campaign != nil && ![campaign isEqualToString:@""]) {
                [generator setCampaign:campaign];
            }
            if (![customParams isKindOfClass:[NSNull class]]) {
                [generator addParameters:customParams];
            }

            return generator;
        } completionHandler: ^(NSURL * _Nullable url) {
            NSString *appLink = url.absoluteString;
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:appLink] options:@{} completionHandler:^(BOOL success) {

            }];
        }];
    }
}

-(void)onConversionDataSuccess:(NSDictionary*) installData {

    NSDictionary* message = @{
                              @"status": afSuccess,
                              @"type": afOnInstallConversionDataLoaded,
                              @"data": [installData copy]
                              };

    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:message waitUntilDone:NO];

}


-(void)onConversionDataFail:(NSError *) _errorMessage {

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


-(void) handleCallback:(NSDictionary *) message {
    NSError *error;

    if ([NSJSONSerialization isValidJSONObject:message]) {
        NSData *jsonMessage = [NSJSONSerialization dataWithJSONObject:message
                                                              options:0
                                                                error:&error];
        if (jsonMessage) {
            NSString *jsonMessageStr = [[NSString alloc] initWithBytes:[jsonMessage bytes] length:[jsonMessage length] encoding:NSUTF8StringEncoding];

            NSString* status = (NSString*)[message objectForKey: @"status"];
            NSString* type = (NSString*)[message objectForKey: @"type"];

            if([status isEqualToString:afSuccess]){
                [self reportOnSuccess:jsonMessageStr type:type];
            }
            else{
                [self reportOnFailure:jsonMessageStr type:type];
            }

            NSLog(@"jsonMessageStr = %@",jsonMessageStr);
        } else {
            NSLog(@"%@",error);
        }
    }
    else{
        NSLog(@"failed to parse Response");
    }
}

- (NSArray<NSString *> *)supportedEvents {
    return @[afOnAttributionFailure,afOnAppOpenAttribution,afOnInstallConversionFailure, afOnInstallConversionDataLoaded];
}

-(void) reportOnFailure:(NSString *)errorMessage type:(NSString*) type {
    [self sendEventWithName:type body:errorMessage];
}

-(void) reportOnSuccess:(NSString *)data type:(NSString*) type {
    if([type isEqualToString:afOnInstallConversionDataLoaded]){
        [self sendEventWithName:type body:data];
    } else {
        [self sendEventWithName:type body:data];
    }
}

RCT_EXPORT_METHOD(setDeviceTrackingDisabled: (BOOL *)b callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerTracker sharedTracker] setDeviceTrackingDisabled:b];
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(updateServerUninstallToken: (NSData *)deviceToken callback:(RCTResponseSenderBlock)callback) {
    deviceToken = [deviceToken stringByReplacingOccurrencesOfString:@" " withString:@""];
    NSMutableData *deviceTokenData= [[NSMutableData alloc] init];
    unsigned char whole_byte;
    char byte_chars[3] = {'\0','\0','\0'};
    int i;
    for (i=0; i < [deviceToken length]/2; i++) {
        byte_chars[0] = [deviceToken characterAtIndex:i*2];
        byte_chars[1] = [deviceToken characterAtIndex:i*2+1];
        whole_byte = strtol(byte_chars, NULL, 16);
        [deviceTokenData appendBytes:&whole_byte length:1];
    }
    [[AppsFlyerTracker sharedTracker] registerUninstall:deviceTokenData];
    callback(@[SUCCESS]);
}

@end
