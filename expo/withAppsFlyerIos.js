const { withAppDelegate, withDangerousMod, WarningAggregator } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

function modifyObjcAppDelegate(appDelegate) {
  const RNAPPSFLYER_IMPORT = `#import <react_native_appsflyer/react_native_appsflyer-Swift.h>\n`;
  const RNAPPSFLYER_DID_FINISH_LAUNCHING_IDENTIFIER = `- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions`;
  const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER = `- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {`;
  const RNAPPSFLYER_OPENURL_IDENTIFIER = `- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {`;
  const RNAPPSFLYER_DID_FINISH_LAUNCHING_CODE = `[[AppsFlyerAttribution shared] handleLaunchOptions:launchOptions];\n`;
  const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_CODE = `[[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];\n`;
  const RNAPPSFLYER_OPENURL_CODE = `[[AppsFlyerAttribution shared] handleOpen:url options:options];\n`;

  if (!appDelegate.includes(RNAPPSFLYER_IMPORT)) {
    appDelegate = RNAPPSFLYER_IMPORT + appDelegate;
  }
  if (appDelegate.includes(RNAPPSFLYER_DID_FINISH_LAUNCHING_IDENTIFIER) && !appDelegate.includes(RNAPPSFLYER_DID_FINISH_LAUNCHING_CODE)) {
    const openBraceIndex = appDelegate.indexOf('{', appDelegate.indexOf(RNAPPSFLYER_DID_FINISH_LAUNCHING_IDENTIFIER));
    appDelegate = appDelegate.slice(0, openBraceIndex + 1) + `\n${RNAPPSFLYER_DID_FINISH_LAUNCHING_CODE}` + appDelegate.slice(openBraceIndex + 1);
  } else {
    WarningAggregator.addWarningIOS('withAppsFlyerAppDelegate', "Failed to detect didFinishLaunchingWithOptions in AppDelegate or AppsFlyer's delegate method already exists");
  }
  if (appDelegate.includes(RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER) && !appDelegate.includes(RNAPPSFLYER_CONTINUE_USER_ACTIVITY_CODE)) {
    const block = RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER + '\n' + RNAPPSFLYER_CONTINUE_USER_ACTIVITY_CODE;
    appDelegate = appDelegate.replace(RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER, block);
  } else {
    WarningAggregator.addWarningIOS('withAppsFlyerAppDelegate', "Failed to detect continueUserActivity in AppDelegate or AppsFlyer's delegate method already exists");
  }
  if (appDelegate.includes(RNAPPSFLYER_OPENURL_IDENTIFIER) && !appDelegate.includes(RNAPPSFLYER_OPENURL_CODE)) {
    const block = RNAPPSFLYER_OPENURL_IDENTIFIER + '\n' + RNAPPSFLYER_OPENURL_CODE;
    appDelegate = appDelegate.replace(RNAPPSFLYER_OPENURL_IDENTIFIER, block);
  } else {
    WarningAggregator.addWarningIOS('withAppsFlyerAppDelegate', "Failed to detect openURL in AppDelegate or AppsFlyer's delegate method already exists");
  }
  return appDelegate;
}

function modifySwiftAppDelegate(appDelegateContents) {
  const SWIFT_BRIDGE_IMPORT = 'import react_native_appsflyer';

  const SWIFT_DID_FINISH_LAUNCHING_IDENTIFIER = `  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {`;
  const RNAPPSFLYER_SWIFT_DID_FINISH_LAUNCHING_CODE = 'AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)';

  const SWIFT_OPENURL_IDENTIFIER = `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {`;
  const RNAPPSFLYER_SWIFT_OPENURL_CODE = 'AppsFlyerAttribution.shared.handleOpen(url, options: options)';

  const SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER = `  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {`;
  // AppsFlyer's restorationHandler is `([Any]?) -> Void`, not `([UIUserActivityRestoring]?) -> Void` —
  // passing ours directly is a type mismatch Swift reports as "ambiguous". AppsFlyer only needs
  // userActivity to extract the OneLink URL, so pass nil; the real restorationHandler goes to RCTLinkingManager below.
  const RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE = 'AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: nil)';

  if (!appDelegateContents.includes(SWIFT_BRIDGE_IMPORT)) {
    appDelegateContents = `${SWIFT_BRIDGE_IMPORT}\n${appDelegateContents}`;
  }

  if (appDelegateContents.includes(SWIFT_DID_FINISH_LAUNCHING_IDENTIFIER) && !appDelegateContents.includes(RNAPPSFLYER_SWIFT_DID_FINISH_LAUNCHING_CODE)) {
    appDelegateContents = appDelegateContents.replace(SWIFT_DID_FINISH_LAUNCHING_IDENTIFIER, `${SWIFT_DID_FINISH_LAUNCHING_IDENTIFIER}\n    ${RNAPPSFLYER_SWIFT_DID_FINISH_LAUNCHING_CODE}`);
  }

  if (appDelegateContents.includes(SWIFT_OPENURL_IDENTIFIER) && !appDelegateContents.includes(RNAPPSFLYER_SWIFT_OPENURL_CODE)) {
    appDelegateContents = appDelegateContents.replace(SWIFT_OPENURL_IDENTIFIER, `${SWIFT_OPENURL_IDENTIFIER}\n    ${RNAPPSFLYER_SWIFT_OPENURL_CODE}`);
  }

  if (appDelegateContents.includes(SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER) && !appDelegateContents.includes(RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE)) {
    appDelegateContents = appDelegateContents.replace(SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER, `${SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER}\n    ${RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE}`);
  }

  if (
    !appDelegateContents.includes(RNAPPSFLYER_SWIFT_DID_FINISH_LAUNCHING_CODE) ||
    !appDelegateContents.includes(RNAPPSFLYER_SWIFT_OPENURL_CODE) ||
    !appDelegateContents.includes(RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE)
  ) {
    WarningAggregator.addWarningIOS(
      'withAppsFlyerAppDelegate',
`
Automatic Swift AppDelegate modification failed.
Please add AppsFlyer integration manually:

1. Add this import:
  import react_native_appsflyer

2. Add this to your didFinishLaunchingWithOptions method:
  AppsFlyerAttribution.shared.handleLaunchOptions(launchOptions)

3. Add this to your openURL method:
  AppsFlyerAttribution.shared.handleOpen(url, options: options)

4. Add this to your continueUserActivity method:
  AppsFlyerAttribution.shared.continueUserActivity(userActivity, restorationHandler: nil)

Supported format: Expo SDK default template
`
    );
  }

  return appDelegateContents;
}

function withAppsFlyerAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    const language = config.modResults.language;

    if (['objc', 'objcpp'].includes(language)) {
      config.modResults.contents = modifyObjcAppDelegate(config.modResults.contents);
    } else if (language === 'swift') {
      config.modResults.contents = modifySwiftAppDelegate(config.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS('withAppsFlyerAppDelegate', `${language} AppDelegate file is not supported yet`);
    }
    return config;
  });
}

function withPodfile(config, shouldUseStrictMode, shouldUsePurchaseConnector) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(filePath, 'utf-8');

      let mergedContents = { contents, didMerge: true };

      // Check if Strict Mode flag already exists
      if (!contents.includes('$RNAppsFlyerStrictMode')) {
        mergedContents = mergeContents({
          tag: 'AppsFlyer Strict Mode',
          src: mergedContents.contents,
          newSrc: `$RNAppsFlyerStrictMode=${shouldUseStrictMode}`,
          anchor: 'use_expo_modules!',
          offset: 0,
          comment: '#',
        });

        if (!mergedContents.didMerge) {
          console.log("ERROR: Cannot add AppsFlyer strict mode to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.");
          return config;
        }
      } else {
        console.log("INFO: $RNAppsFlyerStrictMode already exists in Podfile, skipping auto-assignment.");
      }

      // Check if Purchase Connector flag already exists
      if (!contents.includes('$AppsFlyerPurchaseConnector')) {
        mergedContents = mergeContents({
          tag: 'AppsFlyer Purchase Connector',
          src: mergedContents.contents,
          newSrc: `$AppsFlyerPurchaseConnector=${shouldUsePurchaseConnector}`,
          anchor: 'use_expo_modules!',
          offset: mergedContents.contents.includes('$RNAppsFlyerStrictMode') ? 1 : 0,
          comment: '#',
        });

        if (!mergedContents.didMerge) {
          console.log("ERROR: Cannot add AppsFlyer Purchase Connector to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.");
          return config;
        }
      } else {
        console.log("INFO: $AppsFlyerPurchaseConnector already exists in Podfile, skipping auto-assignment.");
      }

      fs.writeFileSync(filePath, mergedContents.contents);

      return config;
    },
  ]);
}

module.exports = function withAppsFlyerIos(config, { 
  shouldUseStrictMode = false, 
  shouldUsePurchaseConnector = false 
} = {}) {
  config = withPodfile(config, shouldUseStrictMode, shouldUsePurchaseConnector);
  config = withAppsFlyerAppDelegate(config);
  return config;
};