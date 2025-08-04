import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/app/components/AppHeader';
import CustomBottomBar from '@/common/components/navigation/CustomBottomBar';
import FloatingHomeButton from '@/components/FloatingHomeButton';
import { theme } from '@/constants/theme';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomBar?: boolean;
  headerProps?: {
    showBackButton?: boolean;
    backRoute?: string;
    showLanguageSwitcher?: boolean;
    showDrawerToggle?: boolean;
    goldRateInfo?: {
      rate: string;
      purity: string;
    };
    goldRateUpdatedAt?: string;
    title?: string;
  };
}

const AppLayoutContent: React.FC<AppLayoutWrapperProps> = ({
  children,
  showHeader = true,
  showBottomBar = true,
  headerProps = {},
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={Platform.OS === 'android'}
      />
      
      {/* Header */}
      {showHeader && (
        <View style={[
          styles.headerContainer,
          {
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
            height: (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top) + 60, // 60px for header content
          }
        ]}>
          <AppHeader
            showBackButton={headerProps.showBackButton || false}
            backRoute={headerProps.backRoute}
            showLanguageSwitcher={headerProps.showLanguageSwitcher || true}
            showDrawerToggle={headerProps.showDrawerToggle || true}
            goldRateInfo={headerProps.goldRateInfo}
            goldRateUpdatedAt={headerProps.goldRateUpdatedAt}
            title={headerProps.title}
          />
        </View>
      )}
      
      {/* Content Area */}
      <View 
        style={[
          styles.contentContainer,
          {
            paddingTop: showHeader ? 0 : insets.top,
            paddingBottom: showBottomBar ? 0 : insets.bottom, // Remove bottom padding when bottom bar is shown
          }
        ]}
      >
        {children}
      </View>
      
      {/* Bottom Bar */}
      {showBottomBar && (
        <View style={[
          styles.bottomBarContainer,
          {
            paddingBottom: 0, // Remove padding to make it flush with bottom
            height: 80, // Fixed height without safe area padding
          }
        ]}>
          <CustomBottomBar />
        </View>
      )}
      
      {/* Floating Home Button - Shows only when bottom bar is hidden */}
      <FloatingHomeButton />
    </View>
  );
};

const AppLayoutWrapper: React.FC<AppLayoutWrapperProps> = ({
  children,
  showHeader = true,
  showBottomBar = true,
  headerProps = {},
}) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={styles.safeArea} 
        edges={showHeader ? ['left', 'right'] : ['top', 'left', 'right']}
      >
        <AppLayoutContent 
          showHeader={showHeader}
          showBottomBar={showBottomBar}
          headerProps={headerProps}
        >
          {children}
        </AppLayoutContent>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
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
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: 'transparent',
    marginBottom: 0, // Ensure no bottom margin
  },
});

export default AppLayoutWrapper; 