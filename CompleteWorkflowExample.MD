# 1. Create new brand
node next-customer-flow.js create royal-jewellers

# 2. Add logo files (copy to src/brands/royal-jewellers/assets/images/)

# 3. Customize configuration
node brand-asset-manager.js update-colors royal-jewellers primary "#8B4513"
node brand-asset-manager.js update-url royal-jewellers "https://api.royaljewellers.com"

# 4. Switch to new brand
node switch-to-royal-jewellers.js

# 5. Start app
npx expo start --clear

# 6. Verify
node brand-asset-manager.js info royal-jewellers

� STEPS NEEDED FOR NEXT NEW CUSTOMER ADDITION METHOD
📋 Overview
The system provides 3 main methods for adding new customers (brands) to your multi-brand jewellery app:
Method 1: Quick Create (Recommended)
node next-customer-flow.js create <brand-name>

Method 2: Interactive Setup
node next-customer-flow.js interactive

Method 3: Manual Setup
Following the complete guide step-by-step

🚀 QUICK START - Method 1 (Recommended)
Step 1: Run Quick Create Command
# Example: Create "royal-jewellers" brand
node next-customer-flow.js create royal-jewellers

Step 2: System Automatically Creates
✅ Directory Structure:
src/brands/royal-jewellers/
├── assets/images/
│   ├── logo.png (ADD YOUR LOGO)
│   ├── logo_trans.png (ADD YOUR LOGO)
│   ├── splash_logo.png (ADD YOUR LOGO)
│   ├── adaptive_icon.png (ADD YOUR LOGO)
│   ├── favicon.png (ADD YOUR LOGO)
│   └── brand_colors.json
├── config/
│   ├── app.config.js
│   └── theme.js
└── locales/
    ├── en.json
    ├── ta.json
    └── mal.json

✅ Configuration Files:
App configuration with default settings
Theme configuration with brand colors
Multi-language locale files
Brand switching script: switch-to-royal-jewellers.js
Setup instructions: royal-jewellers-setup-instructions.md

Step 3: Add Your Assets
# Copy your logo files to the brand directory
cp your-logo.png src/brands/royal-jewellers/assets/images/logo.png
cp your-splash.png src/brands/royal-jewellers/assets/images/splash_logo.png
# ... add other logo files

Step 4: Customize Configuration

# Update brand colors
node brand-asset-manager.js update-colors royal-jewellers primary "#YOUR_COLOR"

# Update base URL
node brand-asset-manager.js update-url royal-jewellers "https://api.yourbrand.com"

# Check current configuration
node brand-asset-manager.js info royal-jewellers


Step 5: Switch to New Brand
# Switch to the new brand
node switch-to-royal-jewellers.js

# Restart the app
npx expo start --clear




🎯 INTERACTIVE SETUP - Method 2
Step 1: Run Interactive Setup
node next-customer-flow.js interactive

Step 2: Follow Prompts
The system will ask for:
Brand name (e.g., royal-jewellers)
App name (e.g., Royal Jewellers)
Primary color (e.g., #8B4513)
Secondary color (e.g., #FFD700)
API base URL (e.g., https://api.royaljewellers.com)
Company information (name, address, contact)
Social media URLs (Facebook, Instagram, YouTube)

Step 3: System Creates Everything
Same as Method 1, but with your custom configurations.


REQUIRED INFORMATION FOR NEW CUSTOMER
Essential Information Needed:
Brand Name (e.g., "royal-jewellers")
App Name (e.g., "Royal Jewellers")
Primary Color (e.g., "#8B4513")
Secondary Color (e.g., "#FFD700")
Company Information:
Company name
Address
Mobile number
Email
Website
API Base URL (e.g., "https://api.royaljewellers.com")
Social Media URLs:
Facebook
Instagram
YouTube
Required Assets:
Logo Files (PNG format):
logo.png - Main brand logo
logo_trans.png - Transparent background logo
splash_logo.png - Splash screen logo
adaptive_icon.png - Android adaptive icon
favicon.png - Web favicon

POST-CREATION STEPS
Step 1: Add Logo Files
# Copy your logo files to the brand directory
cp your-logo.png src/brands/royal-jewellers/assets/images/logo.png
cp your-splash.png src/brands/royal-jewellers/assets/images/splash_logo.png
cp your-icon.png src/brands/royal-jewellers/assets/images/adaptive_icon.png
cp your-favicon.png src/brands/royal-jewellers/assets/images/favicon.png

Step 2: Customize Colors

# Update primary color
node brand-asset-manager.js update-colors royal-jewellers primary "#YOUR_PRIMARY_COLOR"

# Update secondary color
node brand-asset-manager.js update-colors royal-jewellers secondary "#YOUR_SECONDARY_COLOR"

Step 3: Update API URL

# Update base URL
node brand-asset-manager.js update-url royal-jewellers "https://api.yourbrand.com"

Step 4: Switch to New Brand
# Switch to the new brand
node switch-to-royal-jewellers.js

# Restart the app
npx expo start --clear

Step 5: Verify Configuration
# Check current brand
node check-current-brand.js

# Show brand information
node brand-asset-manager.js info royal-jewellers


✅ VERIFICATION CHECKLIST
After completing the setup, verify:
[ ] Logo files added correctly
[ ] Colors updated properly
[ ] Base URL configured
[ ] Brand switched successfully
[ ] App starts without errors
[ ] Brand name displays correctly
[ ] Primary color applied throughout app
[ ] Splash screen shows new logo
[ ] Company information displays correctly
[ ] Multi-language support works

📚 ADDITIONAL RESOURCES
Complete Guide: NEXT_CUSTOMER_ADDITION_GUIDE.md
Brand Management: BRAND_MANAGEMENT_COMMANDS.md
Asset Management: BRAND_ASSET_MANAGEMENT_GUIDE.md
Current Brand Check: check-current-brand.js
This system provides a complete, automated workflow for adding new customers with minimal manual intervention and comprehensive documentation for each step.