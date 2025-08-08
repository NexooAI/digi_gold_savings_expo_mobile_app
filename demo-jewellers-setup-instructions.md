
# 🎯 Setup Instructions for Demo Jewellers

## 📋 Pre-requisites
- Logo files (PNG format recommended)
- Brand colors
- Company information
- API endpoints

## 🛠️ Setup Steps

### 1. Add Logo Files
Copy your logo files to: `src/brands/demo-jewellers/assets/images/`
- logo.png (Main brand logo)
- logo_trans.png (Transparent background)
- splash_logo.png (Splash screen logo)
- adaptive_icon.png (Android adaptive icon)
- favicon.png (Web favicon)

### 2. Update Brand Colors
```bash
node brand-asset-manager.js update-colors demo-jewellers primary "#1a2a39"
node brand-asset-manager.js update-colors demo-jewellers secondary "#f6ad55"
```

### 3. Update Base URL
```bash
node brand-asset-manager.js update-url demo-jewellers "https://api.prod.demo-jewellers.org"
```

### 4. Switch to New Brand
```bash
node switch-to-demo-jewellers.js
npx expo start --clear
```

### 5. Verify Configuration
```bash
node brand-asset-manager.js info demo-jewellers
```

## 📁 File Structure Created
```
src/brands/demo-jewellers/
├── assets/images/
│   ├── logo.png (ADD YOUR LOGO)
│   ├── logo_trans.png (ADD YOUR LOGO)
│   ├── splash_logo.png (ADD YOUR LOGO)
│   ├── adaptive_icon.png (ADD YOUR LOGO)
│   ├── favicon.png (ADD YOUR LOGO)
│   └── brand_colors.json
├── config/
│   ├── app.config.js
│   └── theme.js
└── locales/
    ├── en.json
    ├── ta.json
    └── mal.json
```

## 🎨 Brand Configuration
- **App Name**: Demo Jewellers
- **Primary Color**: #1a2a39
- **Base URL**: https://api.prod.demo-jewellers.org
- **Package**: com.nexooai.demojewellers
- **Location**: Main Street, Building, City, State 000000

## 🔧 Customization Points
1. **Colors**: Edit `src/brands/demo-jewellers/config/theme.js`
2. **App Config**: Edit `src/brands/demo-jewellers/config/app.config.js`
3. **Translations**: Edit `src/brands/demo-jewellers/locales/`
4. **Assets**: Replace logo files in `src/brands/demo-jewellers/assets/images/`

## ✅ Verification Checklist
- [ ] Logo files added
- [ ] Colors updated
- [ ] Base URL configured
- [ ] Brand switched successfully
- [ ] App starts without errors
- [ ] Brand name displays correctly
- [ ] Primary color applied
- [ ] Splash screen shows new logo

## 🚀 Next Steps
1. Add your logo files
2. Customize colors if needed
3. Update company information
4. Test the app
5. Deploy to production

For support, refer to: `BRAND_MANAGEMENT_COMMANDS.md`
