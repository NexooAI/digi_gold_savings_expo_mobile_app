# 🔐 Multi-Customer Credentials Management Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Base URL Management](#base-url-management)
3. [Google Services Configuration](#google-services-configuration)
4. [Credentials Management](#credentials-management)
5. [File Structure](#file-structure)
6. [Step-by-Step Setup](#step-by-step-setup)
7. [Validation & Testing](#validation--testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 📖 Overview

This guide provides a complete solution for managing **base URLs**, **Google Services**, and **credentials** for multiple customers in your multi-brand jewellery app system.

### **Key Features:**
- ✅ **Centralized credentials management** per brand
- 🔄 **Automatic Google Services switching** between brands
- 🌐 **Brand-specific base URL configuration**
- 🔐 **Secure credential storage** with templates
- 📋 **Validation and verification** tools
- 🚀 **Quick switching** between customers

---

## 🌐 Base URL Management

### **Current Issue:**
- Base URLs are hardcoded in brand configs
- No centralized management
- Difficult to update across brands

### **Solution:**
Each brand now has its own base URL configuration in:
```
src/brands/{brand-name}/config/app.config.js
```

### **Example Base URL Configuration:**
```javascript
// API Configuration
baseUrl: "https://api.prod.royaljewellers.org",
youtubeUrl: "https://youtu.be/royal-jewellers-video",
```

### **Update Base URL:**
```bash
# Using brand asset manager
node brand-asset-manager.js update-url royal-jewellers "https://api.royaljewellers.com"

# Using credentials manager
node credentials-manager.js update royal-jewellers api_config.base_url "https://api.royaljewellers.com"
```

---

## 🔧 Google Services Configuration

### **Current Issue:**
- Single `google-services.json` file in root
- Cannot handle multiple brands
- Manual switching required

### **Solution:**
Each brand now has its own Google Services configuration:

```
credentials/
├── royal-jewellers/
│   ├── google-services.json
│   └── credentials.json
├── akilajewellers/
│   ├── google-services.json
│   └── credentials.json
└── dc-jewellers/
    ├── google-services.json
    └── credentials.json
```

### **Google Services Structure:**
```json
{
  "project_info": {
    "project_number": "932187013222",
    "project_id": "royal-jewellers-project",
    "storage_bucket": "royal-jewellers-project.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:932187013222:android:royaljewellers",
        "android_client_info": {
          "package_name": "com.nexooai.royaljewellers"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "YOUR_GOOGLE_API_KEY_HERE"
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
}
```

### **Automatic Google Services Switching:**
```bash
# Switch to a brand (automatically copies Google Services)
node enhanced-brand-switcher.js switch royal-jewellers

# Manually copy Google Services
node credentials-manager.js copy-google-services royal-jewellers
```

---

## 🔐 Credentials Management

### **Credentials Structure:**
Each brand has a comprehensive credentials file:

```json
{
  "brand": "royal-jewellers",
  "app_name": "Royal Jewellers",
  "api_config": {
    "base_url": "https://api.royaljewellers.com",
    "api_key": "YOUR_API_KEY_HERE",
    "secret_key": "YOUR_SECRET_KEY_HERE"
  },
  "google_services": {
    "project_id": "royal-jewellers-project",
    "api_key": "YOUR_GOOGLE_API_KEY_HERE",
    "maps_api_key": "YOUR_MAPS_API_KEY_HERE",
    "firebase_config": {
      "api_key": "YOUR_FIREBASE_API_KEY_HERE",
      "auth_domain": "royal-jewellers.firebaseapp.com",
      "project_id": "royal-jewellers-project",
      "storage_bucket": "royal-jewellers-project.firebasestorage.app",
      "messaging_sender_id": "000000000000",
      "app_id": "1:000000000000:android:royaljewellers"
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
}
```

---

## 📁 File Structure

### **Complete Multi-Customer Structure:**
```
project-root/
├── credentials/
│   ├── royal-jewellers/
│   │   ├── google-services.json
│   │   └── credentials.json
│   ├── akilajewellers/
│   │   ├── google-services.json
│   │   └── credentials.json
│   └── dc-jewellers/
│       ├── google-services.json
│       └── credentials.json
├── src/brands/
│   ├── royal-jewellers/
│   │   ├── config/
│   │   │   ├── app.config.js
│   │   │   └── theme.js
│   │   ├── assets/images/
│   │   └── locales/
│   ├── akilajewellers/
│   └── dc-jewellers/
├── google-services.json (current brand)
├── credentials-manager.js
├── enhanced-brand-switcher.js
└── next-customer-flow.js
```

---

## 🚀 Step-by-Step Setup

### **Step 1: Create New Customer**
```bash
# Create new brand with credentials
node next-customer-flow.js create royal-jewellers
```

This creates:
- ✅ Brand directory structure
- ✅ Configuration files
- ✅ Google Services template
- ✅ Credentials template

### **Step 2: Configure Google Services**
```bash
# 1. Get Google Services from Firebase Console
# 2. Copy to credentials directory
cp your-google-services.json credentials/royal-jewellers/google-services.json

# 3. Update credentials
node credentials-manager.js update royal-jewellers google_services.api_key "YOUR_API_KEY"
node credentials-manager.js update royal-jewellers google_services.maps_api_key "YOUR_MAPS_KEY"
```

### **Step 3: Configure API Credentials**
```bash
# Update base URL
node credentials-manager.js update royal-jewellers api_config.base_url "https://api.royaljewellers.com"

# Update API keys
node credentials-manager.js update royal-jewellers api_config.api_key "YOUR_API_KEY"
node credentials-manager.js update royal-jewellers api_config.secret_key "YOUR_SECRET_KEY"

# Update payment gateway
node credentials-manager.js update royal-jewellers payment_gateway.hypercheckout.merchant_id "YOUR_MERCHANT_ID"
node credentials-manager.js update royal-jewellers payment_gateway.hypercheckout.access_key "YOUR_ACCESS_KEY"
node credentials-manager.js update royal-jewellers payment_gateway.hypercheckout.secret_key "YOUR_SECRET_KEY"

# Update FCM
node credentials-manager.js update royal-jewellers notification.fcm_server_key "YOUR_FCM_SERVER_KEY"
```

### **Step 4: Switch to New Brand**
```bash
# Switch to the new brand
node enhanced-brand-switcher.js switch royal-jewellers

# Restart the app
npx expo start --clear
```

---

## ✅ Validation & Testing

### **Validate Credentials:**
```bash
# Check credentials for a brand
node credentials-manager.js validate royal-jewellers

# Show credentials info
node credentials-manager.js info royal-jewellers

# List all brands
node credentials-manager.js list
```

### **Validate Configuration:**
```bash
# Validate specific brand
node enhanced-brand-switcher.js validate royal-jewellers

# Validate all brands
node enhanced-brand-switcher.js validate

# Show current brand
node enhanced-brand-switcher.js current
```

### **Test Switching:**
```bash
# Switch between brands
node enhanced-brand-switcher.js switch royal-jewellers
node enhanced-brand-switcher.js switch akilajewellers
node enhanced-brand-switcher.js switch dc-jewellers
```

---

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. Google Services Not Found**
```bash
# Check if Google Services exists
ls credentials/royal-jewellers/google-services.json

# Copy from another brand
cp credentials/akilajewellers/google-services.json credentials/royal-jewellers/

# Update package name in Google Services
node credentials-manager.js update royal-jewellers google_services.project_id "royal-jewellers-project"
```

#### **2. Base URL Not Working**
```bash
# Check current base URL
node credentials-manager.js info royal-jewellers

# Update base URL
node credentials-manager.js update royal-jewellers api_config.base_url "https://api.royaljewellers.com"

# Verify in brand config
cat src/brands/royal-jewellers/config/app.config.js | grep baseUrl
```

#### **3. Credentials Not Loading**
```bash
# Validate credentials
node credentials-manager.js validate royal-jewellers

# Check file structure
ls -la credentials/royal-jewellers/

# Recreate credentials template
node next-customer-flow.js create royal-jewellers
```

#### **4. App Not Starting**
```bash
# Check current brand
node enhanced-brand-switcher.js current

# Validate configuration
node enhanced-brand-switcher.js validate royal-jewellers

# Copy Google Services to root
node credentials-manager.js copy-google-services royal-jewellers

# Restart app
npx expo start --clear
```

---

## 📋 Best Practices

### **1. Credential Security**
- ✅ Store credentials in `credentials/` directory
- ✅ Add `credentials/` to `.gitignore`
- ✅ Use environment variables for sensitive data
- ✅ Regularly rotate API keys

### **2. Google Services Management**
- ✅ Create separate Firebase projects per brand
- ✅ Use unique package names per brand
- ✅ Keep Google Services files organized
- ✅ Validate Google Services before switching

### **3. Base URL Management**
- ✅ Use HTTPS for all APIs
- ✅ Implement proper error handling
- ✅ Monitor API endpoints
- ✅ Use staging/production URLs

### **4. Brand Switching**
- ✅ Always validate before switching
- ✅ Test app functionality after switching
- ✅ Keep backup of configurations
- ✅ Document brand-specific settings

### **5. Development Workflow**
```bash
# 1. Create new brand
node next-customer-flow.js create new-brand

# 2. Configure credentials
node credentials-manager.js update new-brand api_config.base_url "https://api.newbrand.com"

# 3. Add Google Services
cp google-services-new-brand.json credentials/new-brand/google-services.json

# 4. Switch to brand
node enhanced-brand-switcher.js switch new-brand

# 5. Validate configuration
node enhanced-brand-switcher.js validate new-brand

# 6. Test app
npx expo start --clear
```

---

## 🎯 Quick Reference Commands

### **Brand Management:**
```bash
# Create new brand
node next-customer-flow.js create royal-jewellers

# Switch brands
node enhanced-brand-switcher.js switch royal-jewellers

# List brands
node enhanced-brand-switcher.js list
```

### **Credentials Management:**
```bash
# Update base URL
node credentials-manager.js update royal-jewellers api_config.base_url "https://api.royaljewellers.com"

# Update Google API key
node credentials-manager.js update royal-jewellers google_services.api_key "YOUR_API_KEY"

# Validate credentials
node credentials-manager.js validate royal-jewellers

# Show credentials info
node credentials-manager.js info royal-jewellers
```

### **Google Services:**
```bash
# Copy Google Services to root
node credentials-manager.js copy-google-services royal-jewellers

# List all brands with credentials
node credentials-manager.js list
```

This comprehensive system ensures **secure**, **organized**, and **scalable** management of multiple customer configurations with proper separation of concerns and easy switching between brands. 




# 1. Create brand
node next-customer-flow.js create royal-jewellers

# 2. Add Google Services
cp your-google-services.json credentials/royal-jewellers/

# 3. Configure credentials
node credentials-manager.js update royal-jewellers api_config.base_url "https://api.royaljewellers.com"
node credentials-manager.js update royal-jewellers google_services.api_key "YOUR_API_KEY"

# 4. Switch to brand
node enhanced-brand-switcher.js switch royal-jewellers

# 5. Validate
node enhanced-brand-switcher.js validate royal-jewellers

# 6. Test
npx expo start --clear