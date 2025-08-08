#!/usr/bin/env node

// Test script to verify brand configuration
const path = require('path');

// Set environment variable for testing
process.env.BRAND_NAME = 'dc-jewellers';

// Change to project root directory
process.chdir(path.join(__dirname, '..'));

try {
  // Test brand configuration loading
  const { brandConfig, brandTheme, brandAssets, isFeatureEnabled } = require('../src/core/config/BrandConfig');
  
  console.log('✅ Brand Configuration Test Results:');
  console.log('=====================================');
  
  // Test app configuration
  console.log('\n📱 App Configuration:');
  console.log(`App Name: ${brandConfig.appName}`);
  console.log(`App Slug: ${brandConfig.appSlug}`);
  console.log(`Version: ${brandConfig.version}`);
  console.log(`Android Package: ${brandConfig.androidPackage}`);
  console.log(`iOS Bundle ID: ${brandConfig.iosBundleId}`);
  
  // Test company information
  console.log('\n🏢 Company Information:');
  console.log(`Name: ${brandConfig.company.name}`);
  console.log(`Address: ${brandConfig.company.address}`);
  console.log(`Mobile: ${brandConfig.company.mobile}`);
  console.log(`Email: ${brandConfig.company.email}`);
  console.log(`Website: ${brandConfig.company.website}`);
  
  // Test API configuration
  console.log('\n🌐 API Configuration:');
  console.log(`Base URL: ${brandConfig.baseUrl}`);
  console.log(`YouTube URL: ${brandConfig.youtubeUrl}`);
  
  // Test theme configuration
  console.log('\n🎨 Theme Configuration:');
  console.log(`Primary Color: ${brandTheme.colors.primary}`);
  console.log(`Secondary Color: ${brandTheme.colors.secondary}`);
  console.log(`Background Color: ${brandTheme.colors.background}`);
  
  // Test feature flags
  console.log('\n🚀 Feature Flags:');
  console.log(`Gold Advance: ${isFeatureEnabled('enableGoldAdvance') ? '✅' : '❌'}`);
  console.log(`Savings: ${isFeatureEnabled('enableSavings') ? '✅' : '❌'}`);
  console.log(`Live Rates: ${isFeatureEnabled('enableLiveRates') ? '✅' : '❌'}`);
  console.log(`Store Locator: ${isFeatureEnabled('enableStoreLocator') ? '✅' : '❌'}`);
  console.log(`Notifications: ${isFeatureEnabled('enableNotifications') ? '✅' : '❌'}`);
  console.log(`Multi Language: ${isFeatureEnabled('enableMultiLanguage') ? '✅' : '❌'}`);
  console.log(`Biometric Auth: ${isFeatureEnabled('enableBiometricAuth') ? '✅' : '❌'}`);
  
  // Test payment configuration
  console.log('\n💳 Payment Configuration:');
  console.log(`Gateway: ${brandConfig.payment.gateway}`);
  console.log(`Currency: ${brandConfig.payment.currency}`);
  console.log(`Supported Methods: ${brandConfig.payment.supportedMethods.join(', ')}`);
  
  // Test social media
  console.log('\n📱 Social Media:');
  console.log(`Facebook: ${brandConfig.socialMedia.facebook}`);
  console.log(`Instagram: ${brandConfig.socialMedia.instagram}`);
  console.log(`YouTube: ${brandConfig.socialMedia.youtube}`);
  
  // Test assets configuration
  console.log('\n🖼️ Assets Configuration:');
  console.log('Assets loaded successfully:', Object.keys(brandAssets).length > 0);
  
  console.log('\n✅ All brand configuration tests passed!');
  
} catch (error) {
  console.error('❌ Brand configuration test failed:', error.message);
  process.exit(1);
} 