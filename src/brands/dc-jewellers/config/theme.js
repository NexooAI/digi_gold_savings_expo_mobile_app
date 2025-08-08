module.exports = {
  // Color Scheme
  colors: {
    primary: "#850111",
    secondary: "#ffc90c",
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
    support_container: ["#721c0b", "#c42101", "#fc320a"],
    
    // Brand-specific gradients
    gradients: {
      primary: ["#850111", "#a50114"],
      secondary: ["#ffc90c", "#ffd633"],
      background: ["#ffffff", "#f8f8f8"],
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: "Poppins",
      secondary: "Roboto",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
  },
  
  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
}; 