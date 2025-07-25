const theme = require("./src/constants/theme.config");

export default {
  expo: {
    name: theme.customerName,
    slug: theme.slug,
    version: "2.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "acme",

    icon: theme.splashLogo,
    splash: {
      image: theme.splashLogo,
      resizeMode: "contain",
      backgroundColor: "#850111",
    },

    androidStatusBar: {
      backgroundColor: "#850111",
      translucent: false,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: theme.adaptiveIcon,
        backgroundColor: "#850111",
      },
      splash: {
        image: theme.adaptiveIcon,
        resizeMode: "contain",
        backgroundColor: "#850111",
        mdpi: theme.adaptiveIcon,
        hdpi: theme.adaptiveIcon,
        xhdpi: theme.adaptiveIcon,
        xxhdpi: theme.adaptiveIcon,
        xxxhdpi: theme.adaptiveIcon,
      },
      package: "com.nexooai.dcjewellery",
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
        color: "#850111"
      },
      targetSdkVersion: 36,
      jsEngine: "hermes",
    },

    ios: {
      supportsTablet: true,
      splash: {
        image: theme.adaptiveIcon,
        resizeMode: "contain",
        backgroundColor: theme.primaryColor,
        tabletImage: theme.adaptiveIcon,
      },
      bundleIdentifier: "com.nexooai.dcjewellery",
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
        projectId: theme.projectId,
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
    owner: theme.owner,
  },
};
