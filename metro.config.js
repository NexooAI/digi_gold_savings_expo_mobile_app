const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
// Add Razorpay to transpiled modules
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules
  };

module.exports = withNativeWind(config, { input: "./src/global.css" });
