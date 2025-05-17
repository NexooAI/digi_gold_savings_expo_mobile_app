import TabBarIcon from "@/common/components/navigation/TabBarIcon";
import i18n from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { t } from "@/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { theme } from "@/constants/theme";
import { View, StyleSheet, Animated, Text } from "react-native";
import { useEffect, useRef } from "react";

export default function TabLayout() {
  const { language } = useGlobalStore();
  const tabBarAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabBarAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarStyle: {
            height: 85,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            backgroundColor: "#ffffff",
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 20,
            position: "absolute",
            overflow: "visible",
            borderTopWidth: 0,
            paddingBottom: 8,
          },
          tabBarItemStyle: {
            paddingVertical: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 6,
          },
          tabBarIconStyle: {
            marginBottom: 6,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t("home"),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: focused
                          ? tabBarAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color={color}
                />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="savings"
          options={{
            title: t("savings"),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: focused
                          ? tabBarAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name={focused ? "wallet" : "wallet-outline"}
                  size={24}
                  color={color}
                />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("notifications"),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: focused
                          ? tabBarAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <View>
                  <Ionicons
                    name={focused ? "notifications" : "notifications-outline"}
                    size={24}
                    color={color}
                  />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </View>
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile"),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: focused
                          ? tabBarAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={24}
                  color={color}
                />
              </Animated.View>
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(133,1,17,0.1)',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
