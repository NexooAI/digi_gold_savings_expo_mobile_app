import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import brand-specific translations
import { brandConfig } from './core/config/BrandConfig';

// Import all possible brand locales statically
import dcJewellersEn from './brands/dc-jewellers/locales/en.json';
import dcJewellersTa from './brands/dc-jewellers/locales/ta.json';
import dcJewellersMal from './brands/dc-jewellers/locales/mal.json';

import akilaJewellersEn from './brands/akilajewellers/locales/en.json';
import akilaJewellersTa from './brands/akilajewellers/locales/ta.json';
import akilaJewellersMal from './brands/akilajewellers/locales/mal.json';

// Fallback locales
import fallbackEn from './locales/en.json';
import fallbackTa from './locales/ta.json';
import fallbackMal from './locales/mal.json';

// Brand-specific locale mappings
const brandLocales: Record<string, { en: any; ta: any; mal: any }> = {
  'dc-jewellers': {
    en: dcJewellersEn,
    ta: dcJewellersTa,
    mal: dcJewellersMal,
  },
  'akilajewellers': {
    en: akilaJewellersEn,
    ta: akilaJewellersTa,
    mal: akilaJewellersMal,
  },
};

// Get brand-specific locales or fallback to default
const getBrandLocales = () => {
  const brandName = brandConfig.BRAND_NAME || 'dc-jewellers';
  const brandLocale = brandLocales[brandName];
  
  if (brandLocale) {
    return brandLocale;
  }
  
  console.warn(`Brand locales not found for: ${brandName}, using fallback locales`);
  return {
    en: fallbackEn,
    ta: fallbackTa,
    mal: fallbackMal,
  };
};

const { en, ta, mal } = getBrandLocales();

export type AppLocale = 'en' | 'mal' | 'ta';
const translations = { en, mal, ta } as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;

// Initialize with saved locale or device locale
export const initializeAppLocale = async () => {
  const saved = await AsyncStorage.getItem('user-locale');
  const deviceLocale = Localization.getLocales()?.[0]?.languageCode;
  
  // Only use device locale if it's one of our supported locales
  const supportedLocales: AppLocale[] = ['en', 'mal', 'ta'];
  const validDeviceLocale = supportedLocales.includes(deviceLocale as AppLocale) 
    ? (deviceLocale as AppLocale) 
    : 'en';
  
  const initialLocale = (saved as AppLocale) || validDeviceLocale;
  
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