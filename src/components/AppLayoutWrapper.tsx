import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/app/components/AppHeader';
import CustomBottomBar from '@/common/components/navigation/CustomBottomBar';
import FloatingHomeButton from '@/components/FloatingHomeButton';
import { theme } from '@/constants/theme';
import useGlobalStore from '@/store/global.store';
import { usePathname } from 'expo-router';
import { shouldHideTabs } from '@/config/navigation';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomBar?: boolean;
  headerProps?: {
    showBackButton?: boolean;
    showMenu?: boolean; // new name replacing showDrawerToggle
    backRoute?: string;
    showLanguageSwitcher?: boolean;
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
  const { headerConfig, isTabVisible } = useGlobalStore();
  const pathname = usePathname();
  const current = pathname.split('/').pop() || 'home';
  const hideByRoute = shouldHideTabs(current);

  // State for dynamic header height measurement
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [isHeaderMeasured, setIsHeaderMeasured] = useState<boolean>(false);

  const shouldShowBottomBar = showBottomBar && isTabVisible && !hideByRoute;

  // Resolve header flags with sensible defaults, allowing global overrides.
  const resolvedShowHeader = headerConfig?.showHeader !== undefined ? headerConfig.showHeader : showHeader;
  
  const resolvedShowLanguageSwitcher =
    (headerConfig?.showLanguageSwitcher !== undefined
      ? headerConfig.showLanguageSwitcher
      : headerProps.showLanguageSwitcher) ?? true;

  const resolvedShowMenu =
    (headerConfig?.showMenu !== undefined ? headerConfig.showMenu : headerProps.showMenu) ??
    // backward compatibility: allow legacy showDrawerToggle from callers
    ((headerProps as any).showDrawerToggle !== undefined
      ? (headerProps as any).showDrawerToggle
      : true);

  const resolvedShowBackButton =
    (headerConfig?.showBackButton !== undefined
      ? headerConfig.showBackButton
      : headerProps.showBackButton) ?? false;

  const resolvedTitle = headerConfig?.title ?? headerProps.title;
  const resolvedBackRoute = headerConfig?.backRoute ?? headerProps.backRoute;
  const resolvedGoldRateInfo = headerConfig?.goldRateInfo ?? headerProps.goldRateInfo;
  const resolvedGoldRateUpdatedAt = headerConfig?.goldRateUpdatedAt ?? headerProps.goldRateUpdatedAt;

  // Callback to measure header height dynamically
  const handleHeaderLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
    setIsHeaderMeasured(true);
  }, []);

  // Calculate dynamic content positioning
  const getContentPaddingTop = () => {
    if (!resolvedShowHeader || !isHeaderMeasured) {
      return insets.top;
    }
    // Content starts immediately below the header with minimal spacing
    return headerHeight + 0; // 8px minimal spacing for visual separation
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={Platform.OS === 'android'}
      />
      
      {/* Header */}
      {resolvedShowHeader && (
        <View 
          style={[
            styles.headerContainer,
            {
              paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
            }
          ]}
          onLayout={handleHeaderLayout}
        >
          <AppHeader
            showBackButton={resolvedShowBackButton}
            backRoute={resolvedBackRoute}
            showLanguageSwitcher={resolvedShowLanguageSwitcher}
            showDrawerToggle={resolvedShowMenu}
            goldRateInfo={resolvedGoldRateInfo}
            goldRateUpdatedAt={resolvedGoldRateUpdatedAt}
            title={resolvedTitle}
            transactionDetails={headerConfig?.transactionDetails}
          />
        </View>
      )}
      
      {/* Content Area */}
      <View 
        style={[
          styles.contentContainer,
          {
            paddingTop: getContentPaddingTop(),
            paddingBottom: shouldShowBottomBar ? 0 : insets.bottom,
          }
        ]}
      >
        {children}
      </View>
      
      {/* Bottom Bar */}
      {shouldShowBottomBar ? (
        <View
          style={[
            styles.bottomBarContainer,
            {
              paddingBottom: 0,
              height: 80,
            }
          ]}
        >
          <CustomBottomBar />
        </View>
      ) : null}
      
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
  const { headerConfig } = useGlobalStore();
  
  // Resolve header visibility with global store override
  const resolvedShowHeader = headerConfig?.showHeader !== undefined ? headerConfig.showHeader : showHeader;
  
  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={styles.safeArea} 
        edges={resolvedShowHeader ? ['left', 'right'] : ['top', 'left', 'right']}
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