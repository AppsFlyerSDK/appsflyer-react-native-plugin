#import "PCAppsFlyer.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const TAG = @"[AppsFlyer_PurchaseConnector] ";

#if __has_include(<PurchaseConnector/PurchaseConnector.h>)
#import <PurchaseConnector/PurchaseConnector.h>
#import <react_native_appsflyer-Swift.h>

@implementation PCAppsFlyer
@synthesize bridge = _bridge;

static NSString *const logSubscriptionsKey = @"logSubscriptions";
static NSString *const logInAppsKey = @"logInApps";
static NSString *const sandboxKey = @"sandbox";
static NSString *const storeKitKey = @"storeKitVersion";
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
    NSString *storeKitVersion = config[storeKitKey]; 

    [connector setIsSandbox:sandbox];

    // Set the StoreKitVersion (default to SK1 if not provided or invalid)
    if ([storeKitVersion isEqualToString:@"SK2"]) {
        [connector setStoreKitVersion:AFSDKStoreKitVersionSK2];
        NSLog(@"%@Configure PurchaseConnector with StoreKit2 Version", TAG);
    } else {
        [connector setStoreKitVersion:AFSDKStoreKitVersionSK1];
        NSLog(@"%@Configure PurchaseConnector with StoreKit1 Version", TAG);
    }
    
    if (logSubscriptions && logInApps) {
    [connector setAutoLogPurchaseRevenue:AFSDKAutoLogPurchaseRevenueOptionsAutoRenewableSubscriptions | AFSDKAutoLogPurchaseRevenueOptionsInAppPurchases];
    }
    else if (logSubscriptions) {
        [connector setAutoLogPurchaseRevenue:AFSDKAutoLogPurchaseRevenueOptionsAutoRenewableSubscriptions];
    }
    else if (logInApps) {
        [connector setAutoLogPurchaseRevenue:AFSDKAutoLogPurchaseRevenueOptionsInAppPurchases];
    }

    NSLog(@"%@Purchase Connector is configured successfully.", TAG);
    resolve(nil);
}

RCT_EXPORT_METHOD(logConsumableTransaction:(NSString *)transactionId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"Logging consumable transaction with ID: %@", transactionId);
    
    if (connector == nil) {
        reject(connectorNotConfiguredMessage, connectorNotConfiguredMessage, nil);
        return;
    }

    if (@available(iOS 15.0, *)) {
        AFTransactionFetcher *fetcher = [AFTransactionFetcher new];
        [fetcher fetchTransactionWithTransactionId:transactionId completion:^(AFSDKTransactionSK2 * _Nullable afTransaction) {
            if (afTransaction) {
                [connector logConsumableTransaction:afTransaction];
                NSLog(@"Logged transaction: %@", transactionId);
                resolve(nil);
            } else {
                NSError *error = [NSError errorWithDomain:@"PCAppsFlyer"
                                                     code:404
                                                 userInfo:@{NSLocalizedDescriptionKey: @"Transaction not found"}];
                reject(@"transaction_not_found", @"Transaction not found", error);
            }
        }];
    } else {
        NSError *error = [NSError errorWithDomain:@"PCAppsFlyer"
                                             code:501
                                         userInfo:@{NSLocalizedDescriptionKey: @"iOS version not supported"}];
        reject(@"ios_version_not_supported", @"iOS version not supported", error);
    }
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

// Method to set parameters from React Native
RCT_EXPORT_METHOD(setPurchaseRevenueDataSource:(NSDictionary *)dataSource)
{
    if (!dataSource) {
        NSLog(@"%@dataSource is required", TAG);
        return;
    }
    self.purchaseRevenueParams = dataSource;
}

RCT_EXPORT_METHOD(setPurchaseRevenueDataSourceStoreKit2:(NSDictionary *)dataSource)
{
    if (!dataSource) {
        NSLog(@"%@dataSource is required", TAG);
        return;
    }
    self.purchaseRevenueStoreKit2Params = dataSource;
}

// Delegate method for StoreKit1
- (NSDictionary *)purchaseRevenueAdditionalParametersForProducts:(NSSet<SKProduct *> *)products 
                                                   transactions:(NSSet<SKPaymentTransaction *> *)transactions {
    // Simply return the parameters that were set from React Native
    return self.purchaseRevenueParams;
}

// Delegate method for StoreKit2
- (NSDictionary<NSString *, id> *)purchaseRevenueAdditionalParametersStoreKit2ForProducts:(NSSet<AFSDKProductSK2 *> *)products 
                                                           transactions:(NSSet<AFSDKTransactionSK2 *> *)transactions {
    // Simply return the parameters that were set from React Native
    return self.purchaseRevenueStoreKit2Params;
}

- (void)didReceivePurchaseRevenueValidationInfo:(nullable NSDictionary *)validationInfo error:(nullable NSError *)error {
    // Send the validation info and error back to React Native.
    // Call this function from the main thread.
    if (error){
        [self sendEventWithName:@"onDidReceivePurchaseRevenueValidationInfo" body:@{@"validationInfo": validationInfo ?: [NSNull null], @"error": [self errorAsDictionary:error] ?: [NSNull null]}];
    }else {
        [self sendEventWithName:@"onDidReceivePurchaseRevenueValidationInfo" body:@{@"validationInfo": validationInfo ?: [NSNull null]}];
    }
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

#else
// IMPORTANT: This stub implementation is necessary to prevent compilation errors and runtime crashes.
// It ensures that the plugin functions properly even if the Purchase Connector is not actively utilized on the React Native side.
@implementation PCAppsFlyer
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (void)notifyConnectorDisabled:(RCTPromiseResolveBlock)resolve {
    NSString *infoMessage = @"PurchaseConnector functionality is not available. This operation is a no-op.";
    NSLog(@"%@%@", TAG, infoMessage);
    resolve(nil);
}

// Fallback for methods
RCT_EXPORT_METHOD(create:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self notifyConnectorDisabled:resolve];
}

RCT_EXPORT_METHOD(startObservingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self notifyConnectorDisabled:resolve];
}

RCT_EXPORT_METHOD(stopObservingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self notifyConnectorDisabled:resolve];
}

// Required by RCTEventEmitter:
- (NSArray<NSString *> *)supportedEvents {
    return @[@"onDidReceivePurchaseRevenueValidationInfo"];
}
@end

#endif
