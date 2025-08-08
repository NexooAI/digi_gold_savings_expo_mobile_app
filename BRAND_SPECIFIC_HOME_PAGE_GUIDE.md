# 🎨 Brand-Specific Home Page System

## Overview

This system provides **separate home page designs** for different brands with **clean components** and **brand-specific styling** loaded from JSON configuration files.

## 🏗️ Architecture

### Core Components

1. **`BrandedHomePage.tsx`** - Main brand-specific home page component
2. **`brandStyles.ts`** - Utility functions for loading brand-specific styles
3. **`home-styles.json`** - Brand-specific styling configuration files
4. **`BrandConfig.js`** - Enhanced to include home styles

### File Structure

```
src/
├── components/
│   └── BrandedHomePage.tsx          # Main branded home page
├── utils/
│   └── brandStyles.ts               # Style utilities
├── brands/
│   ├── akilajewellers/
│   │   └── config/
│   │       └── home-styles.json     # Akila Jewellers styles
│   ├── dc-jewellers/
│   │   └── config/
│   │       └── home-styles.json     # DC Jewellers styles
│   └── srimurugangoldhouse/
│       └── config/
│           └── home-styles.json     # Srimurugan styles
└── core/config/
    └── BrandConfig.js               # Enhanced with home styles
```

## 🎯 Key Features

### ✅ **Clean Components**
- No inline styles in components
- All styling loaded from JSON configuration
- Reusable components with brand-specific props

### ✅ **Brand-Specific Styling**
- Different color schemes per brand
- Custom layouts and spacing
- Brand-specific animations
- Unique component styling

### ✅ **JSON-Driven Configuration**
- Easy to modify without code changes
- Centralized brand styling
- Version-controlled brand configurations

## 🎨 Brand Configurations

### Akila Jewellers
- **Primary Color**: `#1a2a39` (Dark Blue)
- **Secondary Color**: `#f6ad55` (Orange)
- **Theme**: Professional, modern, gold-focused

### DC Jewellers
- **Primary Color**: `#850111` (Deep Red)
- **Secondary Color**: `#ffc90c` (Gold)
- **Theme**: Traditional, premium, red-gold combination

### Srimurugan Gold House
- **Primary Color**: `#2d3748` (Dark Gray)
- **Secondary Color**: `#f6ad55` (Orange)
- **Theme**: Elegant, sophisticated, neutral tones

## 📝 Usage

### 1. Switch Brands

```bash
# Switch to Akila Jewellers
node switch-to-akilajewellers.js

# Switch to DC Jewellers
node switch-to-dc.js

# Switch to Srimurugan
node switch-to-srimurugan.js
```

### 2. Environment Variable

```bash
# Set brand via environment variable
export BRAND_NAME=akilajewellers
```

### 3. Runtime Brand Change

```javascript
import { setBrand } from '@/core/config/BrandConfig';

// Change brand at runtime
setBrand('dc-jewellers');
```

## 🔧 Configuration

### Home Styles JSON Structure

```json
{
  "homePage": {
    "background": {
      "image": "bg_login.jpg",
      "overlay": "rgba(255, 255, 255, 0.1)"
    },
    "userInfoCard": {
      "backgroundColor": "#1a2a39",
      "borderRadius": 20,
      "padding": 20,
      "shadow": {
        "color": "#1a2a39",
        "offset": { "width": 0, "height": 4 },
        "opacity": 0.3,
        "radius": 8,
        "elevation": 6
      },
      "text": {
        "welcome": {
          "color": "#ffffff",
          "fontSize": 16,
          "fontWeight": "400"
        }
      }
    },
    "components": {
      "flashBanner": {
        "backgroundColor": "rgba(26, 42, 57, 0.9)",
        "borderRadius": 12
      }
    },
    "animations": {
      "entrance": {
        "duration": 800,
        "easing": "cubic",
        "initialOpacity": 0,
        "finalOpacity": 1,
        "initialScale": 0.8,
        "finalScale": 1
      }
    }
  }
}
```

### Style Categories

1. **Background & Layout**
   - Background images
   - Overlay colors
   - Container styling

2. **User Info Card**
   - Colors and shadows
   - Text styling
   - Profile image styling

3. **Components**
   - Flash banners
   - Image sliders
   - Product lists
   - Social media cards
   - Support contact cards

4. **Animations**
   - Entrance animations
   - Transition effects
   - Timing configurations

## 🛠️ Development

### Adding New Brands

1. **Create brand directory**:
   ```
   src/brands/new-brand/
   ├── config/
   │   ├── app.config.js
   │   ├── theme.js
   │   └── home-styles.json
   └── assets/
       └── images/
   ```

2. **Add to BrandConfig.js**:
   ```javascript
   const newBrandConfig = require('../../brands/new-brand/config/app.config.js');
   const newBrandTheme = require('../../brands/new-brand/config/theme.js');
   const newBrandHomeStyles = require('../../brands/new-brand/config/home-styles.json');

   const brandConfigs = {
     'new-brand': {
       config: newBrandConfig,
       theme: newBrandTheme,
       homeStyles: newBrandHomeStyles,
     },
     // ... existing brands
   };
   ```

3. **Create brand switcher**:
   ```javascript
   // switch-to-new-brand.js
   const fs = require('fs');
   const path = require('path');

   const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');
   let content = fs.readFileSync(brandConfigPath, 'utf8');

   content = content.replace(
     /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '[^']+';/,
     "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || 'new-brand';"
   );

   fs.writeFileSync(brandConfigPath, content);
   console.log('✅ Brand switched to new-brand');
   ```

### Modifying Styles

1. **Edit JSON file** in brand's config directory
2. **Restart the app** to see changes
3. **No code changes required** for style updates

## 🎨 Style Customization

### Color Schemes

Each brand can define:
- Primary colors
- Secondary colors
- Text colors
- Background colors
- Shadow colors

### Component Styling

Components can be customized with:
- Background colors
- Border radius
- Shadows and elevation
- Margins and padding
- Text styling

### Animation Configuration

Animations can be configured with:
- Duration
- Easing functions
- Initial and final values
- Timing functions

## 🔍 Debugging

### Check Current Brand

```javascript
import { getCurrentBrand } from '@/core/config/BrandConfig';
console.log('Current brand:', getCurrentBrand());
```

### Verify Styles Loading

```javascript
import { brandHomeStyles } from '@/core/config/BrandConfig';
console.log('Loaded home styles:', brandHomeStyles);
```

### Test Brand Switching

```bash
# Test brand switching
node -e "require('./src/core/config/BrandConfig.js')"
```

## 📊 Benefits

### ✅ **Maintainability**
- Clean separation of concerns
- No inline styles
- Centralized configuration

### ✅ **Scalability**
- Easy to add new brands
- Consistent structure
- Reusable components

### ✅ **Flexibility**
- JSON-driven styling
- Runtime brand switching
- Environment-based configuration

### ✅ **Performance**
- Optimized style loading
- Memoized style creation
- Efficient brand switching

## 🚀 Best Practices

1. **Always use JSON configuration** for styling
2. **Keep components clean** without inline styles
3. **Test brand switching** thoroughly
4. **Document brand-specific features**
5. **Use consistent naming conventions**
6. **Version control brand configurations**

## 🔄 Migration Guide

### From Old Home Page

1. **Replace old home page** with `BrandedHomePage`
2. **Move inline styles** to JSON configuration
3. **Update component imports** to use new structure
4. **Test all brands** thoroughly

### Example Migration

```javascript
// Old way (inline styles)
const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#850111', // Hardcoded
    borderRadius: 20,
  }
});

// New way (JSON-driven)
const styles = useMemo(() => createBrandedStyles(theme), [theme]);
```

## 📝 Notes

- **No inline styles** in components
- **All styling** comes from JSON files
- **Brand switching** is instant
- **Animations** are configurable per brand
- **Components** are reusable across brands
- **Configuration** is version controlled

This system provides a **clean, maintainable, and scalable** approach to brand-specific home pages with **zero inline styles** and **complete JSON-driven configuration**. 