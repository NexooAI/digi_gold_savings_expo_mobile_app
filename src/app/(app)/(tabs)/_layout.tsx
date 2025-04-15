import TabBarIcon from "@/common/components/navigation/TabBarIcon";
import i18n from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
// import TabBarIcon from '@/components/TabBarIcon';
import { t } from "@/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { theme } from "@/constants/theme";

export default function TabLayout() {
  const { language } = useGlobalStore();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarStyle: {
            height: 70, // Increased height
            borderTopLeftRadius: 25, // Rounded top-left corner
            borderTopRightRadius: 25, // Rounded top-right corner
            backgroundColor: "#ffffff", // Match your background color
            shadowColor: theme.colors.primary, // Glowing shadow color
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 20, // For Android
            position: "absolute",
            overflow: "visible",
            borderTopWidth: 0, // Remove default border
            paddingBottom: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 8, // Adjust vertical spacing
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t("home"),
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="savings"
          options={{
            title: t("savings"),
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("notification"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="notifications" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
