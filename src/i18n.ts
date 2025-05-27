import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
// import ta from './locales/ta.json';
import mal from './locales/mal.json';

export type AppLocale = 'en' | 'mal';
const translations = { en, mal } as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;

// Initialize with saved locale or device locale
export const initializeAppLocale = async () => {
  const saved = await AsyncStorage.getItem('user-locale');
  const deviceLocale = (Localization.locale?.split('-')[0] as AppLocale) || 'en';
  const initialLocale = (saved as AppLocale) || deviceLocale;
  
  i18n.locale = initialLocale;
  return initialLocale;
};

// Function to change locale and save to storage
export const changeLocale = async (locale: AppLocale) => {
  await AsyncStorage.setItem('user-locale', locale);
  i18n.locale = locale;
};

export const t = (key: string) => i18n.t(key);
export default i18n;