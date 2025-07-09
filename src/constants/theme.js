// src/constants/theme.js

const theme = {
  colors: {
    primary: process.env.APP_COLOR || "#1a2a39", //850111
    secondary: "#ffc90c", //
    background: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#000000",
    border: "#cccccc",
    inputBackground: "rgba(255, 255, 255, 0.2)",
    error: "#ff4d4f",
    success: "#4CAF50",
    link: "#ffc90c",
    textDark: "#2e0406",
    white: "#ffffff",
    black: "#000000",
    textLight: "#ffffff",
    textGrey: "#808080",
    grey: "#808080",
    lightGrey: "#f0f0f0",
    darkGrey: "#808080",
    lightBlack: "#000000",
    support_container: ["#1a4a6d", "#2a5a8d", "#3a6aad"],
  },
  image: {
    splashScreen: require("../../assets/images/splashscreen_logo.png"),
    splash_logo: require("../../assets/images/splashscreen_logo.png"),
    adative_icon: require("../../assets/images/adaptive-icon.png"),
    transparentLogo: require("../../assets/images/logo_trans.png"),
    menu_bg: require("../../assets/images/menu_bg.png"),
    bg_image: require("../../assets/images/bg_login.jpg"),
    gold_image: require("../../assets/images/bar.png"),
    silver_image: require("../../assets/images/silver.png"),
    sliderImages: [
      require("../../assets/images/slider1.png"),
      require("../../assets/images/slider2.png"),
    ],
    store_image: require("../../assets/images/store.png"),
    gold_pattern: require("../../assets/images/gold_pattern.jpg"),
    cancel_icon: require("../../assets/images/cancel.png"),
    success_icon: require("../../assets/images/success.png"),
    shop_icon: require("../../assets/images/shop.jpg"),
    no_data: require("../../assets/images/no-data.png"),
    savings_bg: require("../../assets/images/savingsbg.jpg"),
    digigoldproduct: require("../../assets/images/digigoldproduct.png"),
    translate: require("../../assets/images/translate/mal.png"),
  },
  constants: {
    customerName: "Akila Jewellers",
    address:
      "205/64A, Main Bazar, Udangudi, Thoothukudi(D), Tamil Nadu - 628203",
    mobile: "+91 6384226384",
    whatsapp: "+91 6384226384",
    email: "akilajewellwes66@gmail.com",
    website: "https://akilajewellers.com/",
    latitude:8.427828080550306,
    longitude:78.02855977120382
  },
  // baseUrl:"http://api.akila.ramcarmotor.com",
  // baseUrl:"http://reqres.akilajewellers.com", 
  baseUrl: "http://13.127.96.61",
  // baseUrl: "https://api.dcjewellers.org",
  // baseUrl: "https://nexooai.ramcarmotor.com",
  youtubeUrl: "https://youtu.be/8RAhdn5b9Bw",
};

module.exports = { theme };
