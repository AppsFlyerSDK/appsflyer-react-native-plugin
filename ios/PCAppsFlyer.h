#if __has_include(<React/RCTBridgeModule.h>) // ver >= 0.40
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#else // ver < 0.40
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"
#endif

#import <objc/message.h>
#if __has_include(<PurchaseConnector/PurchaseConnector.h>)
#import <PurchaseConnector/PurchaseConnector.h>

@interface PCAppsFlyer: RCTEventEmitter <RCTBridgeModule, AppsFlyerPurchaseRevenueDelegate, AppsFlyerPurchaseRevenueDataSource>
// This is the PCAppsFlyer if the AppsFlyerPurchaseConnector is set to true in the podfile
@end

#else

@interface PCAppsFlyer: RCTEventEmitter <RCTBridgeModule>
// This is the PCAppsFlyer if the AppsFlyerPurchaseConnector is set to false in the podfile
@end

#endif
