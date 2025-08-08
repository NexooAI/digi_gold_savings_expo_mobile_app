const fs = require('fs');
const path = require('path');

const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');
let content = fs.readFileSync(brandConfigPath, 'utf8');

// Update the default brand
content = content.replace(
  /let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '[^']+';/,
  "let BRAND_NAME = process.env.BRAND_NAME || global.BRAND_NAME || 'akilajewellers';"
);

fs.writeFileSync(brandConfigPath, content);
console.log('✅ Brand switched to akilajewellers');
console.log('🔄 Please restart the app to see the changes');