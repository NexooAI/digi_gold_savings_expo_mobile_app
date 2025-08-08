#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Content templates for different brands
const contentTemplates = {
  'dc-jewellers': {
    'about-us': {
      en: {
        title: "About Us",
        body: "DC Jewellers has been a trusted name in gold and diamond retail since 1995, based in Thrissur, Kerala. We have built our reputation on quality, trust, and customer satisfaction. Our commitment to excellence has made us one of the most preferred jewelry destinations in Kerala.\n\nWith over two decades of experience, we offer a wide range of traditional and contemporary jewelry designs. Our expert craftsmen create pieces that blend traditional artistry with modern aesthetics, ensuring every piece tells a unique story.\n\nAt DC Jewellers, we believe in transparency and fair pricing. Our customers can trust us for authentic gold and diamond jewelry, backed by proper certification and quality assurance."
      },
      ta: {
        title: "எங்களைப் பற்றி",
        body: "டிசி ஜுவல்லர்ஸ் 1995 முதல் கேரளாவின் திருச்சூரில் தங்கம் மற்றும் வைர விற்பனையில் நம்பிக்கையான பெயராக உள்ளது. தரம், நம்பிக்கை மற்றும் வாடிக்கையாளர் திருப்தியின் அடிப்படையில் எங்கள் நற்பெயரை உருவாக்கியுள்ளோம். சிறந்த தரத்திற்கான எங்கள் உறுதி நம்மை கேரளாவின் மிகவும் விரும்பப்படும் நகை இடங்களில் ஒன்றாக மாற்றியுள்ளது."
      },
      mal: {
        title: "ഞങ്ങളെക്കുറിച്ച്",
        body: "ഡിസി ജ്യൂലർസ് 1995 മുതൽ കേരളത്തിലെ തൃശ്ശൂരിൽ സ്ഥിതി ചെയ്യുന്ന സ്വർണ്ണ, വജ്ര വ്യാപാരത്തിൽ വിശ്വസനീയമായ പേരാണ്. ഗുണനിലവാരം, വിശ്വാസം, ഉപഭോക്തൃ സംതൃപ്തി എന്നിവയിലൂടെ ഞങ്ങളുടെ പ്രതിഷ്ഠ നിർമ്മിച്ചിരിക്കുന്നു."
      }
    },
    'privacy-policy': {
      en: {
        title: "Privacy Policy",
        body: "At DC Jewellers, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.\n\n**Information We Collect:**\n• Personal information (name, email, phone number)\n• Payment information (processed securely through our payment partners)\n• Device information and usage data\n• Location data (with your consent)\n\n**How We Use Your Information:**\n• To provide and maintain our services\n• To process transactions and payments\n• To send you updates and promotional offers\n• To improve our services and user experience\n• To comply with legal obligations\n\n**Contact Us:**\nIf you have any questions about this Privacy Policy, please contact us at privacy@dcjewellers.org"
      }
    },
    'terms-and-conditions': {
      en: {
        title: "Terms and Conditions",
        body: "Welcome to DC Jewellers. By using our mobile application and services, you agree to be bound by these Terms and Conditions. Please read them carefully before proceeding.\n\n**Acceptance of Terms:**\nBy accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.\n\n**Use of Services:**\n• You must be at least 18 years old to use our services\n• You are responsible for maintaining the confidentiality of your account\n• You agree to provide accurate and complete information\n• You must not use our services for any illegal or unauthorized purpose\n\n**Contact Information:**\nFor questions about these terms, contact us at legal@dcjewellers.org"
      }
    },
    'contact-us': {
      en: {
        title: "Contact Us",
        body: "Get in touch with DC Jewellers. We're here to help with any questions, concerns, or assistance you may need.\n\n**Main Store Address:**\nRoad Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005\n\n**Business Hours:**\nMonday - Saturday: 10:00 AM - 8:00 PM\nSunday: 11:00 AM - 6:00 PM\n\n**Phone Numbers:**\nCustomer Care: +91 9061803999\nWhatsApp: +91 9061803999\n\n**Email Addresses:**\nGeneral Inquiries: dcjewellerstcr@gmail.com\nCustomer Support: support@dcjewellers.org\n\n**Website:**\nhttps://www.dcjewellers.org"
      }
    },
    'our-stores': {
      en: {
        title: "Our Stores",
        body: "Visit any of our DC Jewellers locations to experience our products and services firsthand. Our expert staff is ready to assist you with all your jewelry needs.\n\n**Main Showroom - Thrissur:**\n📍 Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005\n📞 +91 9061803999\n🕒 Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM\n\n**Services Available:**\n• Gold and Diamond Jewelry\n• Custom Design Services\n• Jewelry Repair and Maintenance\n• Gold Exchange Services\n• Expert Consultation\n• Secure Storage Facilities\n\n**Special Features:**\n• Free Parking Available\n• Wheelchair Accessible\n• Professional Photography Studio\n• Coffee Lounge\n• Kids Play Area"
      }
    },
    'faq': {
      en: {
        title: "Frequently Asked Questions",
        body: "Find answers to common questions about our products, services, and policies.\n\n**General Questions:**\n\n**Q: What types of jewelry do you offer?**\nA: We offer a wide range of gold and diamond jewelry including rings, necklaces, earrings, bracelets, and custom designs.\n\n**Q: Do you provide certification for your jewelry?**\nA: Yes, all our diamond jewelry comes with proper certification from recognized gemological laboratories.\n\n**Q: Can I exchange my old gold jewelry?**\nA: Yes, we offer gold exchange services. Please visit our store for current exchange rates and terms.\n\n**Contact Support:**\nIf you don't find the answer to your question here, please contact us at support@dcjewellers.org or call +91 9061803999."
      }
    },
    'offers': {
      en: {
        title: "Current Offers",
        body: "Discover our latest offers and promotions on jewelry and related products. Don't miss out on these exclusive deals!\n\n**🎉 Festival Season Offers (Valid until December 31, 2024):**\n\n**Gold Jewelry Offers:**\n• **20% off** on making charges for gold jewelry above 10 grams\n• **Free gold coin** with purchase of gold jewelry above ₹50,000\n• **Zero making charges** on traditional gold jewelry designs\n• **Exchange bonus** of ₹500 per gram on old gold exchange\n\n**Diamond Jewelry Offers:**\n• **15% discount** on all diamond jewelry\n• **Free diamond certificate** with every diamond purchase\n• **Buy 1 Get 1** on selected diamond earrings\n• **EMI options** available with 0% interest for 6 months\n\n**Contact Us:**\nFor more details about our offers, call us at +91 9061803999 or visit our stores."
      }
    },
    'profile': {
      en: {
        title: "Profile",
        body: "Manage your account settings and personal information with DC Jewellers.\n\n**Account Information:**\n• Update your personal details\n• Manage your contact information\n• Change your password and security settings\n• View your account history\n\n**Preferences:**\n• Set your preferred language\n• Choose notification preferences\n• Manage privacy settings\n• Customize your shopping experience\n\n**Need Help?**\nIf you need assistance with your profile or account, please contact our support team at support@dcjewellers.org or call +91 9061803999."
      }
    }
  },
  'srimurugan': {
    'about-us': {
      en: {
        title: "About Us",
        body: "Sri Murugan Jewellers has been a trusted name in gold and diamond retail since 1990, serving customers with quality jewelry and exceptional service. We have built our reputation on trust, transparency, and customer satisfaction.\n\nWith decades of experience, we offer a wide range of traditional and contemporary jewelry designs. Our expert craftsmen create pieces that blend traditional artistry with modern aesthetics.\n\nAt Sri Murugan Jewellers, we believe in transparency and fair pricing. Our customers can trust us for authentic gold and diamond jewelry, backed by proper certification and quality assurance."
      }
    },
    'privacy-policy': {
      en: {
        title: "Privacy Policy",
        body: "At Sri Murugan Jewellers, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.\n\n**Information We Collect:**\n• Personal information (name, email, phone number)\n• Payment information (processed securely through our payment partners)\n• Device information and usage data\n• Location data (with your consent)\n\n**Contact Us:**\nIf you have any questions about this Privacy Policy, please contact us at privacy@srimuruganjewellers.com"
      }
    },
    'terms-and-conditions': {
      en: {
        title: "Terms and Conditions",
        body: "Welcome to Sri Murugan Jewellers. By using our mobile application and services, you agree to be bound by these Terms and Conditions. Please read them carefully before proceeding.\n\n**Acceptance of Terms:**\nBy accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.\n\n**Use of Services:**\n• You must be at least 18 years old to use our services\n• You are responsible for maintaining the confidentiality of your account\n• You agree to provide accurate and complete information\n\n**Contact Information:**\nFor questions about these terms, contact us at legal@srimuruganjewellers.com"
      }
    },
    'contact-us': {
      en: {
        title: "Contact Us",
        body: "Get in touch with Sri Murugan Jewellers. We're here to help with any questions, concerns, or assistance you may need.\n\n**Main Store Address:**\nSri Murugan Jewellers, Main Street, City Center\n\n**Business Hours:**\nMonday - Saturday: 10:00 AM - 8:00 PM\nSunday: 11:00 AM - 6:00 PM\n\n**Phone Numbers:**\nCustomer Care: +91 9876543210\n\n**Email Addresses:**\nGeneral Inquiries: info@srimuruganjewellers.com\nCustomer Support: support@srimuruganjewellers.com"
      }
    },
    'our-stores': {
      en: {
        title: "Our Stores",
        body: "Visit any of our Sri Murugan Jewellers locations to experience our products and services firsthand. Our expert staff is ready to assist you with all your jewelry needs.\n\n**Main Showroom:**\n📍 Main Street, City Center\n📞 +91 9876543210\n🕒 Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM\n\n**Services Available:**\n• Gold and Diamond Jewelry\n• Custom Design Services\n• Jewelry Repair and Maintenance\n• Gold Exchange Services\n• Expert Consultation"
      }
    },
    'faq': {
      en: {
        title: "Frequently Asked Questions",
        body: "Find answers to common questions about our products, services, and policies.\n\n**General Questions:**\n\n**Q: What types of jewelry do you offer?**\nA: We offer a wide range of gold and diamond jewelry including rings, necklaces, earrings, bracelets, and custom designs.\n\n**Q: Do you provide certification for your jewelry?**\nA: Yes, all our diamond jewelry comes with proper certification from recognized gemological laboratories.\n\n**Contact Support:**\nIf you don't find the answer to your question here, please contact us at support@srimuruganjewellers.com or call +91 9876543210."
      }
    },
    'offers': {
      en: {
        title: "Current Offers",
        body: "Discover our latest offers and promotions on jewelry and related products. Don't miss out on these exclusive deals!\n\n**🎉 Festival Season Offers (Valid until December 31, 2024):**\n\n**Gold Jewelry Offers:**\n• **20% off** on making charges for gold jewelry above 10 grams\n• **Free gold coin** with purchase of gold jewelry above ₹50,000\n• **Zero making charges** on traditional gold jewelry designs\n\n**Diamond Jewelry Offers:**\n• **15% discount** on all diamond jewelry\n• **Free diamond certificate** with every diamond purchase\n• **EMI options** available with 0% interest for 6 months\n\n**Contact Us:**\nFor more details about our offers, call us at +91 9876543210 or visit our stores."
      }
    },
    'profile': {
      en: {
        title: "Profile",
        body: "Manage your account settings and personal information with Sri Murugan Jewellers.\n\n**Account Information:**\n• Update your personal details\n• Manage your contact information\n• Change your password and security settings\n• View your account history\n\n**Preferences:**\n• Set your preferred language\n• Choose notification preferences\n• Manage privacy settings\n• Customize your shopping experience\n\n**Need Help?**\nIf you need assistance with your profile or account, please contact our support team at support@srimuruganjewellers.com or call +91 9876543210."
      }
    }
  }
};

// Pages to generate content for
const pages = [
  'about-us',
  'privacy-policy',
  'terms-and-conditions',
  'contact-us',
  'our-stores',
  'faq',
  'offers',
  'profile'
];

// Brands to generate content for
const brands = Object.keys(contentTemplates);

/**
 * Generate content files for a specific brand
 * @param {string} brand - Brand name
 */
function generateBrandContent(brand) {
  const brandDir = path.join(__dirname, '..', 'src', 'brands', brand, 'content');
  
  // Create content directory if it doesn't exist
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
    console.log(`✅ Created content directory for ${brand}`);
  }

  const brandTemplates = contentTemplates[brand];
  
  pages.forEach(page => {
    const template = brandTemplates[page];
    if (template) {
      const filePath = path.join(brandDir, `${page}.json`);
      const content = JSON.stringify(template, null, 2);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Generated ${page}.json for ${brand}`);
    } else {
      console.log(`⚠️  No template found for ${page} in ${brand}`);
    }
  });
}

/**
 * Main function to generate content for all brands
 */
function main() {
  console.log('🚀 Starting content generation for all brands...\n');
  
  brands.forEach(brand => {
    console.log(`📝 Generating content for ${brand}:`);
    generateBrandContent(brand);
    console.log('');
  });
  
  console.log('✅ Content generation completed!');
  console.log('\n📋 Generated files:');
  brands.forEach(brand => {
    console.log(`   ${brand}/content/`);
    pages.forEach(page => {
      console.log(`     - ${page}.json`);
    });
  });
  
  console.log('\n🎯 Next steps:');
  console.log('1. Review and customize the generated content files');
  console.log('2. Add more languages (ta, mal) as needed');
  console.log('3. Use the ContentPage component in your screens');
  console.log('4. Test the content loading with different brands');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateBrandContent, contentTemplates }; 