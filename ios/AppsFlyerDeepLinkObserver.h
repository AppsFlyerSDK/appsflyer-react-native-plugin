//
//  AFSDKDeepLinkObserver.h
//  AppsFlyerLib
//
//  Created by Andrii Hahan on 09.09.2020.
//

#import <Foundation/Foundation.h>

@class AppsFlyerDeepLinkResult;

NS_SWIFT_NAME(DeepLinkObserverDelegate)
@protocol AppsFlyerDeepLinkObserverDelegate <NSObject>

@optional
- (void)didResolveDeepLink:(AppsFlyerDeepLinkResult *_Nonnull)result;

@end

NS_ASSUME_NONNULL_BEGIN
NS_SWIFT_NAME(DeepLinkObserver)
@interface AppsFlyerDeepLinkObserver : NSObject

@property(weak, nonatomic) id<AppsFlyerDeepLinkObserverDelegate> delegate;
@property NSTimeInterval timeoutInterval;

@end

NS_ASSUME_NONNULL_END
