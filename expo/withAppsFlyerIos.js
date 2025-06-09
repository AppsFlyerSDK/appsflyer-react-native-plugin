const { withAppDelegate, withDangerousMod, withXcodeProject, WarningAggregator } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const { getAppDelegate } = require('@expo/config-plugins/build/ios/Paths');
const fs = require('fs');
const path = require('path');

function getBridgingHeaderPathFromXcode(project) {
  const buildConfigs = project.pbxXCBuildConfigurationSection();

  for (const key in buildConfigs) {
    const config = buildConfigs[key];
    if (
      typeof config === 'object' &&
      config.buildSettings &&
      config.buildSettings['SWIFT_OBJC_BRIDGING_HEADER']
    ) {
      const bridgingHeaderPath = config.buildSettings[
        'SWIFT_OBJC_BRIDGING_HEADER'
      ].replace(/"/g, '');

      return bridgingHeaderPath;
    }
  }

  return null;
}

function modifyObjcAppDelegate(appDelegate) {
  const RNAPPSFLYER_IMPORT = `#import <RNAppsFlyer.h>\n`;
  const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER = `- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {`;
  const RNAPPSFLYER_OPENURL_IDENTIFIER = `- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {`;
  const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_CODE = `[[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];\n`;
  const RNAPPSFLYER_OPENURL_CODE = `[[AppsFlyerAttribution shared] handleOpenUrl:url options:options];\n`;

  if (!appDelegate.includes(RNAPPSFLYER_IMPORT)) {
    appDelegate = RNAPPSFLYER_IMPORT + appDelegate;
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
  const SWIFT_OPENURL_IDENTIFIER = `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {`;
  const RNAPPSFLYER_SWIFT_OPENURL_CODE = 'AppsFlyerAttribution.shared().handleOpen(url, options: options)';

  const SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER = `  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {`;
  const RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE = 'AppsFlyerAttribution.shared().continue(userActivity, restorationHandler: nil)';

  if (appDelegateContents.includes(SWIFT_OPENURL_IDENTIFIER) && !appDelegateContents.includes(RNAPPSFLYER_SWIFT_OPENURL_CODE)) {
    appDelegateContents = appDelegateContents.replace(SWIFT_OPENURL_IDENTIFIER, `${SWIFT_OPENURL_IDENTIFIER}\n    ${RNAPPSFLYER_SWIFT_OPENURL_CODE}`);
  }

  if (appDelegateContents.includes(SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER) && !appDelegateContents.includes(RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE)) {
    appDelegateContents = appDelegateContents.replace(SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER, `${SWIFT_CONTINUE_USER_ACTIVITY_IDENTIFIER}\n    ${RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE}`);
  }

  if (!appDelegateContents.includes(RNAPPSFLYER_SWIFT_OPENURL_CODE) || !appDelegateContents.includes(RNAPPSFLYER_SWIFT_CONTINUE_USER_ACTIVITY_CODE)) {
    WarningAggregator.addWarningIOS(
      'withAppsFlyerAppDelegate',
`
Automatic Swift AppDelegate modification failed.
Please add AppsFlyer integration manually:

1. Add this to your openURL method:
  AppsFlyerAttribution.shared().handleOpen(url, options: options)

2. Add this to your continueUserActivity method:
  AppsFlyerAttribution.shared().continue(userActivity, restorationHandler: nil)

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

const withIosBridgingHeader = (config) => {
  return withXcodeProject(config, (action) => {
    const projectRoot = action.modRequest.projectRoot;
    const appDelegate = getAppDelegate(projectRoot);

    if (appDelegate.language === 'swift') {
      const bridgingHeaderPath = getBridgingHeaderPathFromXcode(
        action.modResults,
      );

      const bridgingHeaderFilePath = path.join(
        action.modRequest.platformProjectRoot,
        bridgingHeaderPath,
      );

      if (fs.existsSync(bridgingHeaderFilePath)) {
        let content = fs.readFileSync(bridgingHeaderFilePath, 'utf8');
        const appsFlyerImport = '#import <RNAppsFlyer.h>';

        if (!content.includes(appsFlyerImport)) {
          content += `${appsFlyerImport}\n`;
          fs.writeFileSync(bridgingHeaderFilePath, content);
        }

        return action;
      }

      WarningAggregator.addWarningIOS(
        'withIosBridgingHeader',
`
Failed to detect ${bridgingHeaderPath} file. Please add AppsFlyer integration manually:
#import <RNAppsFlyer.h>

Supported format: Expo SDK default template
`
      );

      return action; 
    }

    return action;
  });
};

function withPodfile(config, shouldUseStrictMode) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(filePath, 'utf-8');

      const mergedPodfileWithStrictMode = mergeContents({
        tag: 'AppsFlyer Strict Mode',
        src: contents,
        newSrc: `$RNAppsFlyerStrictMode=${shouldUseStrictMode}`,
        anchor: 'use_expo_modules!',
        offset: 0,
        comment: '#',
      });

      if (!mergedPodfileWithStrictMode.didMerge) {
        console.log("ERROR: Cannot add AppsFlyer strict mode to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.");
        return config;
      }

      fs.writeFileSync(filePath, mergedPodfileWithStrictMode.contents);

      return config;
    },
  ]);
}

module.exports = function withAppsFlyerIos(config, shouldUseStrictMode) {
  config = withPodfile(config, shouldUseStrictMode);
  config = withIosBridgingHeader(config);
  config = withAppsFlyerAppDelegate(config);
  return config;
};
