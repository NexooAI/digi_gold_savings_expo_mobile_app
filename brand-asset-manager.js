const fs = require('fs');
const path = require('path');

class BrandAssetManager {
  constructor() {
    this.brands = ['dc-jewellers', 'akilajewellers', 'srimurugangoldhouse'];
    this.brandConfigs = {};
    this.loadBrandConfigs();
  }

  // Load all brand configurations
  loadBrandConfigs() {
    this.brands.forEach(brand => {
      try {
        const configPath = `./src/brands/${brand}/config/app.config.js`;
        const themePath = `./src/brands/${brand}/config/theme.js`;
        
        if (fs.existsSync(configPath)) {
          this.brandConfigs[brand] = {
            config: require(`./src/brands/${brand}/config/app.config.js`),
            theme: require(`./src/brands/${brand}/config/theme.js`)
          };
        }
      } catch (error) {
        console.log(`⚠️ Warning: Could not load config for ${brand}`);
      }
    });
  }

  // Get current brand
  getCurrentBrand() {
    const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');
    const content = fs.readFileSync(brandConfigPath, 'utf8');
    const brandMatch = content.match(/let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '([^']+)';/);
    return brandMatch ? brandMatch[1] : 'dc-jewellers';
  }

  // Update brand logo
  updateBrandLogo(brandName, logoType, newLogoPath) {
    const brandConfig = this.brandConfigs[brandName];
    if (!brandConfig) {
      console.error(`❌ Brand config not found for: ${brandName}`);
      return false;
    }

    const configPath = `./src/brands/${brandName}/config/app.config.js`;
    let content = fs.readFileSync(configPath, 'utf8');

    // Update the specific logo path
    const logoPathRegex = new RegExp(`(${logoType}:\\s*)"[^"]*"`, 'g');
    content = content.replace(logoPathRegex, `$1"${newLogoPath}"`);

    fs.writeFileSync(configPath, content);
    console.log(`✅ Updated ${logoType} for ${brandName} to: ${newLogoPath}`);
    return true;
  }

  // Update brand colors
  updateBrandColors(brandName, newColors) {
    const themePath = `./src/brands/${brandName}/config/theme.js`;
    const colorsPath = `./src/brands/${brandName}/assets/images/brand_colors.json`;

    // Update theme.js
    let themeContent = fs.readFileSync(themePath, 'utf8');
    Object.keys(newColors).forEach(colorKey => {
      const colorRegex = new RegExp(`(${colorKey}:\\s*)"[^"]*"`, 'g');
      themeContent = themeContent.replace(colorRegex, `$1"${newColors[colorKey]}"`);
    });
    fs.writeFileSync(themePath, themeContent);

    // Update brand_colors.json
    const colorsData = {
      brand: brandName,
      colors: newColors,
      gradients: {
        primary: [newColors.primary, "#2d3748"],
        secondary: [newColors.secondary || "#f6ad55", "#ed8936"],
        background: ["#ffffff", "#f8f8f8"]
      },
      support_container: [newColors.primary, "#2d3748", "#4a5568"]
    };
    fs.writeFileSync(colorsPath, JSON.stringify(colorsData, null, 2));

    console.log(`✅ Updated colors for ${brandName}`);
    return true;
  }

  // Update base URL
  updateBaseUrl(brandName, newBaseUrl) {
    const configPath = `./src/brands/${brandName}/config/app.config.js`;
    let content = fs.readFileSync(configPath, 'utf8');
    
    const urlRegex = /(baseUrl:\s*)"[^"]*"/g;
    content = content.replace(urlRegex, `$1"${newBaseUrl}"`);
    
    fs.writeFileSync(configPath, content);
    console.log(`✅ Updated base URL for ${brandName} to: ${newBaseUrl}`);
    return true;
  }

  // Copy assets from source to brand directory
  copyBrandAssets(brandName, sourceDir) {
    const brandAssetsDir = `./src/brands/${brandName}/assets/images`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(brandAssetsDir)) {
      fs.mkdirSync(brandAssetsDir, { recursive: true });
    }

    // Copy all files from source directory
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(brandAssetsDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📁 Copied ${file} to ${brandName}`);
    });

    return true;
  }

  // List all brand assets
  listBrandAssets(brandName) {
    const assetsDir = `./src/brands/${brandName}/assets/images`;
    
    if (!fs.existsSync(assetsDir)) {
      console.log(`❌ No assets directory found for ${brandName}`);
      return [];
    }

    const files = fs.readdirSync(assetsDir);
    console.log(`📁 Assets for ${brandName}:`);
    files.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
    });

    return files;
  }

  // Show brand information
  showBrandInfo(brandName) {
    const brandConfig = this.brandConfigs[brandName];
    if (!brandConfig) {
      console.log(`❌ Brand config not found for: ${brandName}`);
      return;
    }

    console.log(`\n🏪 Brand Information: ${brandName.toUpperCase()}`);
    console.log(`📱 App Name: ${brandConfig.config.appName}`);
    console.log(`🎨 Primary Color: ${brandConfig.config.primaryColor}`);
    console.log(`🌐 Base URL: ${brandConfig.config.baseUrl}`);
    console.log(`📦 Package: ${brandConfig.config.androidPackage}`);
    console.log(`📍 Location: ${brandConfig.config.company.address}`);
    console.log(`📞 Contact: ${brandConfig.config.company.mobile}`);
    
    // List assets
    this.listBrandAssets(brandName);
  }

  // Show all brands
  showAllBrands() {
    console.log('\n📋 Available Brands:');
    this.brands.forEach(brand => {
      const isCurrent = this.getCurrentBrand() === brand;
      console.log(`  ${isCurrent ? '✅' : '  '} ${brand}${isCurrent ? ' (CURRENT)' : ''}`);
    });
  }
}

// CLI Interface
const manager = new BrandAssetManager();

const command = process.argv[2];
const brand = process.argv[3];

switch (command) {
  case 'list':
    manager.showAllBrands();
    break;
    
  case 'info':
    if (brand) {
      manager.showBrandInfo(brand);
    } else {
      manager.showBrandInfo(manager.getCurrentBrand());
    }
    break;
    
  case 'update-logo':
    const logoType = process.argv[4];
    const logoPath = process.argv[5];
    if (brand && logoType && logoPath) {
      manager.updateBrandLogo(brand, logoType, logoPath);
    } else {
      console.log('Usage: node brand-asset-manager.js update-logo <brand> <logoType> <path>');
    }
    break;
    
  case 'update-colors':
    const colorKey = process.argv[4];
    const colorValue = process.argv[5];
    if (brand && colorKey && colorValue) {
      manager.updateBrandColors(brand, { [colorKey]: colorValue });
    } else {
      console.log('Usage: node brand-asset-manager.js update-colors <brand> <colorKey> <colorValue>');
    }
    break;
    
  case 'update-url':
    const newUrl = process.argv[4];
    if (brand && newUrl) {
      manager.updateBaseUrl(brand, newUrl);
    } else {
      console.log('Usage: node brand-asset-manager.js update-url <brand> <newUrl>');
    }
    break;
    
  case 'copy-assets':
    const sourceDir = process.argv[4];
    if (brand && sourceDir) {
      manager.copyBrandAssets(brand, sourceDir);
    } else {
      console.log('Usage: node brand-asset-manager.js copy-assets <brand> <sourceDir>');
    }
    break;
    
  default:
    console.log(`
🎯 Brand Asset Manager

Usage:
  node brand-asset-manager.js list                    - List all brands
  node brand-asset-manager.js info [brand]           - Show brand information
  node brand-asset-manager.js update-logo <brand> <type> <path>  - Update logo
  node brand-asset-manager.js update-colors <brand> <key> <value> - Update colors
  node brand-asset-manager.js update-url <brand> <url> - Update base URL
  node brand-asset-manager.js copy-assets <brand> <source> - Copy assets

Examples:
  node brand-asset-manager.js info akilajewellers
  node brand-asset-manager.js update-colors akilajewellers primary "#1a2a39"
  node brand-asset-manager.js update-url akilajewellers "https://api.akila.com"
    `);
} 