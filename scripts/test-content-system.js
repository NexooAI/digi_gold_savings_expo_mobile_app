#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mock environment for testing
process.env.BRAND_NAME = 'akilajewellers';

// Import the ContentManager (we'll need to mock some dependencies)
const { getContent } = require('../src/core/config/ContentManager');

/**
 * Test the content system
 */
async function testContentSystem() {
  console.log('🧪 Testing Brand-Specific Content System...\n');

  const testCases = [
    {
      page: 'about-us',
      expectedTitle: 'About Us',
      description: 'About Us page content'
    },
    {
      page: 'privacy-policy',
      expectedTitle: 'Privacy Policy',
      description: 'Privacy Policy page content'
    },
    {
      page: 'contact-us',
      expectedTitle: 'Contact Us',
      description: 'Contact Us page content'
    },
    {
      page: 'faq',
      expectedTitle: 'Frequently Asked Questions',
      description: 'FAQ page content'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: ${testCase.description}`);
      
      // Test content file existence
      const contentPath = path.join(__dirname, '..', 'src', 'brands', 'akilajewellers', 'content', `${testCase.page}.json`);
      const fileExists = fs.existsSync(contentPath);
      
      if (!fileExists) {
        console.log(`❌ FAIL: Content file not found: ${testCase.page}.json`);
        continue;
      }

      // Test JSON format
      const contentFile = fs.readFileSync(contentPath, 'utf8');
      const content = JSON.parse(contentFile);
      
      if (!content.en || !content.en.title || !content.en.body) {
        console.log(`❌ FAIL: Invalid JSON format for ${testCase.page}.json`);
        continue;
      }

      // Test expected title
      if (content.en.title !== testCase.expectedTitle) {
        console.log(`❌ FAIL: Expected title "${testCase.expectedTitle}", got "${content.en.title}"`);
        continue;
      }

      // Test content length
      if (content.en.body.length < 50) {
        console.log(`❌ FAIL: Content too short for ${testCase.page}`);
        continue;
      }

      // Test multilingual support
      const hasTamil = content.ta && content.ta.title && content.ta.body;
      const hasMalayalam = content.mal && content.mal.title && content.mal.body;
      
      console.log(`✅ PASS: ${testCase.page}.json`);
      console.log(`   - Title: "${content.en.title}"`);
      console.log(`   - Content length: ${content.en.body.length} characters`);
      console.log(`   - Tamil support: ${hasTamil ? '✅' : '❌'}`);
      console.log(`   - Malayalam support: ${hasMalayalam ? '✅' : '❌'}`);
      
      passedTests++;
      
    } catch (error) {
      console.log(`❌ FAIL: Error testing ${testCase.page}: ${error.message}`);
    }
    
    console.log('');
  }

  // Test content directory structure
  console.log('📁 Testing content directory structure...');
  
  const brands = ['akilajewellers', 'dc-jewellers', 'srimurugan'];
  const pages = ['about-us', 'privacy-policy', 'terms-and-conditions', 'contact-us', 'our-stores', 'faq', 'offers', 'profile'];
  
  let structureTests = 0;
  let totalStructureTests = 0;

  for (const brand of brands) {
    const brandContentDir = path.join(__dirname, '..', 'src', 'brands', brand, 'content');
    
    if (fs.existsSync(brandContentDir)) {
      console.log(`✅ Brand directory exists: ${brand}/content/`);
      structureTests++;
    } else {
      console.log(`❌ Brand directory missing: ${brand}/content/`);
    }
    
    totalStructureTests++;

    // Check individual files
    for (const page of pages) {
      const filePath = path.join(brandContentDir, `${page}.json`);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${page}.json`);
        structureTests++;
      } else {
        console.log(`   ❌ ${page}.json (missing)`);
      }
      totalStructureTests++;
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Content Tests: ${passedTests}/${totalTests} passed`);
  console.log(`   Structure Tests: ${structureTests}/${totalStructureTests} passed`);
  
  const overallPassRate = ((passedTests + structureTests) / (totalTests + totalStructureTests) * 100).toFixed(1);
  console.log(`   Overall Pass Rate: ${overallPassRate}%`);

  if (passedTests === totalTests && structureTests === totalStructureTests) {
    console.log('\n🎉 All tests passed! Content system is working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    return false;
  }
}

/**
 * Test content generation script
 */
function testContentGeneration() {
  console.log('🛠️  Testing content generation script...\n');
  
  try {
    const { generateBrandContent, contentTemplates } = require('./generate-content');
    
    // Test if templates exist
    const brands = Object.keys(contentTemplates);
    console.log(`✅ Found ${brands.length} brand templates: ${brands.join(', ')}`);
    
    // Test if pages exist
    const pages = ['about-us', 'privacy-policy', 'terms-and-conditions', 'contact-us', 'our-stores', 'faq', 'offers', 'profile'];
    console.log(`✅ Found ${pages.length} page templates: ${pages.join(', ')}`);
    
    // Test template structure
    let templateTests = 0;
    let totalTemplateTests = 0;
    
    for (const brand of brands) {
      for (const page of pages) {
        if (contentTemplates[brand] && contentTemplates[brand][page]) {
          const template = contentTemplates[brand][page];
          if (template.en && template.en.title && template.en.body) {
            console.log(`✅ Template valid: ${brand}/${page}`);
            templateTests++;
          } else {
            console.log(`❌ Template invalid: ${brand}/${page}`);
          }
        } else {
          console.log(`❌ Template missing: ${brand}/${page}`);
        }
        totalTemplateTests++;
      }
    }
    
    console.log(`\n📊 Template Tests: ${templateTests}/${totalTemplateTests} passed`);
    
    return templateTests === totalTemplateTests;
    
  } catch (error) {
    console.log(`❌ Error testing content generation: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting Content System Tests...\n');
  
  const contentTestsPassed = await testContentSystem();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const generationTestsPassed = testContentGeneration();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Final Results:');
  console.log(`   Content System: ${contentTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Content Generation: ${generationTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (contentTestsPassed && generationTestsPassed) {
    console.log('\n🎉 All systems are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some systems need attention.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testContentSystem, testContentGeneration }; 