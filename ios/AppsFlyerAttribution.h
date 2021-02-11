//
//  AppsFlyerAttribution.h
//  Pods
//
//  Created by Amit Kremer on 11/02/2021.
//
#ifndef AppsFlyerAttribution_h
#define AppsFlyerAttribution_h
#endif /* AppsFlyerAttribution_h */
#import "AppsFlyerLib.h"

@interface AppsFlyerAttribution : NSObject
@property NSUserActivity*_Nullable  userActivity;
@property NSArray* restorationHandler;
@property NSURL * url;
@property NSDictionary * options;
@property NSString* sourceApplication;
@property id annotation;

+ (AppsFlyerAttribution *)shared;
- (void) continueUserActivity: (NSUserActivity*_Nullable) userActivity restorationHandler: (void (^_Nullable)(NSArray * _Nullable))restorationHandler;
- (void) handleOpenUrl:(NSURL*_Nullable)url options:(NSDictionary*_Nullable) options;
- (void) handleOpenUrl: (NSURL *)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation;

@end

static NSString *const AF_BRIDGE_SET                  = @"bridge is set";
