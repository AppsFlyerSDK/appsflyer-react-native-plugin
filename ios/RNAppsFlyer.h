#import <React/RCTEventEmitter.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

// TurboModule adapter — implements NativeAppsFlyerSpec; all RPC dispatch lives in RNAppsFlyerImpl.swift.
@interface RNAppsFlyer : RCTEventEmitter <RCTTurboModule>

@end

NS_ASSUME_NONNULL_END

// TODO: dead code — no caller anywhere in ios/ (setPluginInfo's version comes from
// package.json via index.ts instead). Candidate for removal; see release-versioning.md §1.
static NSString *const kAppsFlyerPluginVersion = @"7.0.2";
