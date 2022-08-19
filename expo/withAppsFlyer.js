const withAppsFlyerIos = require('./withAppsFlyerIos');
module.exports = function withAppsFlyer(config, strictModeConfig) {
	config = withAppsFlyerIos(config, strictModeConfig?.shouldUseStrictMode === true);
	return config;
};
