const withAppsFlyerIos = require('./withAppsFlyerIos');
module.exports = function withAppsFlyer(config, { shouldUseStrictMode = false }) {
	config = withAppsFlyerIos(config, shouldUseStrictMode);
	return config;
};
