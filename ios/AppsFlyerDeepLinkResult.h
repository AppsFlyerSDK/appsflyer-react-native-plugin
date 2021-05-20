//
//  AFSDKDeeplinkResult.h
//  AppsFlyerLib
//
//  Created by Andrii Hahan on 20.08.2020.
//

#import <Foundation/Foundation.h>

@class AppsFlyerDeepLink;

typedef NS_CLOSED_ENUM(NSUInteger, AFSDKDeepLinkResultStatus) {
    AFSDKDeepLinkResultStatusNotFound,
    AFSDKDeepLinkResultStatusFound,
    AFSDKDeepLinkResultStatusFailure,
} NS_SWIFT_NAME(DeepLinkResultStatus);

NS_SWIFT_NAME(DeepLinkResult)
@interface AppsFlyerDeepLinkResult : NSObject

- (nonnull instancetype)init NS_UNAVAILABLE;
+ (nonnull instancetype)new NS_UNAVAILABLE;

@property(readonly) AFSDKDeepLinkResultStatus status;

@property(readonly, nullable) AppsFlyerDeepLink *deepLink;
@property(readonly, nullable) NSError *error;

@end
