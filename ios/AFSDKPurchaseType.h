//
//  AFSDKPurchaseType.h
//  AppsFlyerLib
//
//  Created by Amit Levy on 13/05/2025.
//

#import <Foundation/Foundation.h>

typedef NS_CLOSED_ENUM(NSUInteger, AFSDKPurchaseType) {
    AFSDKPurchaseTypeSubscription,
    AFSDKPurchaseTypeOneTimePurchase
} NS_SWIFT_NAME(AFSDKPurchaseType);

// Helper to get string route name
FOUNDATION_EXPORT NSString *StringFromAFSDKPurchaseType(AFSDKPurchaseType type);
