module.exports = {
  // App Identity
  appName: "DC Jewellers",
  appSlug: "dc-jewellers-gold-and-diamonds",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "com.nexooai.dcjewellery",
  iosBundleId: "com.nexooai.dcjewellery",
  
  // Project Configuration
  projectId: "9af1745a-105c-44f9-9e53-a111bc6ed9ce",
  owner: "sudhakarg",
  
  // API Configuration
  baseUrl: "https://api.prod.dcjewellers.org",
  youtubeUrl: "https://youtu.be/8RAhdn5b9Bw",
  
  // Google Services
  googleServicesFile: "./google-services.json",
  googleMapsApiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
  
  // Brand Colors and Assets
  primaryColor: "#850111",
  splashLogo: "./assets/images/splashscreen_logo.png",
  adaptiveIcon: "./assets/images/adaptive-icon.png",
  
  // Company Information
  company: {
    name: "DC Jewellers",
    address: "Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005",
    mobile: "+91 9061803999",
    email: "dcjewellerstcr@gmail.com",
    website: "https://www.dcjewellers.org",
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
    facebook: "https://facebook.com/dcjewellers",
    instagram: "https://instagram.com/dcjewellers",
    youtube: "https://youtube.com/dcjewellers",
  }
}; 