module.exports = {
  // App Identity
  appName: "Akila Jewellers",
  appSlug: "akilajewellery",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "com.nexooai.akilajewellers",
  iosBundleId: "com.nexooai.akilajewellers",
  
  // Project Configuration
  projectId: "4a014870-9859-4e8d-a8a3-09ca4b79c635",
  owner: "sudhakarg",
  
  // API Configuration
  baseUrl: "https://api.prod.akilajewellers.com",
  youtubeUrl: "https://youtu.be/akilajewellers-video",
  
  // Google Services Configuration
  googleServicesFile: "./credentials/akilajewellers/google-services.json",
  googleMapsApiKey: "YOUR_MAPS_API_KEY_HERE",
  googleServices: {
    projectId: "akilajewellers-project",
    apiKey: "YOUR_GOOGLE_API_KEY_HERE",
    projectNumber: "000000000000",
    mobileSdkAppId: "1:000000000000:android:akilajewellers"
  },
  
  // Credentials Configuration
  credentials: {
    file: "./credentials/akilajewellers/credentials.json",
    apiKey: "YOUR_API_KEY_HERE",
    secretKey: "YOUR_SECRET_KEY_HERE",
    paymentGateway: {
      merchantId: "YOUR_MERCHANT_ID_HERE",
      accessKey: "YOUR_ACCESS_KEY_HERE",
      secretKey: "YOUR_SECRET_KEY_HERE"
    },
    notification: {
      fcmServerKey: "YOUR_FCM_SERVER_KEY_HERE",
      fcmSenderId: "000000000000"
    }
  },
  
  // Brand Colors and Assets
  primaryColor: "#1a2a39",
  splashLogo: "./src/brands/akilajewellers/assets/images/splashscreen_logo.png",
  adaptiveIcon: "./src/brands/akilajewellers/assets/images/adaptive-icon.png",
  logo: "./src/brands/akilajewellers/assets/images/logo.png",
  logoTrans: "./src/brands/akilajewellers/assets/images/logo_trans.png",
  favicon: "./src/brands/akilajewellers/assets/images/favicon.png",
  
  // Brand Assets Configuration
  assets: {
    logo: "./src/brands/akilajewellers/assets/images/logo.png",
    logoTrans: "./src/brands/akilajewellers/assets/images/logo_trans.png",
    splashLogo: "./src/brands/akilajewellers/assets/images/splashscreen_logo.png",
    adaptiveIcon: "./src/brands/akilajewellers/assets/images/adaptive-icon.png",
    favicon: "./src/brands/akilajewellers/assets/images/favicon.png",
    brandColors: "./src/brands/akilajewellers/assets/images/brand_colors.json"
  },
  
  // Company Information
  company: {
    name: "Akila Jewellers",
    address: "Main Street, Building, City, State 000000",
    mobile: "+91 9876543210",
    email: "info@akilajewellers.com",
    website: "https://www.akilajewellers.com",
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
    facebook: "https://facebook.com/akilajewellers",
    instagram: "https://instagram.com/akilajewellers",
    youtube: "https://youtube.com/akilajewellers",
  }
};