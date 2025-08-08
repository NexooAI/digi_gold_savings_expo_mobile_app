// Simple script to set brand and restart app
const { setBrand } = require('./src/core/config/BrandConfig');

// Set the brand to akilajewellers
setBrand('akilajewellers');

console.log('✅ Brand set to akilajewellers');
console.log('🔄 Please restart the app to see the changes'); 