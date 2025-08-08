import { brandHomeStyles, getCurrentBrand } from '@/core/config/BrandConfig';
import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

/**
 * Utility function to create brand-specific styles from JSON configuration
 */
export const createBrandedStyles = (theme: any) => {
  const currentBrand = getCurrentBrand();
  const homeStyles = brandHomeStyles?.homePage;

  if (!homeStyles) {
    console.warn(`No home styles found for brand: ${currentBrand}`);
    return StyleSheet.create({});
  }

  return StyleSheet.create({
    // Safe area and background
    safeArea: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    mainContainer: {
      flex: 1,
      backgroundColor: homeStyles.background?.overlay || "rgba(255, 255, 255, 0.1)",
    },
    animatedContainer: {
      flex: 1,
    },

    // Header
    headerWrapper: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 0,
    },
    languageSwitcherHeader: {
      marginLeft: 10,
    },

    // Scroll view
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
    },
    mainContent: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: 0,
      marginHorizontal: 0,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      textAlign: "center",
      color: theme.colors.textPrimary,
      fontSize: moderateScale(14),
      paddingVertical: moderateScale(20),
    },

    // User info card
    userInfoCard: {
      width: "90%",
      backgroundColor: homeStyles.userInfoCard?.backgroundColor || theme.colors.primary,
      borderRadius: homeStyles.userInfoCard?.borderRadius || 20,
      padding: moderateScale(homeStyles.userInfoCard?.padding || 20),
      marginTop: moderateScale(homeStyles.userInfoCard?.marginTop || 20),
      shadowColor: homeStyles.userInfoCard?.shadow?.color || theme.colors.primary,
      shadowOffset: homeStyles.userInfoCard?.shadow?.offset || { width: 0, height: 4 },
      shadowOpacity: homeStyles.userInfoCard?.shadow?.opacity || 0.3,
      shadowRadius: homeStyles.userInfoCard?.shadow?.radius || 8,
      elevation: homeStyles.userInfoCard?.shadow?.elevation || 6,
    },
    userInfoContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    userInfoLeft: {
      flex: 1,
    },
    welcomeText: {
      fontSize: moderateScale(homeStyles.userInfoCard?.text?.welcome?.fontSize || 16),
      color: homeStyles.userInfoCard?.text?.welcome?.color || theme.colors.textLight,
      fontWeight: homeStyles.userInfoCard?.text?.welcome?.fontWeight || "400",
      marginBottom: moderateScale(4),
    },
    userName: {
      fontSize: moderateScale(homeStyles.userInfoCard?.text?.userName?.fontSize || 20),
      fontWeight: homeStyles.userInfoCard?.text?.userName?.fontWeight || "700",
      color: homeStyles.userInfoCard?.text?.userName?.color || theme.colors.textPrimary,
      marginBottom: moderateScale(8),
    },
    schemesCount: {
      fontSize: moderateScale(homeStyles.userInfoCard?.text?.schemesCount?.fontSize || 14),
      color: homeStyles.userInfoCard?.text?.schemesCount?.color || theme.colors.textLight,
      opacity: homeStyles.userInfoCard?.text?.schemesCount?.opacity || 0.8,
    },
    userInfoRight: {
      alignItems: "flex-end",
    },
    profileImage: {
      width: homeStyles.userInfoCard?.profileImage?.width || 50,
      height: homeStyles.userInfoCard?.profileImage?.height || 50,
      borderRadius: homeStyles.userInfoCard?.profileImage?.borderRadius || 25,
      backgroundColor: homeStyles.userInfoCard?.profileImage?.backgroundColor || theme.colors.secondary,
      marginBottom: moderateScale(8),
    },
    totalGoldText: {
      fontSize: moderateScale(homeStyles.userInfoCard?.text?.totalGold?.fontSize || 12),
      color: homeStyles.userInfoCard?.text?.totalGold?.color || theme.colors.textLight,
      opacity: homeStyles.userInfoCard?.text?.totalGold?.opacity || 0.7,
    },
    totalGoldValue: {
      fontSize: moderateScale(homeStyles.userInfoCard?.text?.totalGoldValue?.fontSize || 16),
      fontWeight: homeStyles.userInfoCard?.text?.totalGoldValue?.fontWeight || "600",
      color: homeStyles.userInfoCard?.text?.totalGoldValue?.color || theme.colors.secondary,
    },

    // Rates container
    ratesContainer: {
      marginTop: moderateScale(homeStyles.ratesContainer?.marginTop || 20),
      paddingHorizontal: moderateScale(homeStyles.ratesContainer?.paddingHorizontal || 16),
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      marginVertical: 0,
      backgroundColor: homeStyles.ratesContainer?.backgroundColor || "transparent",
    },

    // Schemes section
    schemesSection: {
      width: "100%",
      marginTop: moderateScale(homeStyles.schemesSection?.marginTop || 20),
    },
    sectionHeader: {
      paddingHorizontal: moderateScale(homeStyles.schemesSection?.sectionHeader?.paddingHorizontal || 20),
      marginBottom: moderateScale(homeStyles.schemesSection?.sectionHeader?.marginBottom || 15),
    },
    sectionHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateScale(8),
    },
    sectionHeaderText: {
      fontSize: moderateScale(homeStyles.schemesSection?.sectionHeader?.text?.title?.fontSize || 20),
      fontWeight: homeStyles.schemesSection?.sectionHeader?.text?.title?.fontWeight || "700",
      color: homeStyles.schemesSection?.sectionHeader?.text?.title?.color || theme.colors.textPrimary,
      marginRight: moderateScale(10),
    },
    sectionHeaderLine: {
      flex: 1,
      height: homeStyles.schemesSection?.sectionHeader?.line?.height || 2,
      backgroundColor: homeStyles.schemesSection?.sectionHeader?.line?.backgroundColor || theme.colors.secondary,
      borderRadius: homeStyles.schemesSection?.sectionHeader?.line?.borderRadius || 1,
    },
    sectionHeaderSubtext: {
      fontSize: moderateScale(homeStyles.schemesSection?.sectionHeader?.text?.subtitle?.fontSize || 14),
      color: homeStyles.schemesSection?.sectionHeader?.text?.subtitle?.color || theme.colors.textLight,
      opacity: homeStyles.schemesSection?.sectionHeader?.text?.subtitle?.opacity || 0.8,
    },

    // Banner container
    bannerContainer: {
      width: "100%",
      marginVertical: 10,
      paddingHorizontal: 10,
    },
    bannerListContent: {
      paddingHorizontal: 10,
      paddingRight: 30,
    },

    // Spacer
    spacer: {
      height: moderateScale(80),
    },
  });
};

/**
 * Create brand-specific banner card styles
 */
export const createBannerCardStyles = (theme: any) => {
  const homeStyles = brandHomeStyles?.homePage?.bannerCard;
  
  if (!homeStyles) {
    return StyleSheet.create({});
  }

  return StyleSheet.create({
    bannerCard: {
      backgroundColor: homeStyles.backgroundColor || '#ffffff',
      borderRadius: homeStyles.borderRadius || 20,
      marginHorizontal: homeStyles.marginHorizontal || 5,
      marginBottom: homeStyles.marginBottom || 8,
      shadowColor: homeStyles.shadow?.color || '#FFD700',
      shadowOffset: homeStyles.shadow?.offset || { width: 0, height: 4 },
      shadowOpacity: homeStyles.shadow?.opacity || 0.12,
      shadowRadius: homeStyles.shadow?.radius || 12,
      elevation: homeStyles.shadow?.elevation || 6,
      width: homeStyles.width || '85%',
      alignItems: 'center',
      overflow: 'hidden',
      paddingBottom: homeStyles.paddingBottom || 16,
    },
    bannerImageWrapper: {
      width: '100%',
      borderTopLeftRadius: homeStyles.image?.borderRadius || 20,
      borderTopRightRadius: homeStyles.image?.borderRadius || 20,
      overflow: 'hidden',
    },
    bannerImage: {
      width: homeStyles.image?.width || '100%',
      height: homeStyles.image?.height || 200,
      borderRadius: homeStyles.image?.borderRadius || 20,
    },
    bannerButtonRow: {
      flexDirection: homeStyles.buttons?.row?.flexDirection || 'row',
      justifyContent: homeStyles.buttons?.row?.justifyContent || 'space-between',
      alignItems: homeStyles.buttons?.row?.alignItems || 'center',
      width: homeStyles.buttons?.row?.width || '90%',
      alignSelf: 'center',
      marginTop: homeStyles.buttons?.row?.marginTop || 16,
      gap: homeStyles.buttons?.row?.gap || 12,
    },
    aboutSchemesButton: {
      flex: 1,
      backgroundColor: homeStyles.buttons?.aboutSchemes?.backgroundColor || '#fffbe6',
      borderRadius: homeStyles.buttons?.aboutSchemes?.borderRadius || 10,
      paddingVertical: homeStyles.buttons?.aboutSchemes?.paddingVertical || 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: homeStyles.buttons?.aboutSchemes?.borderWidth || 1,
      borderColor: homeStyles.buttons?.aboutSchemes?.borderColor || '#FFD700',
      shadowColor: homeStyles.buttons?.aboutSchemes?.shadow?.color || '#FFD700',
      shadowOffset: homeStyles.buttons?.aboutSchemes?.shadow?.offset || { width: 0, height: 1 },
      shadowOpacity: homeStyles.buttons?.aboutSchemes?.shadow?.opacity || 0.08,
      shadowRadius: homeStyles.buttons?.aboutSchemes?.shadow?.radius || 3,
      elevation: homeStyles.buttons?.aboutSchemes?.shadow?.elevation || 1,
      marginRight: homeStyles.buttons?.aboutSchemes?.marginRight || 6,
    },
    aboutSchemesButtonText: {
      color: homeStyles.buttons?.aboutSchemes?.text?.color || '#FFD700',
      fontWeight: homeStyles.buttons?.aboutSchemes?.text?.fontWeight || '600',
      fontSize: homeStyles.buttons?.aboutSchemes?.text?.fontSize || 15,
      letterSpacing: homeStyles.buttons?.aboutSchemes?.text?.letterSpacing || 0.2,
    },
    joinNowButton: {
      flex: 1,
      backgroundColor: homeStyles.buttons?.joinNow?.backgroundColor || '#FFD700',
      borderRadius: homeStyles.buttons?.joinNow?.borderRadius || 12,
      paddingVertical: homeStyles.buttons?.joinNow?.paddingVertical || 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: homeStyles.buttons?.joinNow?.shadow?.color || '#FFD700',
      shadowOffset: homeStyles.buttons?.joinNow?.shadow?.offset || { width: 0, height: 2 },
      shadowOpacity: homeStyles.buttons?.joinNow?.shadow?.opacity || 0.15,
      shadowRadius: homeStyles.buttons?.joinNow?.shadow?.radius || 6,
      elevation: homeStyles.buttons?.joinNow?.shadow?.elevation || 3,
      marginLeft: homeStyles.buttons?.joinNow?.marginLeft || 6,
    },
    joinNowButtonText: {
      color: homeStyles.buttons?.joinNow?.text?.color || '#ffffff',
      fontWeight: homeStyles.buttons?.joinNow?.text?.fontWeight || '700',
      fontSize: homeStyles.buttons?.joinNow?.text?.fontSize || 16,
      letterSpacing: homeStyles.buttons?.joinNow?.text?.letterSpacing || 0.5,
      textTransform: homeStyles.buttons?.joinNow?.text?.textTransform || 'uppercase',
    },
  });
};

/**
 * Get component-specific styles from brand configuration
 */
export const getComponentStyles = (componentName: string) => {
  const homeStyles = brandHomeStyles?.homePage?.components;
  
  if (!homeStyles || !homeStyles[componentName]) {
    return {};
  }

  return homeStyles[componentName];
};

/**
 * Get animation configuration from brand configuration
 */
export const getAnimationConfig = () => {
  const homeStyles = brandHomeStyles?.homePage?.animations;
  
  if (!homeStyles) {
    return {
      duration: 800,
      easing: 'cubic',
      initialOpacity: 0,
      finalOpacity: 1,
      initialScale: 0.8,
      finalScale: 1,
    };
  }

  return homeStyles.entrance || {};
}; 