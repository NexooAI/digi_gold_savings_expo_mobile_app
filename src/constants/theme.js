// src/constants/theme.js
const { brandConfig, brandTheme } = require("../core/config/BrandConfig");

// Helper function to get brand-specific assets
const getBrandAssets = () => {
  const brandSlug = brandConfig.appSlug;
  
  // Define all possible brand assets
  const brandAssets = {
    'akilajewellers': {
      splashScreen: require("../brands/akilajewellers/assets/images/splashscreen_logo.png"),
      splash_logo: require("../brands/akilajewellers/assets/images/splashscreen_logo.png"),
      adative_icon: require("../brands/akilajewellers/assets/images/adaptive-icon.png"),
      transparentLogo: require("../brands/akilajewellers/assets/images/logo_trans.png"),
      logo: require("../brands/akilajewellers/assets/images/logo.png"),
      bg_image: require("../brands/akilajewellers/assets/images/bg_login.jpg"),
      bg_new: require("../brands/akilajewellers/assets/images/bg_new.jpg"),
      // Additional akilajewellers specific assets
      bg_login1: require("../brands/akilajewellers/assets/images/bg_login1.jpg"),
      bg_login2: require("../brands/akilajewellers/assets/images/bg_login2.jpg"),
      bg_login3: require("../brands/akilajewellers/assets/images/bg_login3.jpg"),
      gold_bg: require("../brands/akilajewellers/assets/images/gold_bg.png"),
      gold_bg2: require("../brands/akilajewellers/assets/images/gold_bg2.png"),
      savings_bg: require("../brands/akilajewellers/assets/images/savingsbg.jpg"),
      digigoldproduct: require("../brands/akilajewellers/assets/images/digigoldproduct.png"),
      savegold: require("../brands/akilajewellers/assets/images/savegold.png"),
      saveasmoneyproduct: require("../brands/akilajewellers/assets/images/saveasmoneyproduct.png"),
      saveasgoldproduct: require("../brands/akilajewellers/assets/images/saveasgoldproduct.png"),
    },
    'dc-jewellers': {
      splashScreen: require("../../assets/images/splashscreen_logo.png"),
      splash_logo: require("../../assets/images/splashscreen_logo.png"),
      adative_icon: require("../../assets/images/adaptive-icon.png"),
      transparentLogo: require("../../assets/images/logo_trans.png"),
      logo: require("../../assets/images/logo_trans.png"),
      bg_image: require("../../assets/images/bg_login.jpg"),
      bg_new: require("../../assets/images/bg_new.jpg"),
    },

  };
  
  return brandAssets[brandSlug] || brandAssets['dc-jewellers'];
};

const brandAssets = getBrandAssets();

const theme = {
  colors: {
    primary: brandTheme.colors.primary || "#850111",
    secondary: brandTheme.colors.secondary || "#ffc90c",
    background: brandTheme.colors.background || "#ffffff",
    textPrimary: brandTheme.colors.textPrimary || "#ffffff",
    textSecondary: brandTheme.colors.textSecondary || "#000000",
    border: brandTheme.colors.border || "#cccccc",
    inputBackground: brandTheme.colors.inputBackground || "rgba(255, 255, 255, 0.2)",
    error: brandTheme.colors.error || "#ff4d4f",
    success: brandTheme.colors.success || "#4CAF50",
    link: brandTheme.colors.link || "#ffc90c",
    textDark: brandTheme.colors.textDark || "#2e0406",
    white: brandTheme.colors.white || "#ffffff",
    black: brandTheme.colors.black || "#000000",
    textLight: brandTheme.colors.textLight || "#ffffff",
    textGrey: brandTheme.colors.textGrey || "#808080",
    grey: brandTheme.colors.grey || "#808080",
    lightGrey: brandTheme.colors.lightGrey || "#f0f0f0",
    darkGrey: brandTheme.colors.darkGrey || "#808080",
    lightBlack: brandTheme.colors.lightBlack || "#000000",
    support_container: brandTheme.colors.support_container || ["#721c0b", "#c42101", "#fc320a"],
  },
  image: {
    // Brand-specific assets
    ...brandAssets,
    
    // Other assets - use brand-specific when available, fallback to default
    menu_bg: brandAssets.menu_bg || require("../../assets/images/menu_bg.png"),
    gold_image: brandAssets.bar || require("../../assets/images/bar.png"),
    silver_image: require("../../assets/images/silver.png"),
    sliderImages: [
      require("../../assets/images/slider1.png"),
      require("../../assets/images/slider2.png"),
      require("../../assets/images/slider3.png"),
      require("../../assets/images/slider4.png"),
    ],
    store_image: require("../../assets/images/store.png"),
    gold_pattern: require("../../assets/images/gold_pattern.jpg"),
    cancel_icon: require("../../assets/images/cancel.png"),
    success_icon: require("../../assets/images/success.png"),
    shop_icon: require("../../assets/images/shop.jpg"),
    no_data: require("../../assets/images/no-data.png"),
    translate: require("../../assets/images/translate/mal.png"),
  },
  constants: {
    customerName: brandConfig.company?.name || "DC Jewellers",
    address: brandConfig.company?.address || "Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005",
    mobile: brandConfig.company?.mobile || "+91 9061803999",
    email: brandConfig.company?.email || "dcjewellerstcr@gmail.com",
    website: brandConfig.company?.website || "https://www.dcjewellers.org",
  },
  baseUrl: brandConfig.baseUrl || "https://api.prod.dcjewellers.org",
  youtubeUrl: brandConfig.youtubeUrl || "https://youtu.be/8RAhdn5b9Bw",
};

module.exports = { theme };
