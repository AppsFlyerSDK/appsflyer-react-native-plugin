const withAppsFlyerIos = require('./withAppsFlyerIos');
const withAppsFlyerAndroid = require('./withAppsFlyerAndroid');

module.exports = function withAppsFlyer(config, { shouldUseStrictMode = false }) {
	config = withAppsFlyerIos(config, shouldUseStrictMode);
	config = withAppsFlyerAndroid(config)
	return config;
};
