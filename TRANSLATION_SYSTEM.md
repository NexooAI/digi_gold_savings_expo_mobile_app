# DC Jewellers Translation System

## Overview
The DC Jewellers mobile app supports three languages: English, Malayalam (മലയാളം), and Tamil (தமிழ்). The translation system is built using i18next and provides a seamless multilingual experience.

## Features

### 🌍 Supported Languages
- **English (en)** - Primary language
- **Malayalam (mal)** - Regional language for Kerala
- **Tamil (ta)** - Regional language for Tamil Nadu

### 🔧 Core Components

#### 1. i18n Configuration (`src/i18n.ts`)
- Centralized translation configuration
- Language detection and initialization
- Async storage for language persistence

#### 2. Language Context (`src/contexts/LanguageContext.tsx`)
- React Context for language state management
- Language switching functionality
- Loading states and error handling

#### 3. Translation Hook (`src/hooks/useTranslation.ts`)
- Easy-to-use hook for accessing translations
- Language state and utility functions
- Type-safe translation access

#### 4. Language Utilities (`src/utils/languageUtils.ts`)
- Language name and flag utilities
- Number, currency, and date formatting
- RTL support detection

### 🎨 UI Components

#### Language Switcher (`src/contexts/LanguageSwitcher.tsx`)
- Compact language display with current language
- Quick access to language selection

#### Language Selector (`src/components/LanguageSelector.tsx`)
- Modal-based language selection
- Visual language representation with flags
- Smooth animations and user feedback

## Usage

### Basic Translation
```tsx
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('welcome_message')}</Text>
  );
};
```

### Language Switching
```tsx
import { useTranslation } from '@/hooks/useTranslation';

const LanguageComponent = () => {
  const { locale, setLocale, supportedLocales } = useTranslation();
  
  const changeLanguage = async (newLocale: string) => {
    await setLocale(newLocale as any);
  };
  
  return (
    <View>
      <Text>Current: {locale}</Text>
      {supportedLocales.map(lang => (
        <Button 
          key={lang} 
          title={lang} 
          onPress={() => changeLanguage(lang)} 
        />
      ))}
    </View>
  );
};
```

### Formatting Utilities
```tsx
import { formatCurrency, formatDate } from '@/utils/languageUtils';

const FormattingExample = () => {
  const { locale } = useTranslation();
  
  const formattedPrice = formatCurrency(1500, locale, 'INR');
  const formattedDate = formatDate(new Date(), locale);
  
  return (
    <View>
      <Text>Price: {formattedPrice}</Text>
      <Text>Date: {formattedDate}</Text>
    </View>
  );
};
```

## Translation Files

### Structure
```
src/locales/
├── en.json      # English translations
├── mal.json     # Malayalam translations
└── ta.json      # Tamil translations
```

### Adding New Translations
1. Add the translation key to all three locale files
2. Use the `t()` function in your components
3. Ensure consistent naming conventions

### Example Translation Entry
```json
{
  "welcome_message": "Welcome to DC Jewellers",
  "schemes": {
    "title": "Gold Schemes",
    "description": "Save gold with our flexible plans"
  }
}
```

## Best Practices

### 1. Translation Keys
- Use descriptive, hierarchical keys
- Maintain consistency across languages
- Avoid hardcoded strings

### 2. Pluralization
- Use i18next pluralization features
- Handle different plural rules for each language

### 3. Context
- Provide context for translators
- Use interpolation for dynamic values
- Consider cultural differences

### 4. Performance
- Lazy load language files
- Cache translations appropriately
- Minimize re-renders

## Troubleshooting

### Common Issues
1. **Missing translations**: Check if the key exists in all locale files
2. **Language not persisting**: Verify AsyncStorage permissions
3. **Formatting issues**: Check locale-specific formatting functions

### Debug Mode
Enable debug mode in i18n configuration to see missing translations:
```tsx
debug: __DEV__,
```

## Future Enhancements

### Planned Features
- [ ] RTL language support (Arabic, Hebrew)
- [ ] Dynamic language loading
- [ ] Translation memory
- [ ] Automated translation suggestions
- [ ] Voice-based language switching

### Contributing
To add a new language:
1. Create new locale file (`xx.json`)
2. Add language to `AppLocale` type
3. Update language utilities
4. Test with native speakers

## Support

For translation-related issues or questions, please contact the development team or refer to the i18next documentation: https://www.i18next.com/ 