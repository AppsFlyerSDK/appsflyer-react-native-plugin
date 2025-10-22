//
//  AFSDKPurchaseDetails.h
//  AppsFlyerLib
//
//  Created by Moris Gateno on 13/03/2024.
//

#import <AppsFlyerLib/AFSDKPurchaseType.h>

@interface AFSDKPurchaseDetails : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@property (nonatomic, copy, readonly) NSString *productId;
@property (nonatomic, copy, readonly) NSString *transactionId;
@property (nonatomic, assign, readonly) AFSDKPurchaseType purchaseType;

// Designated initializer for VAL2-compliant purchase object
- (instancetype)initWithProductId:(NSString *)productId
                   transactionId:(NSString *)transactionId
                    purchaseType:(AFSDKPurchaseType)purchaseType NS_DESIGNATED_INITIALIZER;

@end
