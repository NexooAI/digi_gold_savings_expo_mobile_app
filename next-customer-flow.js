const fs = require('fs');
const path = require('path');

class NextCustomerFlow {
  constructor() {
    this.brands = ['dc-jewellers', 'akilajewellers', 'srimurugangoldhouse'];
    this.templateDir = './src/brands/templates';
    this.credentialsDir = './credentials';
  }

  // Create new brand directory structure
  createNewBrand(brandName, brandConfig) {
    console.log(`\n🚀 Creating new brand: ${brandName}`);
    
    const brandPath = `./src/brands/${brandName}`;
    const dirs = [
      `${brandPath}/assets/images`,
      `${brandPath}/config`,
      `${brandPath}/locales`,
      `${this.credentialsDir}/${brandName}`
    ];

    // Create directories
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Create brand configuration files
    this.createBrandConfig(brandName, brandConfig);
    this.createBrandTheme(brandName, brandConfig);
    this.createBrandLocales(brandName, brandConfig);
    this.createBrandAssets(brandName, brandConfig);
    
    // Create Google Services configuration
    this.createGoogleServicesConfig(brandName, brandConfig);
    
    // Create credentials template
    this.createCredentialsTemplate(brandName, brandConfig);
    
    // Update main brand config
    this.updateMainBrandConfig(brandName);
    
    // Create switching script
    this.createSwitchingScript(brandName);
    
    console.log(`\n🎉 Brand "${brandName}" created successfully!`);
    console.log(`📁 Location: ${brandPath}`);
    console.log(`🔧 Next steps: Add logos, Google Services, and customize configurations`);
  }

  // Create Google Services configuration
  createGoogleServicesConfig(brandName, config) {
    const googleServicesPath = `${this.credentialsDir}/${brandName}/google-services.json`;
    const template = {
      "project_info": {
        "project_number": config.googleServices?.projectNumber || "000000000000",
        "project_id": config.googleServices?.projectId || `${brandName}-project`,
        "storage_bucket": `${config.googleServices?.projectId || brandName}-project.firebasestorage.app`
      },
      "client": [
        {
          "client_info": {
            "mobilesdk_app_id": config.googleServices?.mobileSdkAppId || `1:000000000000:android:${brandName.replace(/-/g, '')}`,
            "android_client_info": {
              "package_name": config.androidPackage
            }
          },
          "oauth_client": [],
          "api_key": [
            {
              "current_key": config.googleServices?.apiKey || "YOUR_GOOGLE_API_KEY_HERE"
            }
          ],
          "services": {
            "appinvite_service": {
              "other_platform_oauth_client": []
            }
          }
        }
      ],
      "configuration_version": "1"
    };

    fs.writeFileSync(googleServicesPath, JSON.stringify(template, null, 2));
    console.log(`✅ Created Google Services config: ${googleServicesPath}`);
  }

  // Create credentials template
  createCredentialsTemplate(brandName, config) {
    const credentialsPath = `${this.credentialsDir}/${brandName}/credentials.json`;
    const template = {
      "brand": brandName,
      "app_name": config.appName,
      "api_config": {
        "base_url": config.baseUrl,
        "api_key": "YOUR_API_KEY_HERE",
        "secret_key": "YOUR_SECRET_KEY_HERE"
      },
      "google_services": {
        "project_id": config.googleServices?.projectId || `${brandName}-project`,
        "api_key": config.googleServices?.apiKey || "YOUR_GOOGLE_API_KEY_HERE",
        "maps_api_key": config.googleMapsApiKey || "YOUR_MAPS_API_KEY_HERE",
        "firebase_config": {
          "api_key": "YOUR_FIREBASE_API_KEY_HERE",
          "auth_domain": `${brandName}.firebaseapp.com`,
          "project_id": `${brandName}-project`,
          "storage_bucket": `${brandName}-project.firebasestorage.app`,
          "messaging_sender_id": "000000000000",
          "app_id": `1:000000000000:android:${brandName.replace(/-/g, '')}`
        }
      },
      "payment_gateway": {
        "hypercheckout": {
          "merchant_id": "YOUR_MERCHANT_ID_HERE",
          "access_key": "YOUR_ACCESS_KEY_HERE",
          "secret_key": "YOUR_SECRET_KEY_HERE"
        }
      },
      "notification": {
        "fcm_server_key": "YOUR_FCM_SERVER_KEY_HERE",
        "fcm_sender_id": "000000000000"
      },
      "database": {
        "connection_string": "YOUR_DATABASE_CONNECTION_STRING_HERE"
      }
    };

    fs.writeFileSync(credentialsPath, JSON.stringify(template, null, 2));
    console.log(`✅ Created credentials template: ${credentialsPath}`);
  }

  // Create brand app configuration with enhanced Google Services support
  createBrandConfig(brandName, config) {
    const configPath = `./src/brands/${brandName}/config/app.config.js`;
    const template = `module.exports = {
  // App Identity
  appName: "${config.appName}",
  appSlug: "${config.appSlug}",
  version: "2.0.0",
  
  // Package/Bundle Identifiers
  androidPackage: "${config.androidPackage}",
  iosBundleId: "${config.iosBundleId}",
  
  // Project Configuration
  projectId: "${config.projectId}",
  owner: "${config.owner}",
  
  // API Configuration
  baseUrl: "${config.baseUrl}",
  youtubeUrl: "${config.youtubeUrl}",
  
  // Google Services Configuration
  googleServicesFile: "./credentials/${brandName}/google-services.json",
  googleMapsApiKey: "${config.googleMapsApiKey || 'YOUR_MAPS_API_KEY_HERE'}",
  googleServices: {
    projectId: "${config.googleServices?.projectId || `${brandName}-project`}",
    apiKey: "${config.googleServices?.apiKey || 'YOUR_GOOGLE_API_KEY_HERE'}",
    projectNumber: "${config.googleServices?.projectNumber || '000000000000'}",
    mobileSdkAppId: "${config.googleServices?.mobileSdkAppId || `1:000000000000:android:${brandName.replace(/-/g, '')}`}"
  },
  
  // Credentials Configuration
  credentials: {
    file: "./credentials/${brandName}/credentials.json",
    apiKey: "YOUR_API_KEY_HERE",
    secretKey: "YOUR_SECRET_KEY_HERE",
    paymentGateway: {
      merchantId: "YOUR_MERCHANT_ID_HERE",
      accessKey: "YOUR_ACCESS_KEY_HERE",
      secretKey: "YOUR_SECRET_KEY_HERE"
    },
    notification: {
      fcmServerKey: "YOUR_FCM_SERVER_KEY_HERE",
      fcmSenderId: "000000000000"
    }
  },
  
  // Brand Colors and Assets
  primaryColor: "${config.primaryColor}",
  splashLogo: "./src/brands/${brandName}/assets/images/splash_logo.png",
  adaptiveIcon: "./src/brands/${brandName}/assets/images/adaptive_icon.png",
  logo: "./src/brands/${brandName}/assets/images/logo.png",
  logoTrans: "./src/brands/${brandName}/assets/images/logo_trans.png",
  favicon: "./src/brands/${brandName}/assets/images/favicon.png",
  
  // Brand Assets Configuration
  assets: {
    logo: "./src/brands/${brandName}/assets/images/logo.png",
    logoTrans: "./src/brands/${brandName}/assets/images/logo_trans.png",
    splashLogo: "./src/brands/${brandName}/assets/images/splash_logo.png",
    adaptiveIcon: "./src/brands/${brandName}/assets/images/adaptive_icon.png",
    favicon: "./src/brands/${brandName}/assets/images/favicon.png",
    brandColors: "./src/brands/${brandName}/assets/images/brand_colors.json"
  },
  
  // Company Information
  company: {
    name: "${config.company.name}",
    address: "${config.company.address}",
    mobile: "${config.company.mobile}",
    email: "${config.company.email}",
    website: "${config.company.website}",
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
  
  // Social Media
  socialMedia: {
    facebook: "${config.socialMedia.facebook}",
    instagram: "${config.socialMedia.instagram}",
    youtube: "${config.socialMedia.youtube}",
  }
};`;

    fs.writeFileSync(configPath, template);
    console.log(`✅ Created app config: ${configPath}`);
  }

  // Create brand theme configuration
  createBrandTheme(brandName, config) {
    const themePath = `./src/brands/${brandName}/config/theme.js`;
    const template = `module.exports = {
  // Color Scheme
  colors: {
    primary: "${config.primaryColor}",
    secondary: "${config.secondaryColor || '#f6ad55'}",
    background: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#000000",
    border: "#cccccc",
    inputBackground: "rgba(255, 255, 255, 0.2)",
    error: "#ff4d4f",
    success: "#4CAF50",
    link: "${config.secondaryColor || '#f6ad55'}",
    textDark: "#1a202c",
    white: "#ffffff",
    black: "#000000",
    textLight: "#ffffff",
    textGrey: "#808080",
    grey: "#808080",
    lightGrey: "#f0f0f0",
    darkGrey: "#808080",
    lightBlack: "#000000"
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: "System",
      secondary: "System",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
    },
    fontWeight: {
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
    base: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  
  // Gradients
  gradients: {
    primary: ["${config.primaryColor}", "#2d3748"],
    secondary: ["${config.secondaryColor || '#f6ad55'}", "#ed8936"],
    background: ["#ffffff", "#f8f8f8"]
  },
  
  // Support Container
  support_container: ["${config.primaryColor}", "#2d3748", "#4a5568"]
};`;

    fs.writeFileSync(themePath, template);
    console.log(`✅ Created theme config: ${themePath}`);
  }

  // Create brand locales
  createBrandLocales(brandName, config) {
    const locales = ['en', 'ta', 'mal'];
    
    locales.forEach(locale => {
      const localePath = `./src/brands/${brandName}/locales/${locale}.json`;
      const template = {
        brand: {
          name: config.appName,
          tagline: config.tagline || "Premium Jewellery & Diamonds"
        },
        company: {
          name: config.company.name,
          address: config.company.address,
          phone: config.company.mobile,
          email: config.company.email,
          website: config.company.website
        },
        common: {
          welcome: "Welcome to " + config.appName,
          loading: "Loading...",
          error: "Something went wrong",
          success: "Success!",
          cancel: "Cancel",
          save: "Save",
          delete: "Delete",
          edit: "Edit",
          view: "View"
        }
      };
      
      fs.writeFileSync(localePath, JSON.stringify(template, null, 2));
      console.log(`✅ Created locale: ${localePath}`);
    });
  }

  // Create brand assets
  createBrandAssets(brandName, config) {
    const colorsPath = `./src/brands/${brandName}/assets/images/brand_colors.json`;
    const colorsData = {
      brand: brandName,
      colors: {
        primary: config.primaryColor,
        secondary: config.secondaryColor || "#f6ad55",
        background: "#ffffff",
        textPrimary: "#ffffff",
        textSecondary: "#000000"
      },
      gradients: {
        primary: [config.primaryColor, "#2d3748"],
        secondary: [config.secondaryColor || "#f6ad55", "#ed8936"],
        background: ["#ffffff", "#f8f8f8"]
      },
      support_container: [config.primaryColor, "#2d3748", "#4a5568"]
    };
    
    fs.writeFileSync(colorsPath, JSON.stringify(colorsData, null, 2));
    console.log(`✅ Created brand colors: ${colorsPath}`);
  }

  // Update main brand config to include new brand
  updateMainBrandConfig(brandName) {
    const brandConfigPath = './src/core/config/BrandConfig.js';
    let content = fs.readFileSync(brandConfigPath, 'utf8');
    
    // Add new brand to brands array
    const brandsRegex = /this\.brands = \[([^\]]+)\];/;
    const match = content.match(brandsRegex);
    if (match) {
      const brands = match[1].split(',').map(b => b.trim().replace(/['"]/g, ''));
      if (!brands.includes(brandName)) {
        brands.push(`'${brandName}'`);
        content = content.replace(brandsRegex, `this.brands = [${brands.join(', ')}];`);
      }
    }
    
    // Add brand config import
    const importRegex = /const (\w+)Config = require\('\.\.\/\.\.\/brands\/(\w+)\/config\/app\.config\.js'\);/g;
    const newImport = `const ${brandName.replace(/-/g, '')}Config = require('../../brands/${brandName}/config/app.config.js');`;
    content = content.replace(importRegex, `$&\n${newImport}`);
    
    // Add brand theme import
    const themeImportRegex = /const (\w+)Theme = require\('\.\.\/\.\.\/brands\/(\w+)\/config\/theme\.js'\);/g;
    const newThemeImport = `const ${brandName.replace(/-/g, '')}Theme = require('../../brands/${brandName}/config/theme.js');`;
    content = content.replace(themeImportRegex, `$&\n${newThemeImport}`);
    
    // Add to brandConfigs object
    const configsRegex = /const brandConfigs = \{([^}]+)\};/;
    const configsMatch = content.match(configsRegex);
    if (configsMatch) {
      const newConfig = `\n  '${brandName}': {\n    config: ${brandName.replace(/-/g, '')}Config,\n    theme: ${brandName.replace(/-/g, '')}Theme,\n  },`;
      content = content.replace(configsRegex, `const brandConfigs = {${configsMatch[1]}${newConfig}};`);
    }
    
    fs.writeFileSync(brandConfigPath, content);
    console.log(`✅ Updated main brand config to include ${brandName}`);
  }

  // Create switching script for new brand
  createSwitchingScript(brandName) {
    const scriptPath = `switch-to-${brandName}.js`;
    const template = `const fs = require('fs');
const path = require('path');

const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');
let content = fs.readFileSync(brandConfigPath, 'utf8');

// Update the default brand
content = content.replace(
  /let BRAND_NAME = process\\.env\\.BRAND_NAME \\|\\| global\\.BRAND_NAME \\|\\| '[^']+';/,
  "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || '${brandName}';"
);

fs.writeFileSync(brandConfigPath, content);
console.log('✅ Brand switched to ${brandName}');
console.log('🔄 Please restart the app to see the changes');`;

    fs.writeFileSync(scriptPath, template);
    console.log(`✅ Created switching script: ${scriptPath}`);
  }

  // Generate setup instructions
  generateSetupInstructions(brandName, config) {
    const instructions = `
# 🎯 Setup Instructions for ${config.appName}

## 📋 Pre-requisites
- Logo files (PNG format recommended)
- Brand colors
- Company information
- API endpoints

## 🛠️ Setup Steps

### 1. Add Logo Files
Copy your logo files to: \`src/brands/${brandName}/assets/images/\`
- logo.png (Main brand logo)
- logo_trans.png (Transparent background)
- splash_logo.png (Splash screen logo)
- adaptive_icon.png (Android adaptive icon)
- favicon.png (Web favicon)

### 2. Update Brand Colors
\`\`\`bash
node brand-asset-manager.js update-colors ${brandName} primary "${config.primaryColor}"
node brand-asset-manager.js update-colors ${brandName} secondary "${config.secondaryColor || '#f6ad55'}"
\`\`\`

### 3. Update Base URL
\`\`\`bash
node brand-asset-manager.js update-url ${brandName} "${config.baseUrl}"
\`\`\`

### 4. Switch to New Brand
\`\`\`bash
node switch-to-${brandName}.js
npx expo start --clear
\`\`\`

### 5. Verify Configuration
\`\`\`bash
node brand-asset-manager.js info ${brandName}
\`\`\`

## 📁 File Structure Created
\`\`\`
src/brands/${brandName}/
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
\`\`\`

## 🎨 Brand Configuration
- **App Name**: ${config.appName}
- **Primary Color**: ${config.primaryColor}
- **Base URL**: ${config.baseUrl}
- **Package**: ${config.androidPackage}
- **Location**: ${config.company.address}

## 🔧 Customization Points
1. **Colors**: Edit \`src/brands/${brandName}/config/theme.js\`
2. **App Config**: Edit \`src/brands/${brandName}/config/app.config.js\`
3. **Translations**: Edit \`src/brands/${brandName}/locales/\`
4. **Assets**: Replace logo files in \`src/brands/${brandName}/assets/images/\`

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

For support, refer to: \`BRAND_MANAGEMENT_COMMANDS.md\`
`;

    const instructionsPath = `${brandName}-setup-instructions.md`;
    fs.writeFileSync(instructionsPath, instructions);
    console.log(`📄 Created setup instructions: ${instructionsPath}`);
    
    return instructions;
  }

  // Interactive brand creation
  async createBrandInteractive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    console.log('\n🎯 Next Customer Addition Flow');
    console.log('==============================\n');

    const brandName = await question('Enter brand name (e.g., new-jewellers): ');
    const appName = await question('Enter app name (e.g., New Jewellers): ');
    const primaryColor = await question('Enter primary color (e.g., #1a2a39): ');
    const secondaryColor = await question('Enter secondary color (e.g., #f6ad55): ');
    const baseUrl = await question('Enter API base URL (e.g., https://api.newjewellers.com): ');
    const companyName = await question('Enter company name: ');
    const companyAddress = await question('Enter company address: ');
    const companyMobile = await question('Enter company mobile: ');
    const companyEmail = await question('Enter company email: ');
    const companyWebsite = await question('Enter company website: ');
    const facebook = await question('Enter Facebook URL: ');
    const instagram = await question('Enter Instagram URL: ');
    const youtube = await question('Enter YouTube URL: ');

    const config = {
      appName,
      appSlug: brandName.replace(/-/g, '-'),
      androidPackage: `com.nexooai.${brandName.replace(/-/g, '')}`,
      iosBundleId: `com.nexooai.${brandName.replace(/-/g, '')}`,
      projectId: `${brandName}-project-id`,
      owner: `${brandName}owner`,
      baseUrl,
      youtubeUrl: `https://youtu.be/${brandName}-video`,
      primaryColor,
      secondaryColor,
      company: {
        name: companyName,
        address: companyAddress,
        mobile: companyMobile,
        email: companyEmail,
        website: companyWebsite
      },
      socialMedia: {
        facebook,
        instagram,
        youtube
      }
    };

    rl.close();

    this.createNewBrand(brandName, config);
    this.generateSetupInstructions(brandName, config);
  }
}

// CLI Interface
const flow = new NextCustomerFlow();

const command = process.argv[2];

switch (command) {
  case 'create':
    const brandName = process.argv[3];
    if (brandName) {
      // Quick create with default config
      const config = {
        appName: brandName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        appSlug: brandName,
        androidPackage: `com.nexooai.${brandName.replace(/-/g, '')}`,
        iosBundleId: `com.nexooai.${brandName.replace(/-/g, '')}`,
        projectId: `${brandName}-project-id`,
        owner: `${brandName}owner`,
        baseUrl: `https://api.prod.${brandName}.org`,
        youtubeUrl: `https://youtu.be/${brandName}-video`,
        primaryColor: "#1a2a39",
        secondaryColor: "#f6ad55",
        company: {
          name: brandName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          address: "Main Street, Building, City, State 000000",
          mobile: "+91 9876543210",
          email: `info@${brandName}.com`,
          website: `https://www.${brandName}.com`
        },
        socialMedia: {
          facebook: `https://facebook.com/${brandName}`,
          instagram: `https://instagram.com/${brandName}`,
          youtube: `https://youtube.com/${brandName}`
        }
      };
      
      flow.createNewBrand(brandName, config);
      flow.generateSetupInstructions(brandName, config);
    } else {
      console.log('Usage: node next-customer-flow.js create <brand-name>');
    }
    break;
    
  case 'interactive':
    flow.createBrandInteractive();
    break;
    
  default:
    console.log(`
🎯 Next Customer Addition Flow

Usage:
  node next-customer-flow.js create <brand-name>     - Quick create with defaults
  node next-customer-flow.js interactive             - Interactive creation

Examples:
  node next-customer-flow.js create royal-jewellers
  node next-customer-flow.js interactive

This will create:
✅ Brand directory structure
✅ Configuration files
✅ Theme files
✅ Locale files
✅ Switching script
✅ Setup instructions
    `);
} 