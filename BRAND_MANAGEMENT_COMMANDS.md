# Brand Management Commands Quick Reference

## 🎯 **Complete Solution for Brand Asset Management**

### **1. Brand Switching Commands**

```bash
# Switch to Akila Jewellers
node switch-to-akila.js
npx expo start --clear

# Switch to DC Jewellers  
node switch-to-dc.js
npx expo start --clear

# Switch to Srimurugan Gold House
node switch-to-srimurugan.js
npx expo start --clear

# Check current brand
node check-current-brand.js
```

### **2. Brand Asset Manager Commands**

```bash
# List all brands
node brand-asset-manager.js list

# Show brand information
node brand-asset-manager.js info akilajewellers
node brand-asset-manager.js info dc-jewellers
node brand-asset-manager.js info srimurugangoldhouse

# Update brand colors
node brand-asset-manager.js update-colors akilajewellers primary "#1a2a39"
node brand-asset-manager.js update-colors dc-jewellers primary "#850111"
node brand-asset-manager.js update-colors srimurugangoldhouse primary "#8B4513"

# Update base URL
node brand-asset-manager.js update-url akilajewellers "https://api.akila.com"
node brand-asset-manager.js update-url dc-jewellers "https://api.dc.com"
node brand-asset-manager.js update-url srimurugangoldhouse "https://api.srimurugan.com"

# Update logo paths
node brand-asset-manager.js update-logo akilajewellers logo "./new-logo.png"
node brand-asset-manager.js update-logo akilajewellers splashLogo "./new-splash.png"

# Copy assets from source directory
node brand-asset-manager.js copy-assets akilajewellers "./path/to/logos/"
```

### **3. Asset Structure**

```
src/brands/
├── akilajewellers/
│   ├── assets/images/
│   │   ├── logo.png
│   │   ├── logo_trans.png
│   │   ├── splash_logo.png
│   │   ├── adaptive_icon.png
│   │   ├── favicon.png
│   │   └── brand_colors.json
│   ├── config/
│   │   ├── app.config.js
│   │   └── theme.js
│   └── locales/
│       ├── en.json
│       ├── ta.json
│       └── mal.json
```

### **4. Brand-Specific Configurations**

#### **Akila Jewellers**
- **Primary Color**: `#1a2a39` (Dark Navy)
- **Base URL**: `https://api.prod.akilajewellers.org`
- **Package**: `com.nexooai.akilajewellery`
- **Location**: Chennai, Tamil Nadu

#### **DC Jewellers**
- **Primary Color**: `#850111` (Deep Red)
- **Base URL**: `https://api.prod.dcjewellers.org`
- **Package**: `com.nexooai.dcjewellery`
- **Location**: Thrissur, Kerala

#### **Srimurugan Gold House**
- **Primary Color**: `#8B4513` (Saddle Brown)
- **Base URL**: `https://api.prod.srimurugangoldhouse.org`
- **Package**: `com.nexooai.srimurugangoldhouse`
- **Location**: Madurai, Tamil Nadu

### **5. How to Change Brand Assets**

#### **Step 1: Add Logo Files**
```bash
# Copy your logo files to the brand directory
cp your-logo.png src/brands/akilajewellers/assets/images/logo.png
cp your-splash.png src/brands/akilajewellers/assets/images/splash_logo.png
cp your-icon.png src/brands/akilajewellers/assets/images/adaptive_icon.png
```

#### **Step 2: Update Configuration**
```bash
# Update logo paths in config
node brand-asset-manager.js update-logo akilajewellers logo "./src/brands/akilajewellers/assets/images/logo.png"
node brand-asset-manager.js update-logo akilajewellers splashLogo "./src/brands/akilajewellers/assets/images/splash_logo.png"
```

#### **Step 3: Update Colors**
```bash
# Update primary color
node brand-asset-manager.js update-colors akilajewellers primary "#1a2a39"
```

#### **Step 4: Update Base URL**
```bash
# Update API base URL
node brand-asset-manager.js update-url akilajewellers "https://api.akila.com"
```

#### **Step 5: Restart App**
```bash
# Restart to see changes
npx expo start --clear
```

### **6. Complete Workflow Example**

```bash
# 1. Switch to Akila brand
node switch-to-akila.js

# 2. Update Akila colors
node brand-asset-manager.js update-colors akilajewellers primary "#1a2a39"
node brand-asset-manager.js update-colors akilajewellers secondary "#f6ad55"

# 3. Update Akila base URL
node brand-asset-manager.js update-url akilajewellers "https://api.akila.com"

# 4. Add Akila logos (copy files first)
node brand-asset-manager.js update-logo akilajewellers logo "./src/brands/akilajewellers/assets/images/akila-logo.png"

# 5. Check configuration
node brand-asset-manager.js info akilajewellers

# 6. Start app
npx expo start --clear
```

### **7. Troubleshooting**

#### **Check Current Brand**
```bash
node check-current-brand.js
```

#### **Verify Brand Configuration**
```bash
node brand-asset-manager.js info akilajewellers
```

#### **List Brand Assets**
```bash
node brand-asset-manager.js list
```

#### **Reset to Default**
```bash
node switch-to-dc.js
npx expo start --clear
```

### **8. File Locations**

- **Brand Configs**: `src/brands/{brand}/config/`
- **Brand Assets**: `src/brands/{brand}/assets/images/`
- **Brand Locales**: `src/brands/{brand}/locales/`
- **Main Config**: `src/core/config/BrandConfig.js`
- **App Config**: `app.config.js`

This system provides a **complete solution** for managing multiple brands with different logos, colors, and configurations! 