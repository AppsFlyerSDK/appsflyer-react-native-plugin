//
//  AppsFlyerAttribution.m
//  react-native-appsflyer
//
//  Created by Amit Kremer on 11/02/2021.
//

#import <Foundation/Foundation.h>
#import "AppsFlyerAttribution.h"

@implementation AppsFlyerAttribution

+ (id)shared {
    static AppsFlyerAttribution *shared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shared = [[self alloc] init];
    });
    return shared;
}

- (id)init {
    if (self = [super init]) {
        self.options = nil;
        self.restorationHandler = nil;
        self.url = nil;
        self.userActivity = nil;
        self.annotation = nil;
        self.sourceApplication = nil;
        self.isBridgeReady = NO;
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(receiveBridgeReadyNotification:)
                                                     name:AF_BRIDGE_SET
                                                   object:nil];
  }
  return self;
}

- (void) continueUserActivity: (NSUserActivity*_Nullable) userActivity restorationHandler: (void (^_Nullable)(NSArray * _Nullable))restorationHandler{
    if(self.isBridgeReady == YES){
        [[AppsFlyerLib shared] continueUserActivity:userActivity restorationHandler:restorationHandler];
    }else{
        [AppsFlyerAttribution shared].userActivity = userActivity;
        [AppsFlyerAttribution shared].restorationHandler = restorationHandler;
    }
}

- (void) handleOpenUrl:(NSURL *)url options:(NSDictionary *)options{
    if(self.isBridgeReady == YES){
        [[AppsFlyerLib shared] handleOpenUrl:url options:options];
    }else{
        [AppsFlyerAttribution shared].url = url;
        [AppsFlyerAttribution shared].options = options;
    }
}

- (void) handleOpenUrl:(NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation{
    if(self.isBridgeReady == YES){
        [[AppsFlyerLib shared] handleOpenURL:url sourceApplication:sourceApplication withAnnotation:annotation];
    }else{
        [AppsFlyerAttribution shared].url = url;
        [AppsFlyerAttribution shared].sourceApplication = sourceApplication;
        [AppsFlyerAttribution shared].annotation = annotation;
    }

}

- (void) receiveBridgeReadyNotification:(NSNotification *) notification
{
    NSLog (@"AppsFlyer Debug: handle deep link");
    if(self.url && self.sourceApplication && self.annotation){
        [[AppsFlyerLib shared] handleOpenURL:self.url sourceApplication:self.sourceApplication withAnnotation:self.annotation];
        self.url = nil;
        self.sourceApplication = nil;
        self.annotation = nil;
    }else if(self.options && self.url){
        [[AppsFlyerLib shared] handleOpenUrl:self.url options:self.options];
        self.options = nil;
        self.url = nil;
    }else if(self.userActivity && self.restorationHandler){
        [[AppsFlyerLib shared] continueUserActivity:self.userActivity restorationHandler:self.restorationHandler];
        self.userActivity = nil;
        self.restorationHandler = nil;
    }
}
@end
