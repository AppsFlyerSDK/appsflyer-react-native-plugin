#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

@interface AfQaNativeLogger : NSObject <RCTBridgeModule>
@end

@implementation AfQaNativeLogger

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(log:(NSString *)message) {
  NSLog(@"%@", message);
}

@end
