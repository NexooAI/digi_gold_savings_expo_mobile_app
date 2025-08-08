#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Available brands
const AVAILABLE_BRANDS = ['dc-jewellers', 'akilajewellers', 'srimurugangoldhouse'];

// Brand configurations
const BRAND_CONFIGS = {
  'dc-jewellers': {
    name: 'DC Jewellers',
    slug: 'dc-jewellers-gold-and-diamonds',
    package: 'com.nexooai.dcjewellery',
    bundleId: 'com.nexooai.dcjewellery',
    projectId: '9af1745a-105c-44f9-9e53-a111bc6ed9ce',
    owner: 'sudhakarg',
    primaryColor: '#850111',
    baseUrl: 'https://api.prod.dcjewellers.org',
  },
  'akilajewellers': {
    name: 'Akila Jewellers',
    slug: 'akila-jewellers-gold-and-diamonds',
    package: 'com.nexooai.akilajewellery',
    bundleId: 'com.nexooai.akilajewellery',
    projectId: 'akila-project-id-here',
    owner: 'akilaowner',
    primaryColor: '#1a365d',
    baseUrl: 'https://api.prod.akilajewellers.org',
  },
  'srimurugangoldhouse': {
    name: 'Srimurugan Gold House',
    slug: 'srimurugan-gold-house',
    package: 'com.nexooai.srimurugangoldhouse',
    bundleId: 'com.nexooai.srimurugangoldhouse',
    projectId: 'srimurugan-project-id-here',
    owner: 'srimuruganowner',
    primaryColor: '#2d3748',
    baseUrl: 'https://api.prod.srimurugangoldhouse.org',
  },
};

function updateAppConfig(brandName) {
  const config = BRAND_CONFIGS[brandName];
  if (!config) {
    console.error(`Brand configuration not found for: ${brandName}`);
    process.exit(1);
  }

  console.log(`Building for brand: ${brandName}`);
  console.log(`App Name: ${config.name}`);
  console.log(`Package: ${config.package}`);

  // Update app.config.js
  const appConfigPath = path.join(__dirname, '../app.config.js');
  let appConfig = fs.readFileSync(appConfigPath, 'utf8');

  // Replace theme imports with brand-specific config
  appConfig = appConfig.replace(
    /const theme = require\("\.\/src\/constants\/theme\.config"\);/,
    `const theme = require("./src/brands/${brandName}/config/app.config");`
  );

  // Update expo configuration
  appConfig = appConfig.replace(
    /name: theme\.customerName,/,
    `name: "${config.name}",`
  );

  appConfig = appConfig.replace(
    /slug: theme\.slug,/,
    `slug: "${config.slug}",`
  );

  appConfig = appConfig.replace(
    /package: "com\.nexooai\.dcjewellery",/,
    `package: "${config.package}",`
  );

  appConfig = appConfig.replace(
    /bundleIdentifier: "com\.nexooai\.dcjewellery",/,
    `bundleIdentifier: "${config.bundleId}",`
  );

  appConfig = appConfig.replace(
    /projectId: theme\.projectId,/,
    `projectId: "${config.projectId}",`
  );

  appConfig = appConfig.replace(
    /owner: theme\.owner,/,
    `owner: "${config.owner}",`
  );

  fs.writeFileSync(appConfigPath, appConfig);
  console.log('✅ Updated app.config.js');
}

function updateEnvironmentVariables(brandName) {
  // Set environment variable for the build
  process.env.BRAND_NAME = brandName;
  console.log(`✅ Set BRAND_NAME=${brandName}`);
}

function buildApp(brandName, platform = 'android') {
  try {
    console.log(`\n🚀 Building ${brandName} for ${platform}...`);
    
    // Update configurations
    updateAppConfig(brandName);
    updateEnvironmentVariables(brandName);

    // Build command
    const buildCommand = platform === 'ios' 
      ? 'expo run:ios'
      : 'expo run:android';

    console.log(`Executing: ${buildCommand}`);
    execSync(buildCommand, { stdio: 'inherit' });

    console.log(`\n✅ Successfully built ${brandName} for ${platform}`);
  } catch (error) {
    console.error(`❌ Build failed for ${brandName}:`, error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log(`
Usage: node scripts/build-brand.js <brand-name> [platform]

Available brands: ${AVAILABLE_BRANDS.join(', ')}

Examples:
  node scripts/build-brand.js dc-jewellers android
  node scripts/build-brand.js brand2 ios
  node scripts/build-brand.js brand3 android

Platform options: android, ios (default: android)
  `);
}

// Main execution
const brandName = process.argv[2];
const platform = process.argv[3] || 'android';

if (!brandName || !AVAILABLE_BRANDS.includes(brandName)) {
  console.error('❌ Invalid brand name');
  showUsage();
  process.exit(1);
}

if (platform && !['android', 'ios'].includes(platform)) {
  console.error('❌ Invalid platform. Use android or ios');
  showUsage();
  process.exit(1);
}

buildApp(brandName, platform); 