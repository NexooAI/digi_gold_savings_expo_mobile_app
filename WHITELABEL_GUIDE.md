# Whitelabel App Structure Guide

## Overview

This guide explains how to restructure your React Native/Expo app for a whitelabel concept, allowing you to create multiple branded versions of the same app for different clients.

## Project Structure

```
src/
├── brands/                          # Brand-specific configurations
│   ├── dc-jewellers/               # DC Jewellers brand
│   │   ├── config/
│   │   │   ├── app.config.js       # App configuration
│   │   │   ├── theme.js            # Brand colors and styling
│   │   │   └── assets.js           # Brand-specific images
│   │   ├── assets/                 # Brand-specific assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   └── locales/                # Brand-specific translations
│   │       ├── en.json
│   │       ├── mal.json
│   │       └── ta.json
│   ├── brand2/                     # Second brand
│   │   └── [same structure]
│   └── brand3/                     # Third brand
│       └── [same structure]
├── core/                           # Shared core functionality
│   ├── config/
│   │   └── BrandConfig.js          # Dynamic brand loading
│   ├── theme/                      # Shared theme utilities
│   ├── navigation/                 # Shared navigation
│   └── providers/                  # Shared context providers
└── shared/                         # Shared components and utilities
    ├── components/                 # Reusable components
    ├── services/                   # API services
    ├── utils/                      # Utility functions
    └── hooks/                      # Custom hooks
```

## Key Components

### 1. Brand Configuration (`src/brands/{brand-name}/config/`)

Each brand has its own configuration files:

#### `app.config.js`
```javascript
module.exports = {
  // App Identity
  appName: "DC Jewellers",
  appSlug: "dc-jewellers-gold-and-diamonds",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "com.nexooai.dcjewellery",
  iosBundleId: "com.nexooai.dcjewellery",
  
  // API Configuration
  baseUrl: "https://api.prod.dcjewellers.org",
  
  // Company Information
  company: {
    name: "DC Jewellers",
    address: "Road Fathima Nagar, Mission Quarters...",
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
};
```

#### `theme.js`
```javascript
module.exports = {
  colors: {
    primary: "#850111",
    secondary: "#ffc90c",
    background: "#ffffff",
    // ... more colors
  },
  typography: {
    fontFamily: {
      primary: "Poppins",
      secondary: "Roboto",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      // ... more sizes
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    // ... more spacing
  },
  // ... more theme properties
};
```

#### `assets.js`
```javascript
module.exports = {
  icons: {
    splashScreen: require("../../assets/images/splashscreen_logo.png"),
    adaptiveIcon: require("../../assets/images/adaptive-icon.png"),
    // ... more icons
  },
  backgrounds: {
    login: require("../../assets/images/bg_login.jpg"),
    // ... more backgrounds
  },
  // ... more asset categories
};
```

### 2. Core Brand Configuration (`src/core/config/BrandConfig.js`)

This file dynamically loads brand-specific configurations:

```javascript
import { Platform } from 'react-native';

const BRAND_NAME = process.env.BRAND_NAME || 'dc-jewellers';

// Dynamic imports for brand configurations
const getBrandConfig = () => {
  try {
    return require(`../../brands/${BRAND_NAME}/config/app.config.js`);
  } catch (error) {
    console.error(`Brand config not found for: ${BRAND_NAME}`);
    return require(`../../brands/dc-jewellers/config/app.config.js`);
  }
};

export const brandConfig = getBrandConfig();
export const brandTheme = getBrandTheme();
export const brandAssets = getBrandAssets();

// Helper functions
export const getBrandName = () => brandConfig.appName;
export const getBaseUrl = () => brandConfig.baseUrl;
export const getCompanyInfo = () => brandConfig.company;
export const isFeatureEnabled = (featureName) => {
  return brandConfig.features?.[featureName] || false;
};
```

### 3. Build Script (`scripts/build-brand.js`)

Automated build script for different brands:

```bash
# Build for DC Jewellers
node scripts/build-brand.js dc-jewellers android

# Build for Brand 2
node scripts/build-brand.js brand2 ios

# Build for Brand 3
node scripts/build-brand.js brand3 android
```

## How to Use

### 1. Creating a New Brand

1. **Create brand directory structure:**
   ```bash
   mkdir -p src/brands/new-brand/config
   mkdir -p src/brands/new-brand/assets/images
   mkdir -p src/brands/new-brand/locales
   ```

2. **Copy and customize configuration files:**
   ```bash
   cp src/brands/dc-jewellers/config/* src/brands/new-brand/config/
   ```

3. **Update brand-specific configurations:**
   - Modify `app.config.js` with new brand details
   - Update `theme.js` with new colors and styling
   - Replace assets in `assets.js` with brand-specific images

4. **Add brand assets:**
   - Place brand-specific images in `src/brands/new-brand/assets/images/`
   - Update asset references in `assets.js`

5. **Update build script:**
   - Add new brand to `AVAILABLE_BRANDS` array in `scripts/build-brand.js`
   - Add brand configuration to `BRAND_CONFIGS` object

### 2. Using Brand Configuration in Components

```javascript
import { brandConfig, brandTheme, brandAssets, isFeatureEnabled } from '../core/config/BrandConfig';

const MyComponent = () => {
  const companyName = brandConfig.company.name;
  const primaryColor = brandTheme.colors.primary;
  const logo = brandAssets.icons.transparentLogo;
  
  // Feature flag usage
  if (isFeatureEnabled('enableGoldAdvance')) {
    // Show gold advance feature
  }
  
  return (
    <View style={{ backgroundColor: primaryColor }}>
      <Image source={logo} />
      <Text>{companyName}</Text>
    </View>
  );
};
```

### 3. Environment-Based Brand Selection

Set the `BRAND_NAME` environment variable:

```bash
# For development
BRAND_NAME=dc-jewellers npm start

# For production builds
BRAND_NAME=brand2 npm run build:android
```

## Migration Steps

### Step 1: Restructure Existing Code

1. **Move current theme configuration:**
   ```bash
   mkdir -p src/brands/dc-jewellers/config
   cp src/constants/theme.config.js src/brands/dc-jewellers/config/app.config.js
   cp src/constants/theme.js src/brands/dc-jewellers/config/theme.js
   ```

2. **Create assets configuration:**
   ```bash
   # Create assets.js with current image references
   ```

3. **Update imports throughout the app:**
   ```javascript
   // Old import
   import { theme } from '../constants/theme';
   
   // New import
   import { brandTheme } from '../core/config/BrandConfig';
   ```

### Step 2: Create Core Configuration

1. **Create BrandConfig.js**
2. **Update app.config.js to use dynamic configuration**
3. **Create build script**

### Step 3: Test Brand Switching

1. **Test with environment variables:**
   ```bash
   BRAND_NAME=dc-jewellers npm start
   ```

2. **Test build script:**
   ```bash
   node scripts/build-brand.js dc-jewellers android
   ```

## Benefits of This Structure

### 1. **Scalability**
- Easy to add new brands
- Centralized configuration management
- Consistent structure across brands

### 2. **Maintainability**
- Shared code reduces duplication
- Brand-specific customizations are isolated
- Easy to update shared functionality

### 3. **Flexibility**
- Feature flags for brand-specific features
- Dynamic asset loading
- Environment-based brand selection

### 4. **Build Automation**
- Automated build process for different brands
- Consistent build configuration
- Easy deployment pipeline

## Best Practices

### 1. **Asset Management**
- Use consistent naming conventions
- Keep brand assets organized by category
- Use relative paths for asset references

### 2. **Configuration Management**
- Keep sensitive data in environment variables
- Use feature flags for conditional functionality
- Document all configuration options

### 3. **Code Organization**
- Keep shared code in `src/shared/`
- Brand-specific code in `src/brands/{brand}/`
- Use clear separation of concerns

### 4. **Testing**
- Test with different brand configurations
- Verify feature flags work correctly
- Test asset loading for each brand

## Troubleshooting

### Common Issues

1. **Brand config not found:**
   - Check `BRAND_NAME` environment variable
   - Verify brand directory exists
   - Check file paths in BrandConfig.js

2. **Assets not loading:**
   - Verify asset paths in `assets.js`
   - Check file permissions
   - Ensure assets exist in brand directory

3. **Build failures:**
   - Check package/bundle identifiers
   - Verify project IDs and owners
   - Check Google Services configuration

### Debug Commands

```bash
# Check current brand
echo $BRAND_NAME

# List available brands
ls src/brands/

# Test brand configuration
node -e "console.log(require('./src/core/config/BrandConfig').brandConfig)"
```

This whitelabel structure provides a robust foundation for managing multiple branded versions of your app while maintaining code quality and development efficiency. 