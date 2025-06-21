import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { theme } from "@/constants/theme";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";

type Tab = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge?: number | null;
};

export default function CustomBottomBar() {
  const router = useRouter();
  const segments = useSegments();
  const { language } = useGlobalStore();
  const { badgeCount } = useNotificationBadge();
  const current = segments.at(2) || "home";
  
  // Animation refs for each tab
  const tabAnimations = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
  const badgeAnimations = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;

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
      name: "notifications",
      label: "bottom_nav_notifications",
      icon: "notifications-outline",
      iconActive: "notifications",
      badge: badgeCount > 0 ? badgeCount : null,
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
  useEffect(() => {
    tabs.forEach((tab, index) => {
      if (tab.badge && tab.badge > 0) {
        setTimeout(() => animateBadge(index), index * 100);
      }
    });
  }, [badgeCount]);

  const handleTabPress = (tab: Tab, index: number) => {
    animateTabPress(index);
    if (tab.badge && tab.badge > 0) {
      animateBadge(index);
    }
    router.push({ pathname: `/(tabs)/${tab.name}` });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
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
                    size={26}
                    color={isActive ? theme.colors.primary : "#888"}
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
                    { color: isActive ? theme.colors.primary : "#888" },
                  ]}
                >
                  {t(tab.label)}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
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
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    height: 80,
    zIndex: 100,
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
    paddingVertical: 8,
    position: "relative",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
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
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
}); 