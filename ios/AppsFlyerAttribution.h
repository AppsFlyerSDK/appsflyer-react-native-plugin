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
@property BOOL RNAFBridgeReady;

+ (instancetype _Nonnull )shared;
- (void) continueUserActivity:(NSUserActivity *_Nonnull)userActivity restorationHandler:(void (^_Nullable)(NSArray *_Nullable))restorationHandler;
- (void) handleOpenUrl:(NSURL *_Nonnull)url options:(NSDictionary *_Nullable)options;
- (void) handleOpenUrl:(NSURL *_Nonnull)url sourceApplication:(NSString *_Nullable)sourceApplication annotation:(id _Nullable)annotation;

@end

static NSString * _Nonnull const RNAFBridgeInitializedNotification = @"bridgeInitialized";
