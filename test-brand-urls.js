#!/usr/bin/env node

const { brandConfig, setBrand, getCurrentBrand } = require('./src/core/config/BrandConfig');

console.log('🔍 Brand URL Testing Script');
console.log('============================\n');

// Function to test a brand's base URL
const testBrandUrl = (brandName) => {
  console.log(`\n🔄 Switching to ${brandName}...`);
  setBrand(brandName);
  
  const currentBrand = getCurrentBrand();
  const config = require(`./src/brands/${brandName}/config/app.config.js`);
  
  console.log(`✅ Current Brand: ${currentBrand}`);
  console.log(`📱 App Name: ${config.appName}`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log(`📧 Email: ${config.company.email}`);
  console.log(`📞 Mobile: ${config.company.mobile}`);
  console.log(`🏢 Company: ${config.company.name}`);
  console.log(`📍 Address: ${config.company.address}`);
  console.log(`🔗 Website: ${config.company.website}`);
  
  // Test URL connectivity (basic check)
  console.log(`\n🔗 Testing URL connectivity...`);
  console.log(`   URL: ${config.baseUrl}`);
  console.log(`   Status: [This would test actual connectivity]`);
  
  return config.baseUrl;
};

// Test all brands
console.log('Testing all brand configurations:\n');

const brands = [
  'akilajewellers',
  'dc-jewellers', 
  'srimurugangoldhouse'
];

const results = {};

brands.forEach(brand => {
  try {
    const baseUrl = testBrandUrl(brand);
    results[brand] = {
      status: '✅ SUCCESS',
      baseUrl: baseUrl
    };
  } catch (error) {
    results[brand] = {
      status: '❌ ERROR',
      error: error.message
    };
  }
});

console.log('\n📊 SUMMARY');
console.log('===========');
Object.entries(results).forEach(([brand, result]) => {
  console.log(`${brand}: ${result.status}`);
  if (result.baseUrl) {
    console.log(`   Base URL: ${result.baseUrl}`);
  }
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

console.log('\n🚀 How to switch brands in your app:');
console.log('=====================================');
console.log('1. Set environment variable:');
console.log('   export BRAND_NAME=akilajewellers');
console.log('   export BRAND_NAME=dc-jewellers');
console.log('   export BRAND_NAME=srimurugangoldhouse');
console.log('');
console.log('2. Or use the brand switcher scripts:');
console.log('   node switch-to-akilajewellers.js');
console.log('   node switch-to-dc.js');
console.log('   node switch-to-srimurugan.js');
console.log('');
console.log('3. Or set globally in your app:');
console.log('   global.BRAND_NAME = "akilajewellers";');
console.log('');
console.log('4. Test API endpoints:');
console.log('   curl -X GET https://api.prod.akilajewellers.com/health');
console.log('   curl -X GET https://api.prod.dcjewellers.org/health');
console.log('   curl -X GET https://api.prod.srimuruganthangamaligai.com/health'); 