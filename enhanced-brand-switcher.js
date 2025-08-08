const fs = require('fs');
const path = require('path');

class EnhancedBrandSwitcher {
  constructor() {
    this.credentialsDir = './credentials';
    this.brandConfigPath = './src/core/config/BrandConfig.js';
  }

  // Switch to a specific brand with full configuration
  switchToBrand(brandName) {
    console.log(`\n🔄 Switching to brand: ${brandName}`);
    console.log('=====================================');

    // Step 1: Update BrandConfig.js
    this.updateBrandConfig(brandName);

    // Step 2: Copy Google Services to root
    this.copyGoogleServicesToRoot(brandName);

    // Step 3: Update app.config.js with brand-specific settings
    this.updateAppConfig(brandName);

    // Step 4: Validate configuration
    this.validateConfiguration(brandName);

    console.log(`\n✅ Successfully switched to ${brandName}!`);
    console.log('🔄 Please restart the app to see the changes');
    console.log('📋 Run "node credentials-manager.js info ' + brandName + '" to verify credentials');
  }

  // Update BrandConfig.js to set the new brand
  updateBrandConfig(brandName) {
    if (!fs.existsSync(this.brandConfigPath)) {
      console.error('❌ BrandConfig.js not found');
      return false;
    }

    let content = fs.readFileSync(this.brandConfigPath, 'utf8');
    
    // Update the default brand
    content = content.replace(
      /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '[^']+';/,
      `let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || '${brandName}';`
    );

    fs.writeFileSync(this.brandConfigPath, content);
    console.log(`✅ Updated BrandConfig.js to use ${brandName}`);
    return true;
  }

  // Copy Google Services configuration to root
  copyGoogleServicesToRoot(brandName) {
    const sourcePath = `${this.credentialsDir}/${brandName}/google-services.json`;
    const targetPath = './google-services.json';
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied Google Services from ${brandName} to root`);
      return true;
    } else {
      console.warn(`⚠️  Google Services file not found for ${brandName}: ${sourcePath}`);
      console.log('📝 You may need to create Google Services configuration for this brand');
      return false;
    }
  }

  // Update app.config.js with brand-specific settings
  updateAppConfig(brandName) {
    const appConfigPath = './app.config.js';
    if (!fs.existsSync(appConfigPath)) {
      console.warn('⚠️  app.config.js not found, skipping app config update');
      return;
    }

    let content = fs.readFileSync(appConfigPath, 'utf8');
    
    // Update package name
    const brandConfig = this.getBrandConfig(brandName);
    if (brandConfig) {
      content = content.replace(
        /android: {[\s\S]*?package: "[^"]*"/,
        `android: {\n      package: "${brandConfig.androidPackage}"`
      );
      
      content = content.replace(
        /ios: {[\s\S]*?bundleIdentifier: "[^"]*"/,
        `ios: {\n      bundleIdentifier: "${brandConfig.iosBundleId}"`
      );
    }

    fs.writeFileSync(appConfigPath, content);
    console.log(`✅ Updated app.config.js for ${brandName}`);
  }

  // Get brand configuration
  getBrandConfig(brandName) {
    const configPath = `./src/brands/${brandName}/config/app.config.js`;
    if (fs.existsSync(configPath)) {
      try {
        // Clear require cache to get fresh config
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
      } catch (error) {
        console.error(`❌ Error loading brand config for ${brandName}:`, error.message);
        return null;
      }
    }
    return null;
  }

  // Validate the configuration
  validateConfiguration(brandName) {
    console.log('\n🔍 Validating configuration...');
    
    // Check if brand config exists
    const brandConfig = this.getBrandConfig(brandName);
    if (!brandConfig) {
      console.error(`❌ Brand configuration not found for ${brandName}`);
      return false;
    }

    // Check if Google Services file exists
    const googleServicesPath = './google-services.json';
    if (!fs.existsSync(googleServicesPath)) {
      console.warn('⚠️  Google Services file not found in root');
    } else {
      console.log('✅ Google Services file found in root');
    }

    // Check if credentials exist
    const credentialsPath = `${this.credentialsDir}/${brandName}/credentials.json`;
    if (fs.existsSync(credentialsPath)) {
      console.log('✅ Credentials file found');
    } else {
      console.warn('⚠️  Credentials file not found');
    }

    console.log(`✅ Configuration validation completed for ${brandName}`);
    return true;
  }

  // List available brands
  listAvailableBrands() {
    const brandsDir = './src/brands';
    if (!fs.existsSync(brandsDir)) {
      console.log('No brands directory found');
      return [];
    }

    const brands = fs.readdirSync(brandsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    return brands;
  }

  // Show current brand
  showCurrentBrand() {
    if (!fs.existsSync(this.brandConfigPath)) {
      console.log('❌ BrandConfig.js not found');
      return;
    }

    const content = fs.readFileSync(this.brandConfigPath, 'utf8');
    const match = content.match(/let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '([^']+)';/);
    
    if (match) {
      const currentBrand = match[1];
      console.log(`\n🎯 Current brand: ${currentBrand}`);
      
      // Show brand info
      const brandConfig = this.getBrandConfig(currentBrand);
      if (brandConfig) {
        console.log(`App Name: ${brandConfig.appName}`);
        console.log(`Base URL: ${brandConfig.baseUrl}`);
        console.log(`Package: ${brandConfig.androidPackage}`);
      }
    } else {
      console.log('❌ Could not determine current brand');
    }
  }

  // Validate all brands
  validateAllBrands() {
    const brands = this.listAvailableBrands();
    console.log('\n🔍 Validating all brands...');
    
    brands.forEach(brand => {
      console.log(`\n📋 ${brand}:`);
      
      // Check brand config
      const brandConfig = this.getBrandConfig(brand);
      if (brandConfig) {
        console.log(`  ✅ Config: ${brandConfig.appName}`);
        console.log(`  ✅ Base URL: ${brandConfig.baseUrl}`);
      } else {
        console.log(`  ❌ Config: Not found`);
      }

      // Check Google Services
      const googleServicesPath = `${this.credentialsDir}/${brand}/google-services.json`;
      if (fs.existsSync(googleServicesPath)) {
        console.log(`  ✅ Google Services: Found`);
      } else {
        console.log(`  ❌ Google Services: Not found`);
      }

      // Check credentials
      const credentialsPath = `${this.credentialsDir}/${brand}/credentials.json`;
      if (fs.existsSync(credentialsPath)) {
        console.log(`  ✅ Credentials: Found`);
      } else {
        console.log(`  ❌ Credentials: Not found`);
      }
    });
  }
}

// CLI Interface
const switcher = new EnhancedBrandSwitcher();
const command = process.argv[2];

switch (command) {
  case 'switch':
    const brandName = process.argv[3];
    if (brandName) {
      switcher.switchToBrand(brandName);
    } else {
      console.log('Usage: node enhanced-brand-switcher.js switch <brand-name>');
      console.log('Available brands:');
      const brands = switcher.listAvailableBrands();
      brands.forEach(brand => console.log(`  - ${brand}`));
    }
    break;
    
  case 'list':
    const brands = switcher.listAvailableBrands();
    console.log('\n📋 Available brands:');
    brands.forEach(brand => console.log(`  - ${brand}`));
    break;
    
  case 'current':
    switcher.showCurrentBrand();
    break;
    
  case 'validate':
    const validateBrand = process.argv[3];
    if (validateBrand) {
      switcher.validateConfiguration(validateBrand);
    } else {
      switcher.validateAllBrands();
    }
    break;
    
  default:
    console.log(`
🔄 Enhanced Brand Switcher

Usage:
  node enhanced-brand-switcher.js switch <brand-name>    - Switch to a specific brand
  node enhanced-brand-switcher.js list                   - List all available brands
  node enhanced-brand-switcher.js current                - Show current brand
  node enhanced-brand-switcher.js validate [brand-name]  - Validate configuration

Examples:
  node enhanced-brand-switcher.js switch royal-jewellers
  node enhanced-brand-switcher.js validate royal-jewellers
  node enhanced-brand-switcher.js current
    `);
} 