const { withDangerousMod, withAppDelegate, WarningAggregator } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

const RNAPPSFLYER_IMPORT = `#import <RNAppsFlyer.h>\n`;
const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_IDENTIFIER = `- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {`;
const RNAPPSFLYER_OPENURL_IDENTIFIER = `- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {`;
const RNAPPSFLYER_CONTINUE_USER_ACTIVITY_CODE = `[[AppsFlyerAttribution shared] continueUserActivity:userActivity restorationHandler:restorationHandler];\n`;
const RNAPPSFLYER_OPENURL_CODE = `[[AppsFlyerAttribution shared] handleOpenUrl:url options:options];\n`;

function modifyAppDelegate(appDelegate) {
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

function withAppsFlyerAppDelegate(config) {
	return withAppDelegate(config, (config) => {
		if (['objc', 'objcpp'].includes(config.modResults.language)) {
			config.modResults.contents = modifyAppDelegate(config.modResults.contents);
		} else {
			WarningAggregator.addWarningIOS('withAppsFlyerAppDelegate', `${config.modResults.language} AppDelegate file is not supported yet`);
		}
		return config;
	});
}

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
	config = withAppsFlyerAppDelegate(config);
	return config;
};
