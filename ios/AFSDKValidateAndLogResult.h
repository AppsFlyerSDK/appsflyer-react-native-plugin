//
//  AFSDKValidateAndLogResult.h
//  AppsFlyerLib
//
//  Created by Moris Gateno on 13/03/2024.
//


typedef NS_CLOSED_ENUM(NSUInteger, AFSDKValidateAndLogStatus) {
    AFSDKValidateAndLogStatusSuccess,
    AFSDKValidateAndLogStatusFailure,
        AFSDKValidateAndLogStatusError
} NS_SWIFT_NAME(ValidateAndLogStatus);

NS_SWIFT_NAME(ValidateAndLogResult)
@interface AFSDKValidateAndLogResult : NSObject

- (nonnull instancetype)init NS_UNAVAILABLE;
+ (nonnull instancetype)new NS_UNAVAILABLE;

- (instancetype _Nonnull )initWithStatus:(AFSDKValidateAndLogStatus)status
                        result:(NSDictionary *_Nullable)result
                     errorData:(NSDictionary *_Nullable)errorData
                         error:(NSError *_Nullable)error;

@property(readonly) AFSDKValidateAndLogStatus status;
// Success case
@property(readonly, nullable) NSDictionary *result;
// Server 200 with validation failure
@property(readonly, nullable) NSDictionary *errorData;
// for the error case
@property(readonly, nullable) NSError *error;

@end

