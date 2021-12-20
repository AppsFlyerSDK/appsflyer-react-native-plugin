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
- (void) continueUserActivity: (NSUserActivity*_Nullable) userActivity restorationHandler: (void (^_Nullable)(NSArray * _Nullable))restorationHandler;
- (void) handleOpenUrl:(NSURL*_Nullable)url options:(NSDictionary*_Nullable) options;

@end

static NSString * _Nonnull const RNAFBridgeInitializedNotification = @"bridgeInitialized";
