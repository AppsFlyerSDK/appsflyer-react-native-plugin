#import <React/RCTEventEmitter.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

// TurboModule adapter — implements NativeAppsFlyerSpec; all RPC dispatch lives in RNAppsFlyerImpl.swift.
@interface RNAppsFlyer : RCTEventEmitter <RCTTurboModule>

@end

NS_ASSUME_NONNULL_END

static NSString *const kAppsFlyerPluginVersion = @"7.0.1";
