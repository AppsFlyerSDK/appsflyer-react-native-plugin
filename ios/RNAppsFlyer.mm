#import "RNAppsFlyer.h"

#if __has_include("react_native_appsflyer-Swift.h")
#import "react_native_appsflyer-Swift.h"
#else
#import <react_native_appsflyer/react_native_appsflyer-Swift.h>
#endif

#import <RNAppsFlyerSpec/RNAppsFlyerSpec.h>

static NSString *const kRNAppsFlyerRpcEventName = @"RNAppsFlyer_rpcEvent";

@implementation RNAppsFlyer {
    RNAppsFlyerImpl *_impl;
}

RCT_EXPORT_MODULE(RNAppsFlyer)

- (instancetype)init {
    if (self = [super init]) {
        __weak __typeof(self) weakSelf = self;
        _impl = [[RNAppsFlyerImpl alloc] initWithEventEmitter:^(NSString *jsonEvent) {
            [weakSelf sendEventWithName:kRNAppsFlyerRpcEventName body:jsonEvent];
        }];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[kRNAppsFlyerRpcEventName];
}

- (void)executeRpc:(NSString *)requestJson
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    [_impl executeRpc:requestJson resolve:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeAppsFlyerSpecJSI>(params);
}

@end
