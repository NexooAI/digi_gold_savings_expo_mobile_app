import { useState, useEffect } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { theme } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro - 375x812)
const baseWidth = 375;
const baseHeight = 812;

// Screen size breakpoints
const breakpoints = {
  small: 375,    // iPhone SE, small Android
  medium: 414,   // iPhone 11 Pro Max, most Android
  large: 428,    // iPhone 14 Pro Max
  xlarge: 500,   // Large Android tablets
};

export const useResponsiveLayout = () => {
  const [dimensions, setDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Responsive scaling functions
  const scale = (size: number) => {
    const newSize = size * (dimensions.width / baseWidth);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const verticalScale = (size: number) => {
    const newSize = size * (dimensions.height / baseHeight);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const moderateScale = (size: number, factor = 0.5) => {
    const newSize = size + (scale(size) - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  // Screen size detection
  const isSmallScreen = dimensions.width <= breakpoints.small;
  const isMediumScreen = dimensions.width > breakpoints.small && dimensions.width <= breakpoints.medium;
  const isLargeScreen = dimensions.width > breakpoints.medium && dimensions.width <= breakpoints.large;
  const isXLargeScreen = dimensions.width > breakpoints.large;

  // Responsive spacing
  const spacing = {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  };

  // Responsive font sizes
  const fontSize = {
    xs: moderateScale(10),
    sm: moderateScale(12),
    md: moderateScale(14),
    lg: moderateScale(16),
    xl: moderateScale(18),
    xxl: moderateScale(20),
    xxxl: moderateScale(24),
  };

  // Responsive border radius
  const borderRadius = {
    sm: scale(4),
    md: scale(8),
    lg: scale(12),
    xl: scale(16),
    xxl: scale(24),
  };

  // Responsive padding/margin
  const padding = {
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
    xxl: scale(24),
  };

  // Responsive shadows
  const shadows = {
    small: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: scale(1) },
      shadowOpacity: 0.1,
      shadowRadius: scale(2),
      elevation: scale(2),
    },
    medium: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.15,
      shadowRadius: scale(4),
      elevation: scale(4),
    },
    large: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.2,
      shadowRadius: scale(8),
      elevation: scale(8),
    },
  };

  // Safe area calculations
  const safeAreaTop = Platform.OS === 'ios' ? 44 : 24;
  const safeAreaBottom = Platform.OS === 'ios' ? 34 : 0;
  const headerHeight = safeAreaTop + 60; // 60px for header content
  const bottomBarHeight = 80 + safeAreaBottom; // 80px + safe area

  // Responsive utilities
  const getResponsiveFontSize = (...sizes: number[]) => {
    if (isSmallScreen) return sizes[0] || sizes[1] || sizes[2];
    if (isMediumScreen) return sizes[1] || sizes[2] || sizes[0];
    if (isLargeScreen) return sizes[2] || sizes[1] || sizes[0];
    return sizes[2] || sizes[1] || sizes[0];
  };

  const getResponsivePadding = (...paddings: number[]) => {
    if (isSmallScreen) return paddings[0] || paddings[1] || paddings[2];
    if (isMediumScreen) return paddings[1] || paddings[2] || paddings[0];
    if (isLargeScreen) return paddings[2] || paddings[1] || paddings[0];
    return paddings[2] || paddings[1] || paddings[0];
  };

  const getResponsiveWidth = (percentage: number) => {
    return (dimensions.width * percentage) / 100;
  };

  const getResponsiveHeight = (percentage: number) => {
    return (dimensions.height * percentage) / 100;
  };

  return {
    // Dimensions
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    
    // Safe areas
    safeAreaTop,
    safeAreaBottom,
    headerHeight,
    bottomBarHeight,
    
    // Screen size flags
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isXLargeScreen,
    
    // Responsive utilities
    scale,
    verticalScale,
    moderateScale,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveWidth,
    getResponsiveHeight,
    
    // Predefined responsive values
    spacing,
    fontSize,
    borderRadius,
    padding,
    shadows,
  };
}; 