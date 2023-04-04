#import "RNAppsFlyer.h"

@implementation RNAppsFlyer
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(initSdkWithCallBack: (NSDictionary*)initSdkOptions
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {


    NSError* error = nil;
    error = [self callSdkInternal:initSdkOptions];
    if (error == nil){
        successCallback(@[SUCCESS]);
    }else{
        errorCallback(error);
    }
}

RCT_EXPORT_METHOD(initSdkWithPromise: (NSDictionary*)initSdkOptions
                  initSdkWithPromiseWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSError* error = nil;
    error = [self callSdkInternal:initSdkOptions];
    if (error == nil){
        resolve(@[SUCCESS]);
    }else{
        reject([NSString stringWithFormat: @"%ld", (long)error.code], error.domain, error);    }
}

-(NSError *) callSdkInternal:(NSDictionary*)initSdkOptions {

    NSString* devKey = nil;
    NSString* appId = nil;
    BOOL isDebug = NO;
    BOOL isConversionData = YES;
    BOOL isDeepLinking = NO;
    BOOL isManualStart = NO;
    NSNumber* interval = 0;

    if (![initSdkOptions isKindOfClass:[NSNull class]]) {

        id isDebugValue = nil;
        id isConversionDataValue = nil;
        id isDeepLinkingValue = nil;
        devKey = (NSString*)[initSdkOptions objectForKey: afDevKey];
        appId = (NSString*)[initSdkOptions objectForKey: afAppId];
        interval = (NSNumber*)[initSdkOptions objectForKey: timeToWaitForATTUserAuthorization];
        isManualStart = [[initSdkOptions objectForKey:@"manualStart"] boolValue];
        [self setIsManualStart:isManualStart];

        isDebugValue = [initSdkOptions objectForKey: afIsDebug];
        if ([isDebugValue isKindOfClass:[NSNumber class]]) {
            // isDebug is a boolean that will come through as an NSNumber
            isDebug = [(NSNumber*)isDebugValue boolValue];
        }
        isConversionDataValue = [initSdkOptions objectForKey: afConversionData];

        if ([isConversionDataValue isKindOfClass:[NSNumber class]]) {
            isConversionData = [(NSNumber*)isConversionDataValue boolValue];
        }

        isDeepLinkingValue = [initSdkOptions objectForKey: afDeepLink];
        if ([isDeepLinkingValue isKindOfClass:[NSNumber class]]) {
            isDeepLinking = [(NSNumber*)isDeepLinkingValue boolValue];
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
            [AppsFlyerLib shared].delegate = self;
        }
        if(isDeepLinking == YES){
            [AppsFlyerLib shared].deepLinkDelegate = self;
        }
#ifndef AFSDK_NO_IDFA
        if (interval != 0 && interval != nil){
            double timeoutInterval = [interval doubleValue];
            [[AppsFlyerLib shared] waitForATTUserAuthorizationWithTimeoutInterval:timeoutInterval];
        }
#endif
        [AppsFlyerLib shared].appleAppID = appId;
        [AppsFlyerLib shared].appsFlyerDevKey = devKey;
        [AppsFlyerLib shared].isDebug = isDebug;

        //post notification for the deep link object that the bridge is initialized and he can handle deep link
        [[AppsFlyerAttribution shared] setRNAFBridgeReady:YES];
        [[NSNotificationCenter defaultCenter] postNotificationName:RNAFBridgeInitializedNotification object:self];
        // Register for background-foreground transitions natively instead of doing this in JavaScript
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(sendLaunch:)
                                                     name:UIApplicationDidBecomeActiveNotification
                                                   object:nil];
        if (!isManualStart) {
            [[AppsFlyerLib shared] start];
        }
        return nil;
    }
}

RCT_EXPORT_METHOD(startSdk) {
    [self setIsManualStart:NO];
    [[AppsFlyerLib shared] start];
}

RCT_EXPORT_METHOD(logEvent: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseSenderBlock)errorCallback) {
    if (!eventName || [eventName isEqualToString:@""]) {
        NSError *error = [NSError errorWithDomain:NO_EVENT_NAME_FOUND code:2 userInfo:nil];
        errorCallback(@[error.localizedDescription]);
        return ;
    }

    [[AppsFlyerLib shared] logEventWithEventName:eventName eventValues:eventValues completionHandler:^(NSDictionary<NSString *,id> * _Nullable dictionary, NSError * _Nullable error) {
        if(error){
            errorCallback(@[error.localizedDescription]);
            return;
        }
        successCallback(@[SUCCESS]);
    }];
}

RCT_EXPORT_METHOD(logEventWithPromise: (NSString *)eventName eventValues:(NSDictionary *)eventValues
                  logEventWithPromiseWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!eventName || [eventName isEqualToString:@""]) {
        NSError *error = [NSError errorWithDomain:NO_EVENT_NAME_FOUND code:2 userInfo:nil];
        reject([NSString stringWithFormat: @"%ld", (long)error.code], error.domain, error);
        return ;
    }

    [[AppsFlyerLib shared] logEventWithEventName:eventName eventValues:eventValues completionHandler:^(NSDictionary<NSString *,id> * _Nullable dictionary, NSError * _Nullable error) {
        if(error){
            reject([NSString stringWithFormat: @"%ld", (long)error.code], error.domain, error);
            return;
        }
        resolve(@[SUCCESS]);
    }];
}

RCT_EXPORT_METHOD(getAppsFlyerUID: (RCTResponseSenderBlock)callback) {
    NSString *uid = [[AppsFlyerLib shared] getAppsFlyerUID];
    callback(@[[NSNull null], uid]);
}

RCT_EXPORT_METHOD(setCustomerUserId: (NSString *)userId callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerLib shared] setCustomerUserID:userId];
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(stop: (BOOL)isStopped callback:(RCTResponseSenderBlock)callback) {
    [AppsFlyerLib shared].isStopped  = isStopped;
     callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(logLocation: (double)longitude latitude:(double)latitude callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerLib shared] logLocation:longitude latitude:latitude];
    NSArray *events = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    callback(@[SUCCESS, events]);
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
                case EmailCryptTypeSHA256:
                    emailsCryptType = EmailCryptTypeSHA256;
                    break;
                default:
                    emailsCryptType = EmailCryptTypeNone;
            }
        }
    }

    NSError* error = nil;

    if (!emails || [emails count] == 0) {
        error = [NSError errorWithDomain:EMPTY_OR_CORRUPTED_LIST code:0 userInfo:nil];
    }

    if(error != nil){
        errorCallback(error);
    }
    else{
        [[AppsFlyerLib shared] setUserEmails:emails withCryptType:emailsCryptType];
        successCallback(@[SUCCESS]);
    }
}

-(void)sendLaunch:(UIApplication *)application {
    [[NSNotificationCenter defaultCenter] postNotificationName:RNAFBridgeInitializedNotification object:self];
    if (![self isManualStart]) {
        [[AppsFlyerLib shared] start];
    }
}

RCT_EXPORT_METHOD(setAdditionalData: (NSDictionary *)additionalData callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerLib shared] setAdditionalData:additionalData];
    callback(@[SUCCESS]);
}

//USER INVITES

RCT_EXPORT_METHOD(setAppInviteOneLinkID: (NSString *)oneLinkID callback:(RCTResponseSenderBlock)callback) {
    [AppsFlyerLib shared].appInviteOneLinkID = oneLinkID;
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(setCurrencyCode: (NSString *)currencyCode callback:(RCTResponseSenderBlock)callback) {
    [[AppsFlyerLib shared] setCurrencyCode:currencyCode];
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
            [generator setBrandDomain:[inviteLinkOptions objectForKey: @"brandDomain"]];


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
RCT_EXPORT_METHOD(logCrossPromotionImpression: (NSString *)appId campaign:(NSString *)campaign parameters:(NSDictionary *)parameters) {
        [AppsFlyerCrossPromotionHelper logCrossPromoteImpression:appId campaign:campaign parameters:parameters];
}

RCT_EXPORT_METHOD(logCrossPromotionAndOpenStore: (NSString *)appID
                  campaign:(NSString *)campaign
                  customParams:(NSDictionary *)customParams) {

    [AppsFlyerCrossPromotionHelper logAndOpenStore: appID campaign:campaign parameters:customParams openStore:^(NSURLSession * _Nonnull urlSession, NSURL * _Nonnull clickURL) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [[UIApplication sharedApplication] openURL:clickURL options:@{} completionHandler:^(BOOL success) {
                NSLog(@"AppsFlyer openAppStoreForAppID completionHandler result %d",success);
            }];
        });
    }];
}

- (void)didResolveDeepLink:(AppsFlyerDeepLinkResult* _Nonnull) result {
    NSString *deepLinkStatus = nil;
    switch(result.status) {
        case AFSDKDeepLinkResultStatusFound:
            deepLinkStatus = @"FOUND";
            break;
        case AFSDKDeepLinkResultStatusNotFound:
            deepLinkStatus = @"NOT_FOUND";
            break;
        case AFSDKDeepLinkResultStatusFailure:
            deepLinkStatus = @"ERROR";
            break;
        default:
            [NSException raise:NSGenericException format:@"Unexpected FormatType."];
    }
        NSMutableDictionary* message = [[NSMutableDictionary alloc] initWithCapacity:5];
        message[@"status"] = ([deepLinkStatus isEqual:@"ERROR"] || [deepLinkStatus isEqual:@"NOT_FOUND"]) ? afFailure : afSuccess;
        message[@"deepLinkStatus"] = deepLinkStatus;
        message[@"type"] = afOnDeepLinking;
        message[@"isDeferred"] = result.deepLink.isDeferred ? @YES : @NO;
        if([deepLinkStatus  isEqual: @"ERROR"]){
            message[@"data"] = result.error.localizedDescription;
        }else if([deepLinkStatus  isEqual: @"NOT_FOUND"]){
            message[@"data"] = @"deep link not found";
        }else{
            message[@"data"] = result.deepLink.clickEvent;
        }

    [self performSelectorOnMainThread:@selector(handleCallback:) withObject:message waitUntilDone:NO];
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
    NSLog(@"[DEBUG] AppsFlyer = %@",_errorMessage.localizedDescription);
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
    NSLog(@"[DEBUG] AppsFlyer = %@",_errorMessage.localizedDescription);
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
    return @[afOnAttributionFailure,afOnAppOpenAttribution,afOnInstallConversionFailure, afOnInstallConversionDataLoaded, afOnDeepLinking];
}

-(void) reportOnFailure:(NSString *)errorMessage type:(NSString*) type {
    @try {
        [self sendEventWithName:type body:errorMessage];
    } @catch (NSException *exception) {
        NSLog(@"AppsFlyer Debug: %@", exception);
    }
}

-(void) reportOnSuccess:(NSString *)data type:(NSString*) type {
    @try {
        [self sendEventWithName:type body:data];
    } @catch (NSException *exception) {
        NSLog(@"AppsFlyer Debug: %@", exception);
    }
}

RCT_EXPORT_METHOD(anonymizeUser: (BOOL *)b callback:(RCTResponseSenderBlock)callback) {
    [AppsFlyerLib shared].anonymizeUser = b;
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(updateServerUninstallToken: (NSString *)deviceToken callback:(RCTResponseSenderBlock)callback) {
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
    [[AppsFlyerLib shared] registerUninstall:deviceTokenData];
    callback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(setOneLinkCustomDomains:(NSArray *) domains
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    [[AppsFlyerLib shared] setOneLinkCustomDomains:domains];
    successCallback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(setResolveDeepLinkURLs:(NSArray *) urls
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    [[AppsFlyerLib shared] setResolveDeepLinkURLs:urls];
    successCallback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(performOnAppAttribution:(NSString *) urlString
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    NSURL *url = [NSURL URLWithString:urlString];
    if (url == nil) {
        NSError* error = [NSError errorWithDomain:INVALID_URI code:0 userInfo:nil];
        errorCallback(error);
    } else {
        [[AppsFlyerLib shared] performOnAppAttributionWithURL:url];
        successCallback(@[SUCCESS]);
    }
}

RCT_EXPORT_METHOD(setSharingFilterForPartners:(NSArray *)partners) {
    [[AppsFlyerLib shared] setSharingFilterForPartners:partners];
}

#ifndef AFSDK_NO_IDFA
RCT_EXPORT_METHOD(disableAdvertisingIdentifier:(BOOL)shouldDisable) {
    [AppsFlyerLib shared].disableAdvertisingIdentifier = shouldDisable;
}
#endif

RCT_EXPORT_METHOD(disableCollectASA: (BOOL)shouldDisable) {
    [AppsFlyerLib shared].disableCollectASA = shouldDisable;
}

RCT_EXPORT_METHOD(disableIDFVCollection: (BOOL)shouldDisable) {
    [[AppsFlyerLib shared] setDisableIDFVCollection:shouldDisable];
}

RCT_EXPORT_METHOD(setUseReceiptValidationSandbox: (BOOL)isSandbox) {
    [AppsFlyerLib shared].useReceiptValidationSandbox = isSandbox;
}

RCT_EXPORT_METHOD(validateAndLogInAppPurchase: (NSDictionary*)purchaseInfo
                  successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    NSString* productIdentifier = nil;
       NSString* tranactionId = nil;
       NSString* price = nil;
       NSString* currency = nil;
       NSDictionary* additionalParameters = nil;
       NSError* error = nil;


       if(![purchaseInfo isKindOfClass: [NSNull class]]){
           productIdentifier = (NSString*)[purchaseInfo objectForKey: afProductIdentifier];
           tranactionId = (NSString*)[purchaseInfo objectForKey: afTransactionId];
           price = (NSString*)[purchaseInfo objectForKey: afPrice];
           currency = (NSString*)[purchaseInfo objectForKey: afCurrency];
           additionalParameters = (NSDictionary*)[purchaseInfo objectForKey: afAdditionalParameters];

        [[AppsFlyerLib shared] validateAndLogInAppPurchase:productIdentifier price:price currency:currency transactionId:tranactionId additionalParameters:additionalParameters success:^(NSDictionary * _Nonnull response) {
            successCallback(@[@"In App Purchase Validation completed successfully!"]);
        } failure:^(NSError * _Nullable error, id  _Nullable reponse) {
            errorCallback(error);
        }];

    }else{
        error = [NSError errorWithDomain:NO_PARAMETERS_ERROR code:0 userInfo:nil];
        errorCallback(error);
    }

}

RCT_EXPORT_METHOD(sendPushNotificationData: (NSDictionary*)pushPayload errorCallBack:(RCTResponseErrorBlock)errorCallBack) {
    [[AppsFlyerLib shared] handlePushNotification:pushPayload];
}

RCT_EXPORT_METHOD(setHost: (NSString*)hostPrefix hostName: (NSString*)hostName successCallback :(RCTResponseSenderBlock)successCallback) {
    [[AppsFlyerLib shared] setHost:hostName withHostPrefix:hostPrefix];
    successCallback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(addPushNotificationDeepLinkPath: (NSArray*)path successCallback :(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback) {
    [[AppsFlyerLib shared] addPushNotificationDeepLinkPath: path];
    successCallback(@[SUCCESS]);
}

RCT_EXPORT_METHOD(disableSKAD: (BOOL *)b ) {
    [AppsFlyerLib shared].disableSKAdNetwork = b;
    if (b){
        NSLog(@"[DEBUG] AppsFlyer: SKADNetwork is disabled");
    }else{
        NSLog(@"[DEBUG] AppsFlyer: SKADNetwork is enabled");
    }
}

RCT_EXPORT_METHOD(setCurrentDeviceLanguage: (NSString *)language ) {
    [[AppsFlyerLib shared] setCurrentDeviceLanguage:language];
}

RCT_EXPORT_METHOD(setPartnerData:(NSString *)partnerId partnerData:(NSDictionary *)partnerData) {
    [[AppsFlyerLib shared] setPartnerDataWithPartnerId:partnerId partnerInfo:partnerData];
}

RCT_EXPORT_METHOD(appendParametersToDeepLinkingURL:(NSString *)contains partnerData:(NSDictionary *)parameters) {
    [[AppsFlyerLib shared] appendParametersToDeepLinkingURLWithString:contains parameters:parameters];
}
@end
