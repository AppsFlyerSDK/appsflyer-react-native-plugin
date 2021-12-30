//
//  AppsFlyerAttribution.m
//  react-native-appsflyer
//
//  Created by Amit Kremer on 11/02/2021.
//

#import <Foundation/Foundation.h>
#import "AppsFlyerAttribution.h"

@interface AppsFlyerAttribution ()
@property NSUserActivity * userActivity;
@property NSURL * url;
@property NSString * sourceApplication;
@property NSDictionary * options;

@end

@implementation AppsFlyerAttribution

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
        _userActivity = nil;
        _sourceApplication = nil;
        _options = nil;
        _RNAFBridgeReady = NO;

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(receiveBridgeReadyNotification:)
                                                     name:RNAFBridgeInitializedNotification
                                                   object:nil];
    }
    return self;
}

#pragma mark - AppDelegate methods

- (void)continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^_Nullable)(NSArray * _Nullable))restorationHandler{
    if([self RNAFBridgeReady] == YES){
        [[AppsFlyerLib shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
    }else{
        [self setUserActivity:userActivity];
    }
}

- (void)handleOpenUrl:(NSURL *)url options:(NSDictionary *)options{
    if([self RNAFBridgeReady] == YES){
        [[AppsFlyerLib shared] handleOpenUrl:url options:options];
    }else{
        [self setUrl:url];
        [self setOptions:options];
    }
}

- (void)handleOpenUrl:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation{
    if([self RNAFBridgeReady] == YES){
        [[AppsFlyerLib shared] handleOpenURL:url sourceApplication:sourceApplication withAnnotation:annotation];
    }else{
        [self setUrl:url];
        [self setSourceApplication:sourceApplication];
    }
}

#pragma mark - Bridge initialized notification

- (void)receiveBridgeReadyNotification:(NSNotification *)notification {
    // RD-69546
    // start - We added this code because sometimes the SDK automatically resolves deeplinks on `applicationDidFinishLaunching`, and then when calling `continueUserActivity` on the same deeplink
    // it skips them.
    id AppsFlyer = [AppsFlyerLib shared];
    SEL setSkipNextUniversalLinkAttribution = NSSelectorFromString(@"setSkipNextUniversalLinkAttribution:");
    if ([AppsFlyer respondsToSelector:setSkipNextUniversalLinkAttribution]) {
        ((void ( *) (id, SEL, BOOL))[AppsFlyer methodForSelector:setSkipNextUniversalLinkAttribution])(AppsFlyer, setSkipNextUniversalLinkAttribution, NO);
    }
    // end

    if([self url] && [self sourceApplication]){
        [[AppsFlyerLib shared] handleOpenURL:[self url] sourceApplication:[self sourceApplication] withAnnotation:nil];
        [self setUrl:nil];
        [self setSourceApplication:nil];
    }else if([self url] && [self options]){
        [[AppsFlyerLib shared] handleOpenUrl:[self url] options:[self options]];
        [self setUrl:nil];
        [self setOptions:nil];
    }else if([self userActivity]){
        [[AppsFlyerLib shared] continueUserActivity:[self userActivity] restorationHandler:nil];
        [self setUserActivity:nil];
    }
}
@end
