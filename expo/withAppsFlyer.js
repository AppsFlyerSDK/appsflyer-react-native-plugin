const withAppsFlyerIos = require('react-native-appsflyer/expo/withAppsFlyerIos.js');
module.exports = function withAppsFlyer(config, { shouldUseStrictMode = false }) {
	config = withAppsFlyerIos(config, shouldUseStrictMode);
	return config;
};
