//
//  AppsFlyerAttribution.m
//  react-native-appsflyer
//
//  Created by Amit Kremer on 11/02/2021.
//

#import <Foundation/Foundation.h>
#import "AppsFlyerAttribution.h"

@implementation AppsFlyerAttribution {
    NSUserActivity * _userActivity;
    NSURL * _url;
    NSString * _sourceApplication;
    NSDictionary * _options;
};

+ (instancetype)shared {
    static AppsFlyerAttribution *shared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shared = [[self alloc] init];
    });
    return shared;
}

- (id)init {
    if (self = [super init]) {
        _url = nil;
        _options = nil;
        _userActivity = nil;
        _sourceApplication = nil;
        _RNAFBridgeReady = NO;

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(receiveBridgeReadyNotification:)
                                                     name:RNAFBridgeInitializedNotification
                                                   object:nil];
    }
    return self;
}

#pragma mark - AppDelegate methods

- (void) continueUserActivity: (NSUserActivity*_Nullable) userActivity restorationHandler: (void (^_Nullable)(NSArray * _Nullable))restorationHandler{
    if(_RNAFBridgeReady == YES){
        [[AppsFlyerLib shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
    }else{
        _userActivity = userActivity;
    }
}

- (void) handleOpenUrl:(NSURL *)url options:(NSDictionary *)options{
    if(_RNAFBridgeReady == YES){
        [[AppsFlyerLib shared] handleOpenUrl:url options:options];
    }else{
        _url = url;
        _options = options;
    }
}

#pragma mark - Bridge initialized notification

- (void) receiveBridgeReadyNotification:(NSNotification *) notification {
    // RD-69546
    // start - We added this code because sometimes the SDK automatically resolves deeplinks on `applicationDidFinishLaunching`, and then when calling `continueUserActivity` on the same deeplink
    // it skips them.
    id AppsFlyer = [AppsFlyerLib shared];
    SEL setSkipNextUniversalLinkAttribution = NSSelectorFromString(@"setSkipNextUniversalLinkAttribution:");
    if ([AppsFlyer respondsToSelector:setSkipNextUniversalLinkAttribution]) {
        ((void ( *) (id, SEL, BOOL))[AppsFlyer methodForSelector:setSkipNextUniversalLinkAttribution])(AppsFlyer, setSkipNextUniversalLinkAttribution, NO);
    }
    // end

    if(_url && _sourceApplication){
        [[AppsFlyerLib shared] handleOpenURL:_url sourceApplication:_sourceApplication withAnnotation:nil];
        _url = nil;
        _sourceApplication = nil;
    }else if(_url){
        [[AppsFlyerLib shared] handleOpenUrl:_url options:nil];
        _url = nil;
    }else if(_userActivity){
        [[AppsFlyerLib shared] continueUserActivity:_userActivity restorationHandler:nil];
        _userActivity = nil;
    }
}
@end
