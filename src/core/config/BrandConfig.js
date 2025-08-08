// Brand selection - can be set via environment variable, global variable, or build script
let BRAND_NAME = (process.env.BRAND_NAME || global.BRAND_NAME || 'akilajewellers').trim();

// Function to set brand at runtime
const setBrand = (brandName) => {
  BRAND_NAME = brandName.trim();
  global.BRAND_NAME = brandName.trim();
  console.log('🔍 Brand changed to:', BRAND_NAME);
};

// Function to get current brand
const getCurrentBrand = () => BRAND_NAME;

// Static imports for brand configurations
const dcJewellersConfig = require('../../brands/dc-jewellers/config/app.config.js');
const dcJewellersTheme = require('../../brands/dc-jewellers/config/theme.js');
const dcJewellersHomeStyles = require('../../brands/dc-jewellers/config/home-styles.json');

const akilajewellersConfig = require('../../brands/akilajewellers/config/app.config.js');
const akilajewellersTheme = require('../../brands/akilajewellers/config/theme.js');
const akilajewellersHomeStyles = require('../../brands/akilajewellers/config/home-styles.json');

const demojewellersConfig = require('../../brands/demo-jewellers/config/app.config.js');
const demojewellersTheme = require('../../brands/demo-jewellers/config/theme.js');

const srimurugangoldhouseConfig = require('../../brands/srimurugangoldhouse/config/app.config.js');
const srimurugangoldhouseTheme = require('../../brands/srimurugangoldhouse/config/theme.js');
const srimurugangoldhouseHomeStyles = require('../../brands/srimurugangoldhouse/config/home-styles.json');

// Brand configuration mappings
const brandConfigs = {
  'dc-jewellers': {
    config: dcJewellersConfig,
    theme: dcJewellersTheme,
    homeStyles: dcJewellersHomeStyles,
  },
  'akilajewellers': {
    config: akilajewellersConfig,
    theme: akilajewellersTheme,
    homeStyles: akilajewellersHomeStyles,
  },
  'srimurugangoldhouse': {
    config: srimurugangoldhouseConfig,
    theme: srimurugangoldhouseTheme,
    homeStyles: srimurugangoldhouseHomeStyles,
  },
};

// Debug logging to see what brand is being detected
console.log('🔍 BrandConfig Debug:', {
  BRAND_NAME,
  processEnv: process.env.BRAND_NAME,
  globalBrand: global.BRAND_NAME,
  defaultBrand: 'akilajewellers',
  availableBrands: Object.keys(brandConfigs),
  selectedBrandExists: brandConfigs[BRAND_NAME] ? '✅ YES' : '❌ NO'
});

// Dynamic imports for brand configurations
const getBrandConfig = () => {
  console.log('🔍 getBrandConfig called with BRAND_NAME:', BRAND_NAME);
  const brandConfig = brandConfigs[BRAND_NAME];
  if (brandConfig) {
    console.log('✅ Brand config found for:', BRAND_NAME);
    return brandConfig.config;
  }
  console.error(`❌ Brand config not found for: ${BRAND_NAME}`);
  // Fallback to default brand
  return brandConfigs['dc-jewellers'].config;
};

const getBrandTheme = () => {
  const brandConfig = brandConfigs[BRAND_NAME];
  if (brandConfig) {
    return brandConfig.theme;
  }
  console.error(`Brand theme not found for: ${BRAND_NAME}`);
  return brandConfigs['dc-jewellers'].theme;
};

const getBrandAssets = () => {
  try {
    const brandConfig = brandConfigs[BRAND_NAME];
    if (brandConfig && brandConfig.config.assets) {
      return brandConfig.config.assets;
    }
    return {};
  } catch (error) {
    console.error(`Brand assets not found for: ${BRAND_NAME}`);
    return {};
  }
};

const getBrandHomeStyles = () => {
  try {
    const brandConfig = brandConfigs[BRAND_NAME];
    if (brandConfig && brandConfig.homeStyles) {
      return brandConfig.homeStyles;
    }
    console.error(`Brand home styles not found for: ${BRAND_NAME}`);
    return brandConfigs['akilajewellers'].homeStyles;
  } catch (error) {
    console.error(`Brand home styles not found for: ${BRAND_NAME}`);
    return brandConfigs['akilajewellers'].homeStyles;
  }
};

// Export brand configurations
const brandConfig = getBrandConfig();
const brandTheme = getBrandTheme();
const brandAssets = getBrandAssets();
const brandHomeStyles = getBrandHomeStyles();

// Helper functions
const getBrandName = () => brandConfig.appName;
const getBrandSlug = () => brandConfig.appSlug;
const getBaseUrl = () => brandConfig.baseUrl;
const getCompanyInfo = () => brandConfig.company;
const getFeatures = () => brandConfig.features;
const getPaymentConfig = () => brandConfig.payment;
const getSocialMedia = () => brandConfig.socialMedia;

// Platform-specific configurations
const getPlatformConfig = () => {
  const config = {
    android: {
      package: brandConfig.androidPackage,
      googleServicesFile: brandConfig.googleServicesFile,
      googleMapsApiKey: brandConfig.googleMapsApiKey,
    },
    ios: {
      bundleIdentifier: brandConfig.iosBundleId,
    },
  };
  
  return config['android'] || {};
};

// Feature flags
const isFeatureEnabled = (featureName) => {
  return brandConfig.features?.[featureName] || false;
};

// Brand-specific constants
const BRAND_CONSTANTS = {
  BRAND_NAME,
  APP_NAME: brandConfig.appName,
  APP_SLUG: brandConfig.appSlug,
  VERSION: brandConfig.version,
  PROJECT_ID: brandConfig.projectId,
  OWNER: brandConfig.owner,
};

module.exports = {
  brandConfig,
  brandTheme,
  brandAssets,
  brandHomeStyles,
  getBrandName,
  getBrandSlug,
  getBaseUrl,
  getCompanyInfo,
  getFeatures,
  getPaymentConfig,
  getSocialMedia,
  getPlatformConfig,
  isFeatureEnabled,
  BRAND_CONSTANTS,
  setBrand,
  getCurrentBrand,
}; 