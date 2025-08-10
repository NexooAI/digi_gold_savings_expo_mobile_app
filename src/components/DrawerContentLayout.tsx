import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';
import { theme } from '@/constants/theme';

interface DrawerContentLayoutProps {
  children: React.ReactNode;
  title?: string;
  showLanguageSwitcher?: boolean;
}

const DrawerContentLayout: React.FC<DrawerContentLayoutProps> = ({
  children,
  title,
  showLanguageSwitcher = true,
}) => {
  return (
    <AppLayoutWrapper
      showHeader={true}
      showBottomBar={false}
      headerProps={{
        showBackButton: true,
        showMenu: false,
        showLanguageSwitcher: showLanguageSwitcher,
        title: title,
      }}
    >
      {children}
    </AppLayoutWrapper>
  );
};

export default DrawerContentLayout; 