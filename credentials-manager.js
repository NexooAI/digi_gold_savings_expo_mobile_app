const fs = require('fs');
const path = require('path');

class CredentialsManager {
  constructor() {
    this.credentialsDir = './credentials';
    this.ensureCredentialsDir();
  }

  ensureCredentialsDir() {
    if (!fs.existsSync(this.credentialsDir)) {
      fs.mkdirSync(this.credentialsDir, { recursive: true });
      console.log(`✅ Created credentials directory: ${this.credentialsDir}`);
    }
  }

  // Get credentials for a specific brand
  getCredentials(brandName) {
    const credentialsPath = `${this.credentialsDir}/${brandName}/credentials.json`;
    if (fs.existsSync(credentialsPath)) {
      return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    return null;
  }

  // Update credentials for a brand
  updateCredentials(brandName, credentials) {
    const brandDir = `${this.credentialsDir}/${brandName}`;
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }
    
    const credentialsPath = `${brandDir}/credentials.json`;
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log(`✅ Updated credentials for ${brandName}: ${credentialsPath}`);
  }

  // Update Google Services configuration
  updateGoogleServices(brandName, googleServices) {
    const googleServicesPath = `${this.credentialsDir}/${brandName}/google-services.json`;
    fs.writeFileSync(googleServicesPath, JSON.stringify(googleServices, null, 2));
    console.log(`✅ Updated Google Services for ${brandName}: ${googleServicesPath}`);
  }

  // Copy Google Services to app root (for build)
  copyGoogleServicesToRoot(brandName) {
    const sourcePath = `${this.credentialsDir}/${brandName}/google-services.json`;
    const targetPath = './google-services.json';
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied Google Services from ${brandName} to root`);
      return true;
    } else {
      console.error(`❌ Google Services file not found for ${brandName}: ${sourcePath}`);
      return false;
    }
  }

  // List all brands with credentials
  listBrands() {
    if (!fs.existsSync(this.credentialsDir)) {
      console.log('No credentials directory found');
      return [];
    }
    
    const brands = fs.readdirSync(this.credentialsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    return brands;
  }

  // Show credentials info for a brand
  showCredentialsInfo(brandName) {
    const credentials = this.getCredentials(brandName);
    if (!credentials) {
      console.log(`❌ No credentials found for ${brandName}`);
      console.log(`📝 Creating credentials template for ${brandName}...`);
      this.createCredentialsTemplate(brandName, {
        appName: brandName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        baseUrl: `https://api.prod.${brandName}.org`,
        androidPackage: `com.nexooai.${brandName.replace(/-/g, '')}`,
        iosBundleId: `com.nexooai.${brandName.replace(/-/g, '')}`,
        googleServices: {
          projectId: `${brandName}-project`,
          apiKey: "YOUR_GOOGLE_API_KEY_HERE",
          projectNumber: "000000000000",
          mobileSdkAppId: `1:000000000000:android:${brandName.replace(/-/g, '')}`
        },
        googleMapsApiKey: "YOUR_MAPS_API_KEY_HERE"
      });
      return;
    }

    console.log(`\n📋 Credentials Info for ${brandName}:`);
    console.log('=====================================');
    console.log(`App Name: ${credentials.app_name || 'Not set'}`);
    console.log(`Base URL: ${credentials.api_config?.base_url || 'Not set'}`);
    console.log(`Google Project ID: ${credentials.google_services?.project_id || 'Not set'}`);
    console.log(`Google Maps API Key: ${credentials.google_services?.maps_api_key && credentials.google_services.maps_api_key !== 'YOUR_MAPS_API_KEY_HERE' ? '✅ Set' : '❌ Not Set'}`);
    console.log(`Firebase API Key: ${credentials.google_services?.firebase_config?.api_key && credentials.google_services.firebase_config.api_key !== 'YOUR_FIREBASE_API_KEY_HERE' ? '✅ Set' : '❌ Not Set'}`);
    console.log(`Payment Gateway: ${credentials.payment_gateway?.hypercheckout?.merchant_id && credentials.payment_gateway.hypercheckout.merchant_id !== 'YOUR_MERCHANT_ID_HERE' ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`FCM Server Key: ${credentials.notification?.fcm_server_key && credentials.notification.fcm_server_key !== 'YOUR_FCM_SERVER_KEY_HERE' ? '✅ Set' : '❌ Not Set'}`);
  }

  // Update specific credential field
  updateCredentialField(brandName, fieldPath, value) {
    const credentials = this.getCredentials(brandName);
    if (!credentials) {
      console.log(`❌ No credentials found for ${brandName}`);
      return;
    }

    const fields = fieldPath.split('.');
    let current = credentials;
    
    for (let i = 0; i < fields.length - 1; i++) {
      if (!current[fields[i]]) {
        current[fields[i]] = {};
      }
      current = current[fields[i]];
    }
    
    current[fields[fields.length - 1]] = value;
    this.updateCredentials(brandName, credentials);
    console.log(`✅ Updated ${fieldPath} for ${brandName}`);
  }

  // Validate credentials for a brand
  validateCredentials(brandName) {
    const credentials = this.getCredentials(brandName);
    if (!credentials) {
      console.log(`❌ No credentials found for ${brandName}`);
      console.log(`📝 Creating credentials template for ${brandName}...`);
      this.createCredentialsTemplate(brandName, {
        appName: brandName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        baseUrl: `https://api.prod.${brandName}.org`,
        androidPackage: `com.nexooai.${brandName.replace(/-/g, '')}`,
        iosBundleId: `com.nexooai.${brandName.replace(/-/g, '')}`,
        googleServices: {
          projectId: `${brandName}-project`,
          apiKey: "YOUR_GOOGLE_API_KEY_HERE",
          projectNumber: "000000000000",
          mobileSdkAppId: `1:000000000000:android:${brandName.replace(/-/g, '')}`
        },
        googleMapsApiKey: "YOUR_MAPS_API_KEY_HERE"
      });
      return false;
    }

    const requiredFields = [
      'api_config.base_url',
      'google_services.project_id',
      'google_services.maps_api_key',
      'google_services.firebase_config.api_key',
      'payment_gateway.hypercheckout.merchant_id',
      'notification.fcm_server_key'
    ];

    const missingFields = [];
    
    for (const field of requiredFields) {
      const fields = field.split('.');
      let current = credentials;
      let exists = true;
      
      for (const f of fields) {
        if (!current || !current[f] || current[f] === `YOUR_${f.toUpperCase()}_HERE`) {
          exists = false;
          break;
        }
        current = current[f];
      }
      
      if (!exists) {
        missingFields.push(field);
      }
    }

    if (missingFields.length === 0) {
      console.log(`✅ All credentials are properly configured for ${brandName}`);
      return true;
    } else {
      console.log(`❌ Missing or incomplete credentials for ${brandName}:`);
      missingFields.forEach(field => console.log(`  - ${field}`));
      return false;
    }
  }

  // Create credentials template for a new brand
  createCredentialsTemplate(brandName, config) {
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

    this.updateCredentials(brandName, template);
    console.log(`✅ Created credentials template for ${brandName}`);
  }
}

// CLI Interface
const manager = new CredentialsManager();
const command = process.argv[2];

switch (command) {
  case 'list':
    const brands = manager.listBrands();
    console.log('\n📋 Available brands with credentials:');
    brands.forEach(brand => console.log(`  - ${brand}`));
    break;
    
  case 'info':
    const brandName = process.argv[3];
    if (brandName) {
      manager.showCredentialsInfo(brandName);
    } else {
      console.log('Usage: node credentials-manager.js info <brand-name>');
    }
    break;
    
  case 'validate':
    const validateBrand = process.argv[3];
    if (validateBrand) {
      manager.validateCredentials(validateBrand);
    } else {
      console.log('Usage: node credentials-manager.js validate <brand-name>');
    }
    break;
    
  case 'update':
    const updateBrand = process.argv[3];
    const fieldPath = process.argv[4];
    const value = process.argv[5];
    if (updateBrand && fieldPath && value) {
      manager.updateCredentialField(updateBrand, fieldPath, value);
    } else {
      console.log('Usage: node credentials-manager.js update <brand-name> <field.path> <value>');
      console.log('Example: node credentials-manager.js update royal-jewellers google_services.maps_api_key "YOUR_MAPS_KEY"');
    }
    break;
    
  case 'copy-google-services':
    const copyBrand = process.argv[3];
    if (copyBrand) {
      manager.copyGoogleServicesToRoot(copyBrand);
    } else {
      console.log('Usage: node credentials-manager.js copy-google-services <brand-name>');
    }
    break;
    
  default:
    console.log(`
🔐 Credentials Manager

Usage:
  node credentials-manager.js list                                    - List all brands with credentials
  node credentials-manager.js info <brand-name>                      - Show credentials info for a brand
  node credentials-manager.js validate <brand-name>                  - Validate credentials for a brand
  node credentials-manager.js update <brand> <field.path> <value>    - Update a credential field
  node credentials-manager.js copy-google-services <brand-name>       - Copy Google Services to root

Examples:
  node credentials-manager.js info royal-jewellers
  node credentials-manager.js validate royal-jewellers
  node credentials-manager.js update royal-jewellers google_services.maps_api_key "AIzaSy..."
  node credentials-manager.js copy-google-services royal-jewellers
    `);
} 