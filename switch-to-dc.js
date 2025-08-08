const fs = require('fs');
const path = require('path');

// Path to BrandConfig file
const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');

// Read the current file
let content = fs.readFileSync(brandConfigPath, 'utf8');

// Replace the default brand with dc-jewellers
content = content.replace(
  /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| 'akilajewellers';/,
  "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || 'dc-jewellers';"
);

// Write the modified content back
fs.writeFileSync(brandConfigPath, content);

console.log('✅ Brand switched to dc-jewellers');
console.log('🔄 Please restart the app to see the changes'); 