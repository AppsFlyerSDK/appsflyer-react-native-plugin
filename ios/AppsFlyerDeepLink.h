//
//  AFSDKDeeplink.h
//  AppsFlyerLib
//
//  Created by Andrii Hahan on 20.08.2020.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(DeepLink)
@interface AppsFlyerDeepLink : NSObject

- (nonnull instancetype)init NS_UNAVAILABLE;
+ (nonnull instancetype)new NS_UNAVAILABLE;

@property (readonly, nonnull) NSDictionary<NSString *, id> *clickEvent;
@property (readonly, nullable) NSString *deeplinkValue;
@property (readonly, nullable) NSString *matchType;
@property (readonly, nullable) NSString *clickHTTPReferrer;
@property (readonly, nullable) NSString *mediaSource;
@property (readonly, nullable) NSString *campaign;
@property (readonly, nullable) NSString *campaignId;
@property (readonly, nullable) NSString *afSub1;
@property (readonly, nullable) NSString *afSub2;
@property (readonly, nullable) NSString *afSub3;
@property (readonly, nullable) NSString *afSub4;
@property (readonly, nullable) NSString *afSub5;
@property (readonly) BOOL isDeferred;

- (NSString *)toString;

@end

NS_ASSUME_NONNULL_END
