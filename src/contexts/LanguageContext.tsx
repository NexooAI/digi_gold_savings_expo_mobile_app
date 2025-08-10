import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppLocale, initializeAppLocale, changeLocale } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from '@/store/global.store';

type LanguageContextType = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  isLoading: boolean;
  supportedLocales: AppLocale[];
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => {},
  isLoading: true,
  supportedLocales: ['en', 'mal', 'ta']
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useGlobalStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocale, setCurrentLocale] = useState<AppLocale>('en');

  const supportedLocales: AppLocale[] = ['en', 'mal', 'ta'];

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        const initialLocale = await initializeAppLocale();
        setCurrentLocale(initialLocale);
        
        // Sync with global store if different
        if (initialLocale !== language) {
          await setLanguage(initialLocale);
        }
      } catch (error) {
        console.error('Failed to initialize language:', error);
        // Fallback to English
        setCurrentLocale('en');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  // Sync with global store changes
  useEffect(() => {
    if (language !== currentLocale) {
      setCurrentLocale(language);
    }
  }, [language]);

  const handleSetLocale = async (newLocale: AppLocale) => {
    try {
      await changeLocale(newLocale);
      await setLanguage(newLocale);
      setCurrentLocale(newLocale);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      locale: currentLocale, 
      setLocale: handleSetLocale,
      isLoading,
      supportedLocales
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// Export the old provider name for backward compatibility
export const LanguageProvider1 = LanguageProvider;