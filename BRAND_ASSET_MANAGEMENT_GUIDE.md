# Brand Asset Management Guide

## 📁 **Brand Asset Structure**

```
src/brands/
├── dc-jewellers/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   ├── logo_trans.png
│   │   │   ├── splash_logo.png
│   │   │   ├── adaptive_icon.png
│   │   │   ├── favicon.png
│   │   │   └── brand_colors.json
│   │   └── config/
│   │       ├── app.config.js
│   │       └── theme.js
│   └── locales/
│       ├── en.json
│       ├── ta.json
│       └── mal.json
├── akilajewellers/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   ├── logo_trans.png
│   │   │   ├── splash_logo.png
│   │   │   ├── adaptive_icon.png
│   │   │   ├── favicon.png
│   │   │   └── brand_colors.json
│   │   └── config/
│   │       ├── app.config.js
│   │       └── theme.js
│   └── locales/
│       ├── en.json
│       ├── ta.json
│       └── mal.json
└── srimurugangoldhouse/
    ├── assets/
    │   ├── images/
    │   │   ├── logo.png
    │   │   ├── logo_trans.png
    │   │   ├── splash_logo.png
    │   │   ├── adaptive_icon.png
    │   │   ├── favicon.png
    │   │   └── brand_colors.json
    │   └── config/
    │       ├── app.config.js
    │       └── theme.js
    └── locales/
        ├── en.json
        ├── ta.json
        └── mal.json
```

## 🎨 **Brand Color Management**

### **DC Jewellers Colors**
```json
{
  "primary": "#850111",
  "secondary": "#f6ad55",
  "background": "#ffffff",
  "textPrimary": "#ffffff",
  "textSecondary": "#000000"
}
```

### **Akila Jewellers Colors**
```json
{
  "primary": "#1a2a39",
  "secondary": "#f6ad55",
  "background": "#ffffff",
  "textPrimary": "#ffffff",
  "textSecondary": "#000000"
}
```

### **Srimurugan Gold House Colors**
```json
{
  "primary": "#8B4513",
  "secondary": "#FFD700",
  "background": "#ffffff",
  "textPrimary": "#ffffff",
  "textSecondary": "#000000"
}
```

## 🔧 **Configuration Management**

### **App Configuration (app.config.js)**
- App Name
- Package/Bundle IDs
- Base URLs
- Project IDs
- Company Information
- Feature Flags

### **Theme Configuration (theme.js)**
- Color Schemes
- Typography
- Spacing
- Border Radius
- Shadows

## 📱 **Logo Management**

### **Required Logo Files per Brand**
1. `logo.png` - Main brand logo
2. `logo_trans.png` - Transparent background logo
3. `splash_logo.png` - Splash screen logo
4. `adaptive_icon.png` - Android adaptive icon
5. `favicon.png` - Web favicon

## 🔄 **Brand Switching Process**

### **1. Update Brand Configuration**
```bash
node switch-to-akila.js
node switch-to-dc.js
node switch-to-srimurugan.js
```

### **2. Update Assets**
- Copy brand-specific logos to `src/brands/{brand}/assets/images/`
- Update color schemes in `theme.js`
- Update app configuration in `app.config.js`

### **3. Update Base URLs**
- DC Jewellers: `https://api.prod.dcjewellers.org`
- Akila Jewellers: `https://api.prod.akilajewellers.org`
- Srimurugan: `https://api.prod.srimurugangoldhouse.org`

## 🛠️ **Implementation Steps**

### **Step 1: Create Brand Asset Directories**
```bash
mkdir -p src/brands/dc-jewellers/assets/images
mkdir -p src/brands/akilajewellers/assets/images
mkdir -p src/brands/srimurugangoldhouse/assets/images
```

### **Step 2: Add Brand-Specific Logos**
- Copy logo files to respective brand directories
- Ensure proper naming convention
- Optimize images for mobile

### **Step 3: Update Configuration Files**
- Update `app.config.js` with brand-specific settings
- Update `theme.js` with brand colors
- Update locales with brand-specific text

### **Step 4: Test Brand Switching**
```bash
node check-current-brand.js
npx expo start --clear
```

## 📋 **Brand-Specific Requirements**

### **DC Jewellers**
- Primary Color: `#850111` (Deep Red)
- Location: Thrissur, Kerala
- Contact: +91 9061803999

### **Akila Jewellers**
- Primary Color: `#1a2a39` (Dark Navy)
- Location: Chennai, Tamil Nadu
- Contact: +91 9876543210

### **Srimurugan Gold House**
- Primary Color: `#8B4513` (Saddle Brown)
- Location: Madurai, Tamil Nadu
- Contact: +91 8765432109 