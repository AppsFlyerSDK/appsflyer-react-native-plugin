const pkg = require('react-native-appsflyer/package.json');
const { withDangerousMod } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

module.exports = function withAppsFlyerIos(config, shouldUseStrictMode) {
	return withDangerousMod(config, [
		'ios',
		async (config) => {
			const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
			const contents = fs.readFileSync(filePath, 'utf-8');

			const configureStrictMode = mergeContents({
				tag: 'AppsFlyer Strict Mode',
				src: contents,
				newSrc: `$RNAppsFlyerStrictMode=${shouldUseStrictMode}`,
				anchor: 'use_expo_modules!',
				offset: 0,
				comment: '#',
			});

			if (!configureStrictMode.didMerge) {
				console.log("ERROR: Cannot add AppsFlyer strict mode to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.");
				return config;
			}

			fs.writeFileSync(filePath, configureStrictMode.contents);

			return config;
		},
	]);
};
