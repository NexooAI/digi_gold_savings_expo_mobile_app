# Brand-Specific Content System Guide

## 📋 Overview

The brand-specific content system allows you to manage static content for different brands without code duplication. Each brand can have its own content files that are dynamically loaded based on the current brand configuration.

## 🏗️ Architecture

```
src/
├── core/config/
│   ├── BrandConfig.js          # Brand configuration system
│   └── ContentManager.js       # Content loading and caching
├── hooks/
│   └── useContent.ts           # React hooks for content
├── components/
│   └── ContentPage.tsx         # Generic content display component
└── brands/
    ├── akilajewellers/
    │   └── content/
    │       ├── about-us.json
    │       ├── privacy-policy.json
    │       ├── terms-and-conditions.json
    │       ├── contact-us.json
    │       ├── our-stores.json
    │       ├── faq.json
    │       ├── offers.json
    │       └── profile.json
    ├── dc-jewellers/
    │   └── content/
    │       └── [same structure]
    └── srimurugan/
        └── content/
            └── [same structure]
```

## 📄 Content File Format

Each content file follows this JSON structure:

```json
{
  "en": {
    "title": "Page Title",
    "body": "Page content with markdown support..."
  },
  "ta": {
    "title": "தமிழ் தலைப்பு",
    "body": "தமிழ் உள்ளடக்கம்..."
  },
  "mal": {
    "title": "മലയാളം ശീർഷകം",
    "body": "മലയാളം ഉള്ളടக്കം..."
  }
}
```

### Supported Pages

- `about-us` - About Us page
- `privacy-policy` - Privacy Policy page
- `terms-and-conditions` - Terms and Conditions page
- `contact-us` - Contact Us page
- `our-stores` - Store locations page
- `faq` - Frequently Asked Questions page
- `offers` - Current offers and promotions
- `profile` - User profile information

## 🚀 Usage

### 1. Using the ContentPage Component

The easiest way to display brand-specific content:

```tsx
import React from 'react';
import { ContentPage } from '../components/ContentPage';

const AboutUsScreen = () => {
  return (
    <ContentPage 
      page="about-us"
      showTitle={true}
      customStyles={{
        container: { backgroundColor: '#f5f5f5' },
        title: { color: '#333' },
        body: { fontSize: 16 }
      }}
    />
  );
};
```

### 2. Using the useContent Hook

For more control over content loading:

```tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useContent } from '../hooks/useContent';

const CustomContentScreen = () => {
  const { content, loading, error, refresh } = useContent('about-us');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
        <Text onPress={refresh}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        {content?.title}
      </Text>
      <Text>{content?.body}</Text>
    </View>
  );
};
```

### 3. Preloading Content

For better performance, preload multiple pages:

```tsx
import React from 'react';
import { usePreloadContent } from '../hooks/useContent';

const AppInitializer = () => {
  const { loading, error } = usePreloadContent([
    'about-us',
    'privacy-policy',
    'terms-and-conditions',
    'contact-us'
  ]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return <MainApp />;
};
```

## 🔧 Content Management

### Adding New Content Files

1. Create a new JSON file in the brand's content directory:
   ```
   src/brands/{brand}/content/new-page.json
   ```

2. Follow the content format:
   ```json
   {
     "en": {
       "title": "New Page",
       "body": "Content here..."
     },
     "ta": {
       "title": "புதிய பக்கம்",
       "body": "உள்ளடக்கம் இங்கே..."
     }
   }
   ```

3. Use the content in your component:
   ```tsx
   const { content } = useContent('new-page');
   ```

### Adding New Languages

1. Add the new language code to your content files:
   ```json
   {
     "en": { "title": "...", "body": "..." },
     "ta": { "title": "...", "body": "..." },
     "mal": { "title": "...", "body": "..." },
     "hi": { "title": "...", "body": "..." }  // New language
   }
   ```

2. Update your language context to support the new language.

### Adding New Brands

1. Create the brand directory structure:
   ```
   src/brands/new-brand/
   ├── config/
   ├── assets/
   ├── locales/
   └── content/
       ├── about-us.json
       ├── privacy-policy.json
       └── [other pages...]
   ```

2. Use the content generation script:
   ```bash
   node scripts/generate-content.js
   ```

## 🛠️ Content Generation Script

The `scripts/generate-content.js` script automatically generates content files for all brands:

```bash
# Generate content for all brands
node scripts/generate-content.js

# Generate content for specific brand (programmatically)
const { generateBrandContent } = require('./scripts/generate-content');
generateBrandContent('new-brand');
```

### Customizing Templates

Edit the `contentTemplates` object in `scripts/generate-content.js` to customize content for different brands:

```javascript
const contentTemplates = {
  'new-brand': {
    'about-us': {
      en: {
        title: "About New Brand",
        body: "Custom content for new brand..."
      }
    }
    // ... other pages
  }
};
```

## 🎨 Styling and Customization

### Custom Styles with ContentPage

```tsx
<ContentPage 
  page="about-us"
  customStyles={{
    container: { 
      backgroundColor: '#f8f9fa',
      padding: 20 
    },
    title: { 
      color: brandTheme.colors.primary,
      fontSize: 28,
      textAlign: 'left'
    },
    body: { 
      color: '#333',
      lineHeight: 26,
      fontFamily: 'System'
    }
  }}
/>
```

### Markdown Support

Content supports basic markdown formatting:

```json
{
  "en": {
    "title": "About Us",
    "body": "**Bold text** and *italic text*\n\n- Bullet point 1\n- Bullet point 2\n\n**Contact Information:**\n• Phone: +91 1234567890\n• Email: info@example.com"
  }
}
```

## 🔄 Caching and Performance

- Content is automatically cached in memory
- Cache is cleared when switching brands
- Use `usePreloadContent` for better performance
- Content files are loaded dynamically (lazy loading)

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Content not found**: Falls back to default content
- **Network errors**: Shows retry option
- **Invalid JSON**: Logs error and shows fallback
- **Missing languages**: Falls back to English

## 📱 Integration with Existing Screens

### Example: About Us Screen

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContentPage } from '../components/ContentPage';
import { brandTheme } from '../core/config/BrandConfig';

const AboutUsScreen = () => {
  return (
    <View style={styles.container}>
      <ContentPage 
        page="about-us"
        customStyles={{
          container: styles.contentContainer,
          title: styles.title,
          body: styles.body
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandTheme.colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    color: brandTheme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  body: {
    color: brandTheme.colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AboutUsScreen;
```

## 🧪 Testing

### Testing Content Loading

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { ContentPage } from '../components/ContentPage';

test('loads content correctly', async () => {
  const { getByText } = render(<ContentPage page="about-us" />);
  
  await waitFor(() => {
    expect(getByText('About Us')).toBeTruthy();
  });
});
```

### Testing Different Brands

```tsx
// Set brand environment variable
process.env.BRAND_NAME = 'dc-jewellers';

// Test content loading
const { content } = useContent('about-us');
expect(content?.title).toBe('About Us');
```

## 📚 Best Practices

1. **Content Organization**: Keep content files organized by page
2. **Language Support**: Always include English as fallback
3. **Performance**: Preload frequently accessed content
4. **Error Handling**: Always handle loading and error states
5. **Brand Consistency**: Maintain consistent tone across all content
6. **Accessibility**: Ensure content is accessible in all languages
7. **Version Control**: Track content changes in version control
8. **Testing**: Test content loading for all brands and languages

## 🔗 Related Files

- `src/core/config/ContentManager.js` - Content loading logic
- `src/hooks/useContent.ts` - React hooks for content
- `src/components/ContentPage.tsx` - Generic content component
- `scripts/generate-content.js` - Content generation script
- `src/contexts/LanguageContext.tsx` - Language management

## 🆘 Troubleshooting

### Common Issues

1. **Content not loading**: Check file path and JSON format
2. **Language not switching**: Verify language context setup
3. **Brand not changing**: Check brand configuration
4. **Performance issues**: Use content preloading
5. **Styling problems**: Check custom styles object

### Debug Mode

Enable debug logging in ContentManager:

```javascript
// In ContentManager.js
const DEBUG = true;

if (DEBUG) {
  console.log(`Loading content for ${page} in ${language}`);
}
```

## 📈 Future Enhancements

- **CMS Integration**: Connect to external CMS
- **Rich Text Editor**: Visual content editing
- **Content Versioning**: Track content changes
- **A/B Testing**: Test different content versions
- **Analytics**: Track content performance
- **Offline Support**: Cache content for offline use
- **Content Scheduling**: Schedule content updates
- **Multi-media Support**: Images and videos in content

---

This content system provides a robust, scalable solution for managing brand-specific content across your whitelabel application. Follow the guidelines above to ensure consistent, maintainable content management. 