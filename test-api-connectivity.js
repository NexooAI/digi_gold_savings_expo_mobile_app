#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 API Connectivity Test Script');
console.log('===============================\n');

// Function to test URL connectivity
const testUrlConnectivity = (url) => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    const timeout = 5000; // 5 seconds timeout
    
    const req = protocol.get(url, { timeout }, (res) => {
      resolve({
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      resolve({
        error: error.message,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Request timeout',
        success: false
      });
    });
  });
};

// Brand configurations
const brands = [
  {
    name: 'akilajewellers',
    baseUrl: 'https://api.prod.akilajewellers.com',
    config: require('./src/brands/akilajewellers/config/app.config.js')
  },
  {
    name: 'dc-jewellers',
    baseUrl: 'https://api.prod.dcjewellers.org',
    config: require('./src/brands/dc-jewellers/config/app.config.js')
  },
  {
    name: 'srimurugangoldhouse',
    baseUrl: 'https://api.prod.srimuruganthangamaligai.com',
    config: require('./src/brands/srimurugangoldhouse/config/app.config.js')
  }
];

// Test each brand
const testBrands = async () => {
  console.log('Testing API connectivity for all brands:\n');
  
  for (const brand of brands) {
    console.log(`🔍 Testing ${brand.name.toUpperCase()}`);
    console.log(`   Base URL: ${brand.baseUrl}`);
    console.log(`   App Name: ${brand.config.appName}`);
    console.log(`   Company: ${brand.config.company.name}`);
    
    try {
      // Test base URL
      const baseResult = await testUrlConnectivity(brand.baseUrl);
      console.log(`   Base URL Status: ${baseResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (baseResult.success) {
        console.log(`   Status Code: ${baseResult.status}`);
      } else {
        console.log(`   Error: ${baseResult.error}`);
      }
      
      // Test health endpoint
      const healthUrl = `${brand.baseUrl}/health`;
      const healthResult = await testUrlConnectivity(healthUrl);
      console.log(`   Health Endpoint: ${healthResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (healthResult.success) {
        console.log(`   Status Code: ${healthResult.status}`);
      } else {
        console.log(`   Error: ${healthResult.error}`);
      }
      
      // Test API endpoint
      const apiUrl = `${brand.baseUrl}/api`;
      const apiResult = await testUrlConnectivity(apiUrl);
      console.log(`   API Endpoint: ${apiResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (apiResult.success) {
        console.log(`   Status Code: ${apiResult.status}`);
      } else {
        console.log(`   Error: ${apiResult.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing ${brand.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for separation
  }
  
  console.log('📊 Summary of Test Results:');
  console.log('============================');
  console.log('✅ SUCCESS: API endpoint is reachable and responding');
  console.log('❌ FAILED: API endpoint is not reachable or not responding');
  console.log('');
  console.log('💡 Note: These are production URLs. In development, you might want to use:');
console.log('   - https://api.dev.akilajewellers.com');
console.log('   - https://api.dev.dcjewellers.org');
console.log('   - https://api.dev.srimuruganthangamaligai.com');
  console.log('');
  console.log('🔧 To switch brands in your app:');
  console.log('   1. Set environment variable: export BRAND_NAME=akilajewellers');
  console.log('   2. Use brand switcher: node switch-to-akilajewellers.js');
  console.log('   3. Set globally: global.BRAND_NAME = "akilajewellers"');
};

// Run the tests
testBrands().catch(console.error); 