module.exports = {
  // App Identity
  appName: "Demo Jewellers",
  appSlug: "demo-jewellers",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "com.nexooai.demojewellers",
  iosBundleId: "com.nexooai.demojewellers",
  
  // Project Configuration
  projectId: "demo-jewellers-project-id",
  owner: "demo-jewellersowner",
  
  // API Configuration
  baseUrl: "https://api.prod.demo-jewellers.org",
  youtubeUrl: "https://youtu.be/demo-jewellers-video",
  
  // Google Services
  googleServicesFile: "./google-services.json",
  googleMapsApiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
  
  // Brand Colors and Assets
  primaryColor: "#1a2a39",
  splashLogo: "./src/brands/demo-jewellers/assets/images/splash_logo.png",
  adaptiveIcon: "./src/brands/demo-jewellers/assets/images/adaptive_icon.png",
  logo: "./src/brands/demo-jewellers/assets/images/logo.png",
  logoTrans: "./src/brands/demo-jewellers/assets/images/logo_trans.png",
  favicon: "./src/brands/demo-jewellers/assets/images/favicon.png",
  
  // Brand Assets Configuration
  assets: {
    logo: "./src/brands/demo-jewellers/assets/images/logo.png",
    logoTrans: "./src/brands/demo-jewellers/assets/images/logo_trans.png",
    splashLogo: "./src/brands/demo-jewellers/assets/images/splash_logo.png",
    adaptiveIcon: "./src/brands/demo-jewellers/assets/images/adaptive_icon.png",
    favicon: "./src/brands/demo-jewellers/assets/images/favicon.png",
    brandColors: "./src/brands/demo-jewellers/assets/images/brand_colors.json"
  },
  
  // Company Information
  company: {
    name: "Demo Jewellers",
    address: "Main Street, Building, City, State 000000",
    mobile: "+91 9876543210",
    email: "info@demo-jewellers.com",
    website: "https://www.demo-jewellers.com",
  },
  
  // Features Configuration
  features: {
    enableGoldAdvance: true,
    enableSavings: true,
    enableLiveRates: true,
    enableStoreLocator: true,
    enableNotifications: true,
    enableMultiLanguage: true,
    enableBiometricAuth: true,
  },
  
  // Payment Configuration
  payment: {
    gateway: "hypercheckout",
    currency: "INR",
    supportedMethods: ["card", "upi", "netbanking"],
  },
  
  // Social Media
  socialMedia: {
    facebook: "https://facebook.com/demo-jewellers",
    instagram: "https://instagram.com/demo-jewellers",
    youtube: "https://youtube.com/demo-jewellers",
  }
};