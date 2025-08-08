const fs = require('fs');
const path = require('path');

// Path to BrandConfig file
const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');

// Read the current file
let content = fs.readFileSync(brandConfigPath, 'utf8');

// Replace the default brand with akilajewellers
content = content.replace(
  /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| 'dc-jewellers';/,
  "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || 'akilajewellers';"
);

// Write the modified content back
fs.writeFileSync(brandConfigPath, content);

console.log('✅ Brand switched to akilajewellers');
console.log('🔄 Please restart the app to see the changes'); 