import { brandConfig } from './BrandConfig';

/**
 * Content Manager for brand-specific static content
 * Loads content from src/brands/{brand}/content/{page}.json
 */
class ContentManager {
  constructor() {
    this.cache = new Map();
    this.currentBrand = brandConfig.brandName;
  }

  /**
   * Get content for a specific page
   * @param {string} page - The page name (e.g., 'about-us', 'privacy-policy')
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} Content object with title and body
   */
  async getContent(page, language = 'en') {
    const cacheKey = `${this.currentBrand}_${page}_${language}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try to load brand-specific content
      const content = await this.loadBrandContent(page, language);
      this.cache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.warn(`Failed to load content for ${page} in ${language}:`, error);
      
      // Return fallback content
      const fallbackContent = this.getFallbackContent(page, language);
      this.cache.set(cacheKey, fallbackContent);
      return fallbackContent;
    }
  }

  /**
   * Load brand-specific content from JSON file
   * @param {string} page - Page name
   * @param {string} language - Language code
   * @returns {Promise<Object>} Content object
   */
  async loadBrandContent(page, language) {
    const contentPath = `../brands/${this.currentBrand}/content/${page}.json`;
    
    try {
      const contentModule = await import(contentPath);
      const content = contentModule.default || contentModule;
      
      // Handle language-specific content
      if (content[language]) {
        return content[language];
      }
      
      // Fallback to default content
      return content.default || content;
    } catch (error) {
      throw new Error(`Content not found for ${page} in brand ${this.currentBrand}`);
    }
  }

  /**
   * Get fallback content when brand-specific content is not available
   * @param {string} page - Page name
   * @param {string} language - Language code
   * @returns {Object} Fallback content
   */
  getFallbackContent(page, language) {
    const fallbackContent = {
      'about-us': {
        title: 'About Us',
        body: `${brandConfig.company.name} is a trusted name in the jewelry industry, committed to providing quality products and exceptional service to our customers.`
      },
      'privacy-policy': {
        title: 'Privacy Policy',
        body: 'This privacy policy describes how we collect, use, and protect your personal information. We are committed to maintaining the privacy and security of your data.'
      },
      'terms-and-conditions': {
        title: 'Terms and Conditions',
        body: 'By using our services, you agree to these terms and conditions. Please read them carefully before proceeding with any transactions.'
      },
      'contact-us': {
        title: 'Contact Us',
        body: `Get in touch with ${brandConfig.company.name}. We're here to help with any questions or concerns you may have.`
      },
      'our-stores': {
        title: 'Our Stores',
        body: `Visit any of our ${brandConfig.company.name} locations to experience our products and services firsthand.`
      },
      'faq': {
        title: 'Frequently Asked Questions',
        body: 'Find answers to common questions about our products, services, and policies.'
      },
      'offers': {
        title: 'Current Offers',
        body: 'Discover our latest offers and promotions on jewelry and related products.'
      },
      'profile': {
        title: 'Profile',
        body: 'Manage your account settings and personal information.'
      }
    };

    return fallbackContent[page] || {
      title: 'Page Not Found',
      body: 'The requested content could not be found.'
    };
  }

  /**
   * Clear content cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Preload content for multiple pages
   * @param {Array<string>} pages - Array of page names
   * @param {string} language - Language code
   */
  async preloadContent(pages, language = 'en') {
    const promises = pages.map(page => this.getContent(page, language));
    await Promise.all(promises);
  }
}

// Create singleton instance
const contentManager = new ContentManager();

/**
 * Convenience function to get content
 * @param {string} page - Page name
 * @param {string} language - Language code
 * @returns {Promise<Object>} Content object
 */
export const getContent = (page, language = 'en') => {
  return contentManager.getContent(page, language);
};

/**
 * Preload multiple pages
 * @param {Array<string>} pages - Array of page names
 * @param {string} language - Language code
 */
export const preloadContent = (pages, language = 'en') => {
  return contentManager.preloadContent(pages, language);
};

export default contentManager; 