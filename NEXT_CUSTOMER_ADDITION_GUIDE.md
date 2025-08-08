# 🎯 Next Customer Addition Flow - Complete Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Pre-requisites](#pre-requisites)
3. [Quick Start](#quick-start)
4. [Interactive Setup](#interactive-setup)
5. [Manual Setup](#manual-setup)
6. [Configuration Details](#configuration-details)
7. [Asset Management](#asset-management)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 📖 Overview

This guide provides a complete workflow for adding new customers (brands) to the multi-brand jewellery app system. The process includes:

- ✅ **Automated brand creation** with scripts
- 🎨 **Brand-specific configurations** (colors, logos, themes)
- 🌍 **Multi-language support** (English, Tamil, Malayalam)
- 📱 **Mobile app configurations** (Android/iOS packages)
- 🔧 **Asset management** (logos, icons, splash screens)
- 🚀 **Quick switching** between brands

---

## 📋 Pre-requisites

### Required Information
- **Brand Name** (e.g., "royal-jewellers")
- **App Name** (e.g., "Royal Jewellers")
- **Primary Color** (e.g., "#1a2a39")
- **Secondary Color** (e.g., "#f6ad55")
- **Company Information** (name, address, contact)
- **API Base URL** (e.g., "https://api.royaljewellers.com")
- **Social Media URLs** (Facebook, Instagram, YouTube)

### Required Assets
- **Logo Files** (PNG format recommended):
  - `logo.png` - Main brand logo
  - `logo_trans.png` - Transparent background logo
  - `splash_logo.png` - Splash screen logo
  - `adaptive_icon.png` - Android adaptive icon
  - `favicon.png` - Web favicon

---

## ⚡ Quick Start

### Method 1: Quick Create (Recommended)
```bash
# Create a new brand with default settings
node next-customer-flow.js create royal-jewellers

# This creates:
# ✅ src/brands/royal-jewellers/ directory structure
# ✅ Configuration files
# ✅ Theme files
# ✅ Locale files
# ✅ Switching script: switch-to-royal-jewellers.js
# ✅ Setup instructions: royal-jewellers-setup-instructions.md
```

### Method 2: Interactive Setup
```bash
# Interactive setup with custom configurations
node next-customer-flow.js interactive

# Follow the prompts to enter:
# - Brand name
# - App name
# - Colors
# - Company information
# - API URLs
```

---

## 🎯 Interactive Setup

### Step-by-Step Interactive Process

1. **Run Interactive Setup**
   ```bash
   node next-customer-flow.js interactive
   ```

2. **Enter Brand Information**
   ```
   Enter brand name (e.g., new-jewellers): royal-jewellers
   Enter app name (e.g., New Jewellers): Royal Jewellers
   Enter primary color (e.g., #1a2a39): #8B4513
   Enter secondary color (e.g., #f6ad55): #FFD700
   Enter API base URL (e.g., https://api.newjewellers.com): https://api.royaljewellers.com
   ```

3. **Enter Company Information**
   ```
   Enter company name: Royal Jewellers
   Enter company address: Main Street, Royal Building, Chennai, Tamil Nadu 600001
   Enter company mobile: +91 9876543210
   Enter company email: info@royaljewellers.com
   Enter company website: https://www.royaljewellers.com
   ```

4. **Enter Social Media URLs**
   ```
   Enter Facebook URL: https://facebook.com/royaljewellers
   Enter Instagram URL: https://instagram.com/royaljewellers
   Enter YouTube URL: https://youtube.com/royaljewellers
   ```

5. **System Creates**
   - ✅ Brand directory structure
   - ✅ Configuration files
   - ✅ Theme files
   - ✅ Locale files
   - ✅ Switching script
   - ✅ Setup instructions

---

## 🛠️ Manual Setup

### Step 1: Create Brand Directory Structure
```bash
# Create directories
mkdir -p src/brands/royal-jewellers/assets/images
mkdir -p src/brands/royal-jewellers/config
mkdir -p src/brands/royal-jewellers/locales
```

### Step 2: Create Configuration Files

#### A. App Configuration (`src/brands/royal-jewellers/config/app.config.js`)
```javascript
module.exports = {
  // App Identity
  appName: "Royal Jewellers",
  appSlug: "royal-jewellers",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "com.nexooai.royaljewellers",
  iosBundleId: "com.nexooai.royaljewellers",
  
  // Project Configuration
  projectId: "royal-jewellers-project-id",
  owner: "royaljewellersowner",
  
  // API Configuration
  baseUrl: "https://api.royaljewellers.com",
  youtubeUrl: "https://youtu.be/royal-jewellers-video",
  
  // Brand Colors and Assets
  primaryColor: "#8B4513",
  splashLogo: "./src/brands/royal-jewellers/assets/images/splash_logo.png",
  adaptiveIcon: "./src/brands/royal-jewellers/assets/images/adaptive_icon.png",
  
  // Company Information
  company: {
    name: "Royal Jewellers",
    address: "Main Street, Royal Building, Chennai, Tamil Nadu 600001",
    mobile: "+91 9876543210",
    email: "info@royaljewellers.com",
    website: "https://www.royaljewellers.com",
  },
  
  // Social Media
  socialMedia: {
    facebook: "https://facebook.com/royaljewellers",
    instagram: "https://instagram.com/royaljewellers",
    youtube: "https://youtube.com/royaljewellers",
  }
};
```

#### B. Theme Configuration (`src/brands/royal-jewellers/config/theme.js`)
```javascript
module.exports = {
  // Color Scheme
  colors: {
    primary: "#8B4513",
    secondary: "#FFD700",
    background: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#000000",
    // ... other colors
  },
  
  // Gradients
  gradients: {
    primary: ["#8B4513", "#2d3748"],
    secondary: ["#FFD700", "#ed8936"],
    background: ["#ffffff", "#f8f8f8"]
  },
  
  // Support Container
  support_container: ["#8B4513", "#2d3748", "#4a5568"]
};
```

### Step 3: Create Locale Files

#### English (`src/brands/royal-jewellers/locales/en.json`)
```json
{
  "brand": {
    "name": "Royal Jewellers",
    "tagline": "Premium Jewellery & Diamonds"
  },
  "company": {
    "name": "Royal Jewellers",
    "address": "Main Street, Royal Building, Chennai, Tamil Nadu 600001",
    "phone": "+91 9876543210",
    "email": "info@royaljewellers.com",
    "website": "https://www.royaljewellers.com"
  },
  "common": {
    "welcome": "Welcome to Royal Jewellers",
    "loading": "Loading...",
    "error": "Something went wrong",
    "success": "Success!"
  }
}
```

### Step 4: Create Brand Colors (`src/brands/royal-jewellers/assets/images/brand_colors.json`)
```json
{
  "brand": "royal-jewellers",
  "colors": {
    "primary": "#8B4513",
    "secondary": "#FFD700",
    "background": "#ffffff",
    "textPrimary": "#ffffff",
    "textSecondary": "#000000"
  },
  "gradients": {
    "primary": ["#8B4513", "#2d3748"],
    "secondary": ["#FFD700", "#ed8936"],
    "background": ["#ffffff", "#f8f8f8"]
  },
  "support_container": ["#8B4513", "#2d3748", "#4a5568"]
}
```

### Step 5: Update Main Brand Config
Add the new brand to `src/core/config/BrandConfig.js`:
```javascript
// Add to brands array
this.brands = ['dc-jewellers', 'akilajewellers', 'srimurugangoldhouse', 'royal-jewellers'];

// Add imports
const royaljewellersConfig = require('../../brands/royal-jewellers/config/app.config.js');
const royaljewellersTheme = require('../../brands/royal-jewellers/config/theme.js');

// Add to brandConfigs
const brandConfigs = {
  // ... existing brands
  'royal-jewellers': {
    config: royaljewellersConfig,
    theme: royaljewellersTheme,
  },
};
```

### Step 6: Create Switching Script (`switch-to-royal-jewellers.js`)
```javascript
const fs = require('fs');
const path = require('path');

const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');
let content = fs.readFileSync(brandConfigPath, 'utf8');

content = content.replace(
  /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '[^']+';/,
  "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || 'royal-jewellers';"
);

fs.writeFileSync(brandConfigPath, content);
console.log('✅ Brand switched to royal-jewellers');
console.log('🔄 Please restart the app to see the changes');
```

---

## ⚙️ Configuration Details

### Brand Configuration Structure
```
src/brands/royal-jewellers/
├── assets/images/
│   ├── logo.png              # Main brand logo
│   ├── logo_trans.png        # Transparent background logo
│   ├── splash_logo.png       # Splash screen logo
│   ├── adaptive_icon.png     # Android adaptive icon
│   ├── favicon.png          # Web favicon
│   └── brand_colors.json    # Brand color definitions
├── config/
│   ├── app.config.js        # App configuration
│   └── theme.js             # Theme configuration
└── locales/
    ├── en.json              # English translations
    ├── ta.json              # Tamil translations
    └── mal.json             # Malayalam translations
```

### Configuration Parameters

#### App Configuration
- **appName**: Display name of the app
- **appSlug**: URL-friendly name
- **androidPackage**: Android package identifier
- **iosBundleId**: iOS bundle identifier
- **projectId**: Expo project ID
- **owner**: Expo account owner
- **baseUrl**: API base URL
- **primaryColor**: Main brand color

#### Theme Configuration
- **colors**: Color palette
- **typography**: Font settings
- **spacing**: Layout spacing
- **borderRadius**: Corner radius values
- **shadows**: Shadow definitions
- **gradients**: Gradient definitions

#### Company Information
- **name**: Company name
- **address**: Physical address
- **mobile**: Contact number
- **email**: Email address
- **website**: Website URL

#### Social Media
- **facebook**: Facebook page URL
- **instagram**: Instagram profile URL
- **youtube**: YouTube channel URL

---

## 🎨 Asset Management

### Required Logo Files

#### 1. Main Logo (`logo.png`)
- **Size**: 512x512px (minimum)
- **Format**: PNG with transparent background
- **Usage**: App icon, header logos

#### 2. Transparent Logo (`logo_trans.png`)
- **Size**: 512x512px (minimum)
- **Format**: PNG with transparent background
- **Usage**: Overlays, watermarks

#### 3. Splash Logo (`splash_logo.png`)
- **Size**: 1024x1024px (minimum)
- **Format**: PNG with transparent background
- **Usage**: Splash screen, loading screens

#### 4. Adaptive Icon (`adaptive_icon.png`)
- **Size**: 1024x1024px (minimum)
- **Format**: PNG with transparent background
- **Usage**: Android adaptive icon

#### 5. Favicon (`favicon.png`)
- **Size**: 32x32px (minimum)
- **Format**: PNG or ICO
- **Usage**: Web favicon

### Asset Management Commands
```bash
# Update logo paths
node brand-asset-manager.js update-logo royal-jewellers logo "./src/brands/royal-jewellers/assets/images/logo.png"
node brand-asset-manager.js update-logo royal-jewellers splashLogo "./src/brands/royal-jewellers/assets/images/splash_logo.png"

# Update colors
node brand-asset-manager.js update-colors royal-jewellers primary "#8B4513"
node brand-asset-manager.js update-colors royal-jewellers secondary "#FFD700"

# Update base URL
node brand-asset-manager.js update-url royal-jewellers "https://api.royaljewellers.com"

# Copy assets from source directory
node brand-asset-manager.js copy-assets royal-jewellers "./path/to/logos/"
```

---

## 🧪 Testing & Verification

### Step 1: Switch to New Brand
```bash
# Switch to the new brand
node switch-to-royal-jewellers.js

# Or use the brand asset manager
node brand-asset-manager.js update-colors royal-jewellers primary "#8B4513"
```

### Step 2: Start the App
```bash
# Clear cache and start
npx expo start --clear
```

### Step 3: Verify Configuration
```bash
# Check brand information
node brand-asset-manager.js info royal-jewellers

# List all brands
node brand-asset-manager.js list

# Check current brand
node check-current-brand.js
```

### Step 4: Verification Checklist
- [ ] **App Name**: Displays correctly as "Royal Jewellers"
- [ ] **Primary Color**: Applied throughout the app
- [ ] **Splash Screen**: Shows new logo
- [ ] **App Icon**: Updated with new logo
- [ ] **Company Info**: Displays correctly
- [ ] **API Calls**: Use correct base URL
- [ ] **Translations**: Work in all languages
- [ ] **No Errors**: App starts without issues

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Brand Not Switching
```bash
# Check current brand
node check-current-brand.js

# Force switch
node switch-to-royal-jewellers.js
npx expo start --clear
```

#### 2. Logo Not Displaying
```bash
# Verify logo files exist
ls src/brands/royal-jewellers/assets/images/

# Update logo paths
node brand-asset-manager.js update-logo royal-jewellers logo "./src/brands/royal-jewellers/assets/images/logo.png"
```

#### 3. Colors Not Applied
```bash
# Update colors
node brand-asset-manager.js update-colors royal-jewellers primary "#8B4513"

# Check theme file
cat src/brands/royal-jewellers/config/theme.js
```

#### 4. API Errors
```bash
# Update base URL
node brand-asset-manager.js update-url royal-jewellers "https://api.royaljewellers.com"

# Check app config
cat src/brands/royal-jewellers/config/app.config.js
```

#### 5. Build Errors
```bash
# Clear cache
npx expo start --clear

# Check for syntax errors
node -c src/brands/royal-jewellers/config/app.config.js
node -c src/brands/royal-jewellers/config/theme.js
```

### Debug Commands
```bash
# Show all brands
node brand-asset-manager.js list

# Show brand info
node brand-asset-manager.js info royal-jewellers

# List brand assets
ls src/brands/royal-jewellers/assets/images/
```

---

## 📚 Best Practices

### 1. Brand Naming Convention
- Use kebab-case: `royal-jewellers`
- Keep it short and descriptive
- Avoid special characters

### 2. Color Selection
- **Primary Color**: Should be distinctive and brand-appropriate
- **Secondary Color**: Should complement the primary color
- **Contrast**: Ensure good readability on white/black backgrounds

### 3. Logo Requirements
- **High Resolution**: Minimum 512x512px for main logos
- **Transparent Background**: PNG format preferred
- **Simple Design**: Works well at small sizes
- **Brand Consistency**: Matches company branding

### 4. Configuration Management
- **Backup**: Keep copies of working configurations
- **Version Control**: Commit changes to git
- **Documentation**: Update setup instructions

### 5. Testing Strategy
- **Test on Multiple Devices**: Android and iOS
- **Test All Features**: Gold advance, savings, live rates
- **Test All Languages**: English, Tamil, Malayalam
- **Test API Integration**: Verify base URL works

### 6. Deployment Checklist
- [ ] All logo files added
- [ ] Colors configured correctly
- [ ] Company information updated
- [ ] API base URL configured
- [ ] Social media links working
- [ ] App tested on multiple devices
- [ ] All languages tested
- [ ] No console errors
- [ ] Performance acceptable

---

## 🚀 Quick Reference Commands

### Brand Creation
```bash
# Quick create
node next-customer-flow.js create royal-jewellers

# Interactive create
node next-customer-flow.js interactive
```

### Brand Management
```bash
# Switch brands
node switch-to-royal-jewellers.js
node switch-to-dc.js
node switch-to-akila.js

# Check current brand
node check-current-brand.js

# List all brands
node brand-asset-manager.js list
```

### Asset Management
```bash
# Update colors
node brand-asset-manager.js update-colors royal-jewellers primary "#8B4513"

# Update logo
node brand-asset-manager.js update-logo royal-jewellers logo "./path/to/logo.png"

# Update URL
node brand-asset-manager.js update-url royal-jewellers "https://api.royaljewellers.com"

# Show brand info
node brand-asset-manager.js info royal-jewellers
```

### App Management
```bash
# Start app
npx expo start --clear

# Build for Android
npx expo run:android

# Build for iOS
npx expo run:ios
```

---

## 📞 Support

For additional support:
1. Check the troubleshooting section
2. Review the brand asset management guide
3. Verify all configuration files
4. Test on different devices
5. Check console logs for errors

**Files Created:**
- `next-customer-flow.js` - Main automation script
- `NEXT_CUSTOMER_ADDITION_GUIDE.md` - This comprehensive guide
- `{brand-name}-setup-instructions.md` - Brand-specific instructions
- `switch-to-{brand-name}.js` - Brand switching script

This system provides a **complete, automated solution** for adding new customers to your multi-brand jewellery app! 