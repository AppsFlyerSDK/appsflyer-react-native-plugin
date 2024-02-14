//
//  AppsFlyerConsent.h
//  AppsFlyerLib
//
//  Created by Veronica Belyakov on 14/01/2024.
//
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AppsFlyerConsent : NSObject <NSCoding>

@property (nonatomic, readonly, assign) BOOL isUserSubjectToGDPR;
@property (nonatomic, readonly, assign) BOOL hasConsentForDataUsage;
@property (nonatomic, readonly, assign) BOOL hasConsentForAdsPersonalization;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initForGDPRUserWithHasConsentForDataUsage:(BOOL)hasConsentForDataUsage
  hasConsentForAdsPersonalization:(BOOL)hasConsentForAdsPersonalization NS_DESIGNATED_INITIALIZER;
- (instancetype)initNonGDPRUser NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
