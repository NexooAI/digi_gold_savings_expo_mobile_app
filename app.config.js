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
      backgroundColor: "#1a2a39",
    },

    androidStatusBar: {
      backgroundColor: "#1a2a39",
      translucent: false,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: theme.adaptiveIcon,
        backgroundColor: "#1a2a39",
      },
      splash: {
        image: theme.adaptiveIcon,
        resizeMode: "contain",
        backgroundColor: "#1a2a39",
        mdpi: theme.adaptiveIcon,
        hdpi: theme.adaptiveIcon,
        xhdpi: theme.adaptiveIcon,
        xxhdpi: theme.adaptiveIcon,
        xxxhdpi: theme.adaptiveIcon,
      },
      package: theme.bundleIdentifier,
      googleServicesFile: "./google-services.json",
      versionCode: 2,
      config: {
        googleMaps: {
          apiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
        },
      },
      "compileSdkVersion": 33, // Or the recommended version
      "targetSdkVersion": 33, // Or the recommended version
      "buildToolsVersion": "33.0.0"
    },

    ios: {
      supportsTablet: true,
      splash: {
        image: theme.adaptiveIcon,
        resizeMode: "contain",
        backgroundColor: theme.primaryColor,
        tabletImage: theme.adaptiveIcon,
      },
      bundleIdentifier: theme.bundleIdentifier,
    },

    plugins: [
      "expo-font",
      "expo-asset",
      ["expo-router", { origin: "https://n" }],
      "expo-secure-store",
      "expo-localization",
      "expo-build-properties",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#1a2a39",
          sounds: ["./assets/sound/notification.wav"]
        }
      ],
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
