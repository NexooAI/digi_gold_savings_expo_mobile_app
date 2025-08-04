import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/app/components/AppHeader';
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
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Status Bar */}
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
          translucent={Platform.OS === 'android'}
        />
        
        {/* Header */}
        <View style={[
          styles.headerContainer,
          {
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
            height: (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top) + 60,
          }
        ]}>
          <AppHeader
            showBackButton={true}
            showLanguageSwitcher={showLanguageSwitcher}
            showDrawerToggle={false}
            title={title}
          />
        </View>
        
        {/* Content Area */}
        <View style={[
          styles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: insets.bottom,
          }
        ]}>
          {children}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
});

export default DrawerContentLayout; 