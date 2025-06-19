import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { theme } from "@/constants/theme";

const tabs = [
  {
    name: "home",
    label: "Home",
    icon: "home-outline",
    iconActive: "home",
  },
  {
    name: "savings",
    label: "Savings",
    icon: "wallet-outline",
    iconActive: "wallet",
  },
  {
    name: "notifications",
    label: "Notifications",
    icon: "notifications-outline",
    iconActive: "notifications",
  },
  {
    name: "profile",
    label: "Profile",
    icon: "person-outline",
    iconActive: "person",
  },
];

export default function CustomBottomBar() {
  const router = useRouter();
  const segments = useSegments();
  // segments example: ["(app)", "(tabs)", "home"]
  const current = segments[2] || "home";

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = current === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push({ pathname: `/(tabs)/${tab.name}` })}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={26}
              color={isActive ? theme.colors.primary : "#888"}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.colors.primary : "#888" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
}); 