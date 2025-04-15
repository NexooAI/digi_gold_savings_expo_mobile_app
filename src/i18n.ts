import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import useGlobalStore from './global.store';

// Import translations
import en from './locales/en.json';
import ta from './locales/ta.json';
import useGlobalStore from './store/global.store';

export type AppLocale = 'en' | 'ta';
const translations = { en, ta } as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;

// Initialize with store value
export const initializeAppLocale = async () => {
  const saved = await AsyncStorage.getItem('user-locale');
  const deviceLocale = (Localization.locale?.split('-')[0] as AppLocale) || 'en';
  const initialLocale = (saved as AppLocale) || deviceLocale;
  
  // Update both store and i18n
  useGlobalStore.getState().setLanguage(initialLocale);
  i18n.locale = initialLocale;
};

export const t = (key: string) => i18n.t(key);
export default i18n;