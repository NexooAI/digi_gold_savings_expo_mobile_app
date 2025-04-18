const theme = require("./src/constants/theme.config");
export default {
  expo: {
    name: theme.customerName,
    slug: theme.slug,
    version: "1.0.1",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "acme",

    icon: theme.splashLogo,
    splash: {
      image: theme.splashLogo,
      resizeMode: "contain",
      backgroundColor: theme.primaryColor,
    },

    androidStatusBar: {
      backgroundColor: theme.primaryColor,
      translucent: false,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: theme.adaptiveIcon,
        backgroundColor: theme.primaryColor,
      },
      splash: {
        image: theme.adaptiveIcon,
        resizeMode: "contain",
        backgroundColor: theme.primaryColor,
        mdpi: theme.adaptiveIcon,
        hdpi: theme.adaptiveIcon,
        xhdpi: theme.adaptiveIcon,
        xxhdpi: theme.adaptiveIcon,
        xxxhdpi: theme.adaptiveIcon,
      },
      package: "com.nexooai.dcjewellery",
      versionCode: 5,
      config: {
        googleMaps: {
          apiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
        },
      },
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
