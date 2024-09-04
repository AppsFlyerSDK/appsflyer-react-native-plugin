//
//  AFAdRevenueData.h
//  AppsFlyerLib
//
//  Created by Veronica Belyakov on 26/06/2024.
//

typedef NS_CLOSED_ENUM(NSUInteger, AppsFlyerAdRevenueMediationNetworkType) {
    AppsFlyerAdRevenueMediationNetworkTypeGoogleAdMob = 1,
    AppsFlyerAdRevenueMediationNetworkTypeIronSource = 2,
    AppsFlyerAdRevenueMediationNetworkTypeApplovinMax= 3,
    AppsFlyerAdRevenueMediationNetworkTypeFyber = 4,
    AppsFlyerAdRevenueMediationNetworkTypeAppodeal = 5,
    AppsFlyerAdRevenueMediationNetworkTypeAdmost = 6,
    AppsFlyerAdRevenueMediationNetworkTypeTopon = 7,
    AppsFlyerAdRevenueMediationNetworkTypeTradplus = 8,
    AppsFlyerAdRevenueMediationNetworkTypeYandex = 9,
    AppsFlyerAdRevenueMediationNetworkTypeChartBoost = 10,
    AppsFlyerAdRevenueMediationNetworkTypeUnity = 11,
    AppsFlyerAdRevenueMediationNetworkTypeToponPte = 12,
    AppsFlyerAdRevenueMediationNetworkTypeCustom = 13,
    AppsFlyerAdRevenueMediationNetworkTypeDirectMonetization = 14
} NS_SWIFT_NAME(MediationNetworkType);

#define kAppsFlyerAdRevenueMonetizationNetwork         @"monetization_network"
#define kAppsFlyerAdRevenueMediationNetwork            @"mediation_network"
#define kAppsFlyerAdRevenueEventRevenue                @"event_revenue"
#define kAppsFlyerAdRevenueEventRevenueCurrency        @"event_revenue_currency"
#define kAppsFlyerAdRevenueCustomParameters            @"custom_parameters"
#define kAFADRWrapperTypeGeneric                       @"adrevenue_sdk"

//Pre-defined keys for non-mandatory dictionary

//Code ISO 3166-1 format
#define kAppsFlyerAdRevenueCountry                     @"country"

//ID of the ad unit for the impression
#define kAppsFlyerAdRevenueAdUnit                      @"ad_unit"

//Format of the ad
#define kAppsFlyerAdRevenueAdType                      @"ad_type"

//ID of the ad placement for the impression
#define kAppsFlyerAdRevenuePlacement                   @"placement"


@interface AFAdRevenueData : NSObject

- (nonnull instancetype)init NS_UNAVAILABLE;
+ (nonnull instancetype)new NS_UNAVAILABLE;

@property (strong, nonnull, nonatomic) NSString *monetizationNetwork;
@property  AppsFlyerAdRevenueMediationNetworkType mediationNetwork;
@property (strong, nonnull, nonatomic) NSString *currencyIso4217Code;
@property (strong, nonnull, nonatomic) NSNumber *eventRevenue;

/**
* @param monetizationNetwork  network which monetized the impression (@"facebook")
* @param mediationNetwork     mediation source that mediated the monetization network for the impression (AppsFlyerAdRevenueMediationNetworkTypeGoogleAdMob)
* @param currencyIso4217Code reported impression’s revenue currency ISO 4217 format (@"USD")
* @param eventRevenue         reported impression’s revenue (@(0.001994303))
*/
- (instancetype _Nonnull )initWithMonetizationNetwork:(NSString *_Nonnull)monetizationNetwork
                                     mediationNetwork:(AppsFlyerAdRevenueMediationNetworkType)mediationNetwork
                                  currencyIso4217Code:(NSString *_Nonnull)currencyIso4217Code
                                         eventRevenue:(NSNumber *_Nonnull)eventRevenue;

@end
