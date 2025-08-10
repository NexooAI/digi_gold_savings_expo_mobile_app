import { AppLocale } from '@/i18n';

export const getLanguageName = (locale: AppLocale): string => {
  switch (locale) {
    case 'en':
      return 'English';
    case 'mal':
      return 'മലയാളം';
    case 'ta':
      return 'தமிழ்';
    default:
      return 'English';
  }
};

export const getLanguageFlag = (locale: AppLocale): string => {
  switch (locale) {
    case 'en':
      return '🇺🇸';
    case 'mal':
      return '🇮🇳';
    case 'ta':
      return '🇮🇳';
    default:
      return '🇺🇸';
  }
};

export const isRTL = (locale: AppLocale): boolean => {
  // Currently no RTL languages supported
  return false;
};

export const formatNumber = (number: number, locale: AppLocale): string => {
  const localeMap = {
    en: 'en-IN',
    mal: 'ml-IN',
    ta: 'ta-IN',
  };

  return new Intl.NumberFormat(localeMap[locale]).format(number);
};

export const formatCurrency = (amount: number, locale: AppLocale, currency: string = 'INR'): string => {
  const localeMap = {
    en: 'en-IN',
    mal: 'ml-IN',
    ta: 'ta-IN',
  };

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: Date, locale: AppLocale): string => {
  const localeMap = {
    en: 'en-IN',
    mal: 'ml-IN',
    ta: 'ta-IN',
  };

  return new Intl.DateTimeFormat(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}; 