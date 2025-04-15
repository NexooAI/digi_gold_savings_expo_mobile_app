import React, { useEffect } from 'react';
import { I18n } from 'i18n-js';
import useGlobalStore from '@/store/global.store';
import i18n from '@/i18n';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { language } = useGlobalStore();

  useEffect(() => {
    // Update i18n locale whenever language changes in global store
    i18n.locale = language;
  }, [language]);

  return <>{children}</>;
};