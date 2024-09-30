#if __has_include(<React/RCTBridgeModule.h>) // ver >= 0.40
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#else // ver < 0.40
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"
#endif

#import <objc/message.h>
#import <PurchaseConnector/PurchaseConnector.h>

@interface PCAppsFlyer: RCTEventEmitter <RCTBridgeModule, AppsFlyerPurchaseRevenueDelegate, AppsFlyerPurchaseRevenueDataSource>
// Define any properties and methods the PCAppsFlyer module will need
@end

// Define any static constants related to PCAppsFlyer.
