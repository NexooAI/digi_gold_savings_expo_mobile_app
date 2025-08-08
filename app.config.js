// Import the brand configuration dynamically
const { brandConfig } = require("./src/core/config/BrandConfig");

module.exports = {
  expo: {
    name: brandConfig.appName,
    slug: brandConfig.appSlug,
    version: "2.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "acme",

    icon: brandConfig.splashLogo || "./assets/images/icon.png",
    splash: {
      image: brandConfig.splashLogo || "./assets/images/splashscreen_logo.png",
      resizeMode: "contain",
      backgroundColor: brandConfig.primaryColor || "#1a2a39",
    },

    androidStatusBar: {
      backgroundColor: brandConfig.primaryColor || "#1a2a39",
      translucent: false,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        backgroundColor: brandConfig.primaryColor || "#1a2a39",
      },
      splash: {
        image: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        resizeMode: "contain",
        backgroundColor: brandConfig.primaryColor || "#1a2a39",
        mdpi: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        hdpi: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        xhdpi: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        xxhdpi: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        xxxhdpi: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
      },
      package: brandConfig.androidPackage,
      googleServicesFile: "./google-services.json",
      versionCode:2,
      config: {
        googleMaps: {
          apiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
        },
      },
      edgeToEdgeEnabled: true,
      notification: {
        icon: "./assets/images/icon.png",
        color: brandConfig.primaryColor || "#1a2a39"
      },
      targetSdkVersion: 36,
      jsEngine: "hermes",
    },

    ios: {
      supportsTablet: true,
      splash: {
        image: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
        resizeMode: "contain",
        backgroundColor: brandConfig.primaryColor || "#1a2a39",
        tabletImage: brandConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
      },
      bundleIdentifier: brandConfig.iosBundleId,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    plugins: [
      "expo-font",
      "expo-asset",
      ["expo-router", { origin: "https://n" }],
      "expo-secure-store",
      "expo-localization",
      "expo-notifications",
      "./plugins/withAndroidManifest"
    ],

    extra: {
      router: {
        origin: "https://n",
      },
      eas: {
        projectId: brandConfig.projectId,
      },
    },

    assetBundlePatterns: ["**/*"],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    newArchEnabled: true,
    web: {
      output: "static",
      bundler: "metro",
    },
    owner: brandConfig.owner,
  },
};
