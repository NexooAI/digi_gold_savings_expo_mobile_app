const fs = require('fs');
const path = require('path');

// Path to BrandConfig file
const brandConfigPath = path.join(__dirname, 'src/core/config/BrandConfig.js');

// Read the current file
const content = fs.readFileSync(brandConfigPath, 'utf8');

// Extract the current brand name
const brandMatch = content.match(/let BRAND_NAME = process\.env\.BRAND_NAME \|\| global\.BRAND_NAME \|\| '([^']+)';/);

if (brandMatch) {
  const currentBrand = brandMatch[1];
  console.log('🔍 Current Brand Configuration:');
  console.log(`📱 Brand: ${currentBrand}`);
  
  // Show brand-specific details
  switch (currentBrand) {
    case 'dc-jewellers':
      console.log('🏪 App Name: DC Jewellers');
      console.log('📍 Location: Thrissur, Kerala');
      console.log('📞 Contact: +91 9061803999');
      console.log('🌐 Website: https://www.dcjewellers.org');
      break;
      
    case 'akilajewellers':
      console.log('🏪 App Name: Akila Jewellers');
      console.log('📍 Location: Chennai, Tamil Nadu');
      console.log('📞 Contact: +91 9876543210');
      console.log('🌐 Website: https://www.akilajewellers.com');
      break;
      
    case 'srimurugangoldhouse':
      console.log('🏪 App Name: Srimurugan Gold House');
      console.log('📍 Location: Madurai, Tamil Nadu');
      console.log('📞 Contact: +91 8765432109');
      console.log('🌐 Website: https://www.srimurugangoldhouse.com');
      break;
      
    default:
      console.log('❓ Unknown brand configuration');
  }
  
  console.log('\n🔄 To switch brands, use:');
  console.log('   node switch-to-akila.js     (for Akila Jewellers)');
  console.log('   node switch-to-dc.js         (for DC Jewellers)');
  console.log('   node switch-to-srimurugan.js (for Srimurugan Gold House)');
  
} else {
  console.log('❌ Could not determine current brand configuration');
} 