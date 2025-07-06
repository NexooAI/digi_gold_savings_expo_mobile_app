// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom configurations
config.resolver.sourceExts.push('mjs');

// Add platform-specific resolver for react-native-maps
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver for react-native-maps web compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add resolver for handling native modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add resolver for handling native modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add blacklist for native-only modules on web
config.resolver.blacklistRE = /node_modules\/react-native-maps\/.*\.(native|ios|android)\.(js|ts|tsx)$/;

// Add platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.js',
  'web.ts',
  'web.tsx',
];

// Add resolver for handling AIRMap errors
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': 'react-native-maps/lib/MapView.web.js',
};

// Add error handling for native modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = withNativeWind(config, { input: './src/global.css' }); 