import React, { createContext, useContext, useEffect } from 'react';
// import useGlobalStore from '@/global.store';
import { AppLocale } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from '@/store/global.store';

type LanguageContextType = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: async () => {}
});

export const LanguageProvider1: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useGlobalStore();

  // Sync with AsyncStorage on mount
  useEffect(() => {
    const initialize = async () => {
      const saved = await AsyncStorage.getItem('user-locale');
      if (saved && saved !== language) {
        await setLanguage(saved as AppLocale);
      }
    };
    initialize();
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      locale: language, 
      setLocale: setLanguage 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);