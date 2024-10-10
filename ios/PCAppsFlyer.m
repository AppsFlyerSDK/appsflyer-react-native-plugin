#import "PCAppsFlyer.h"
#import "RNAppsFlyer.h"
#import <PurchaseConnector/PurchaseConnector.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@implementation PCAppsFlyer
@synthesize bridge = _bridge;

static NSString *const TAG = @"[AppsFlyer_PurchaseConnector] ";
static NSString *const logSubscriptionsKey = @"logSubscriptions";
static NSString *const logInAppsKey = @"logInApps";
static NSString *const sandboxKey = @"sandbox";
static NSString *const connectorAlreadyConfiguredMessage = @"Connector already configured";
static NSString *const connectorNotConfiguredMessage = @"Connector not configured, did you call `create` first?";

PurchaseConnector *connector;

// This RCT_EXPORT_MODULE macro exports the module to React Native.
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(create:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"%@Attempting to configure PurchaseConnector.", TAG);

    // Perform a check to ensure that we do not reconfigure an existing connector.
    if (connector != nil) {
        reject(connectorAlreadyConfiguredMessage, connectorAlreadyConfiguredMessage, nil);
        return;
    }

    // Obtain a shared instance of PurchaseConnector
    connector = [PurchaseConnector shared];
    [connector setPurchaseRevenueDelegate: self];
    [connector setPurchaseRevenueDataSource: self];

    BOOL logSubscriptions = [config[logSubscriptionsKey] boolValue];
    BOOL logInApps = [config[logInAppsKey] boolValue];
    BOOL sandbox = [config[sandboxKey] boolValue];
  
    [connector setIsSandbox:sandbox];

    if (logSubscriptions) {
        [connector setAutoLogPurchaseRevenue:AFSDKAutoLogPurchaseRevenueOptionsAutoRenewableSubscriptions];
    }
    if (logInApps) {
        [connector setAutoLogPurchaseRevenue:AFSDKAutoLogPurchaseRevenueOptionsInAppPurchases];
    }

    NSLog(@"%@Purchase Connector is configured successfully.", TAG);
    resolve(nil);
}

RCT_EXPORT_METHOD(startObservingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"%@Starting to observe transactions.", TAG);
    if (connector == nil) {
        reject(connectorNotConfiguredMessage, connectorNotConfiguredMessage, nil);
    } else {
        [connector startObservingTransactions];
        NSLog(@"%@Started observing transactions.", TAG);
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(stopObservingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"%@Stopping the observation of transactions.", TAG);
    if (connector == nil) {
        reject(connectorNotConfiguredMessage, connectorNotConfiguredMessage, nil);
    } else {
        [connector stopObservingTransactions];
        NSLog(@"%@Stopped observing transactions.", TAG);
        resolve(nil);
    }
}

- (void)didReceivePurchaseRevenueValidationInfo:(nullable NSDictionary *)validationInfo error:(nullable NSError *)error {
    // Send the validation info and error back to React Native.
    // Call this function from the main thread.
    [self sendEventWithName:@"onDidReceivePurchaseRevenueValidationInfo" body:@{@"validationInfo": validationInfo ?: [NSNull null], @"error": [self errorAsDictionary:error] ?: [NSNull null]}];
}

- (NSDictionary *)errorAsDictionary:(NSError *)error {
    if (!error) return nil;
    return @{
        @"localizedDescription": [error localizedDescription],
        @"domain": [error domain],
        @"code": @([error code])
    };
}

// Required by RCTEventEmitter:
- (NSArray<NSString *> *)supportedEvents {
    return @[@"onDidReceivePurchaseRevenueValidationInfo"];
}

@end
