import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { theme } from "@/constants/theme";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import { shouldHideTabs } from "@/config/navigation";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

type Tab = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge?: number | null;
};

export default function CustomBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useGlobalStore();
  // const { badgeCount } = useNotificationBadge();
  const current = pathname.split('/').pop() || "home";
  const { keyboardVisible } = useKeyboardVisibility();
  const layout = useResponsiveLayout();
  
  // Check if current route should hide tabs
  const shouldHide = shouldHideTabs(current);
  
  // Keyboard behavior:
  // - On Android: Hide bottom bar when keyboard is visible to prevent overlap
  // - On iOS: Keep bottom bar fixed and visible when keyboard is visible
  
  // Animation refs for each tab
  const tabAnimations = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;
  const badgeAnimations = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;
  

  const tabs: Tab[] = [
    {
      name: "home",
      label: "bottom_nav_home",
      icon: "home-outline",
      iconActive: "home",
    },
    {
      name: "savings",
      label: "bottom_nav_savings",
      icon: "wallet-outline",
      iconActive: "wallet",
    },
    {
      name: "gold_advance",
      label: "bottom_nav_gold_advance",
      icon: "diamond-outline",
      iconActive: "diamond",
    },
    {
      name: "notifications",
      label: "bottom_nav_notifications",
      icon: "notifications-outline",
      iconActive: "notifications",
      // badge: badgeCount > 0 ? badgeCount : null,
      badge:3
    },
    {
      name: "profile",
      label: "bottom_nav_profile",
      icon: "person-outline",
      iconActive: "person",
    },
  ];

  // Animate tab press
  const animateTabPress = (index: number) => {
    Animated.sequence([
      Animated.timing(tabAnimations[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate badge
  const animateBadge = (index: number) => {
    Animated.sequence([
      Animated.timing(badgeAnimations[index], {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimations[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate badges on mount or when badge count changes
  // useEffect(() => {
  //   tabs.forEach((tab, index) => {
  //     if (tab.badge && tab.badge > 0) {
  //       setTimeout(() => animateBadge(index), index * 100);
  //     }
  //   });
  // }, [badgeCount]);

  const handleTabPress = (tab: Tab, index: number) => {
    animateTabPress(index);
    if (tab.badge && tab.badge > 0) {
      animateBadge(index);
    }
    router.push({ pathname: `/(tabs)/${tab.name}` });
  };

  // If tabs should be hidden, render an empty view instead of null
  if (shouldHide) {
    return <View style={{ display: 'none' }} />;
  }

  // Handle keyboard visibility - hide on Android, keep fixed on iOS
  // Add a small delay to prevent flickering when keyboard is dismissed
  if (keyboardVisible && Platform.OS === 'android') {
    return <View style={{ display: 'none' }} />;
  }

  // Ensure bottom bar stays at the very bottom on iOS even when keyboard is visible
  const containerStyle = Platform.OS === 'ios' && keyboardVisible 
    ? [styles.container, { position: 'absolute' as const, bottom: 0, left: 0, right: 0 }]
    : styles.container;

  // Responsive styles based on screen size
  const responsiveStyles = {
    iconSize: layout.getResponsiveFontSize(24, 26, 28),
    labelFontSize: layout.getResponsiveFontSize(10, 11, 12),
    tabPadding: layout.getResponsivePadding(6, 8, 10),
    containerPadding: layout.getResponsivePadding(12, 16, 20),
  };

  return (
    <View style={[containerStyle, { paddingHorizontal: responsiveStyles.containerPadding }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, { paddingVertical: responsiveStyles.tabPadding }]}
              onPress={() => handleTabPress(tab, index)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [{ scale: tabAnimations[index] }],
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={responsiveStyles.iconSize}
                    color={isActive ? "#B31313" : "#888"}
                  />
                  {tab.badge && (
                    <Animated.View
                      style={[
                        styles.badge,
                        {
                          transform: [{ scale: badgeAnimations[index] }],
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </Text>
                    </Animated.View>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    { 
                      color: isActive ? "#B31313" : "#888",
                      fontSize: responsiveStyles.labelFontSize,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t(tab.label)}
                </Text>
                {/* {isActive && <View style={styles.activeIndicator} />} */}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
    marginBottom: 0, // Ensure no bottom margin
  },
  gradientContainer: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minWidth: 0, // Allow flex shrinking
    paddingHorizontal: 4, // Add horizontal padding to prevent cutoff
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4, // Reduced padding to prevent overflow
    width: '100%', // Ensure content takes full width of tab
    minWidth: 0, // Allow shrinking
  },
  iconContainer: {
    position: "relative",
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
    paddingHorizontal: 2, // Add small padding to prevent text cutoff
    minWidth: 0, // Allow text to shrink
    flexShrink: 1, // Allow text to shrink if needed
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    width: 'auto',
    height: 3,
    backgroundColor: "#B31313",
    borderRadius: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}); 