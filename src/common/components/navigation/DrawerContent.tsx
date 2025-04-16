import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

const DrawerMenuItem = ({ label, iconName, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.menuItem, disabled && styles.disabledMenuItem]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Ionicons
      name={iconName}
      size={24}
      color={disabled ? "#666" : theme.colors.primary}
      style={styles.icon}
    />
    <Text style={[styles.menuItemText, disabled && styles.disabledText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export function CustomDrawerContent(props) {
  const router = useRouter();
  const { logout } = useGlobalStore();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = useCallback(
    (route) => {
      if (isNavigating) return;
      setIsNavigating(true);
      props.navigation.closeDrawer();
      // Use a longer timeout to ensure drawer animation completes
      setTimeout(() => {
        try {
          router.push(route);
        } catch (error) {
          Alert.alert("Navigation Error", "Failed to navigate");
        } finally {
          setIsNavigating(false);
        }
      }, 500); // Increased to 500ms
    },
    [router, props.navigation, isNavigating]
  );
  // Updated handleLogout with navigation state
  const handleLogout = useCallback(() => {
    if (isNavigating) return;

    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            setIsNavigating(true);
            try {
              await AsyncStorage.multiRemove(["userMpin"]);
              logout();
              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert("Logout Error", "Failed to logout");
            } finally {
              setIsNavigating(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [logout, router, isNavigating]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={theme.image.transparentLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.menuContainer}>
        {/* User Account Section */}
        {/* <Text style={styles.sectionHeader}>User Account</Text> */}
        <DrawerMenuItem
          label="Profile"
          iconName="person-outline"
          onPress={() => handleNavigation("/(tabs)/profile")}
          disabled={isNavigating}
        />

        {/* Explore & Benefits Section */}
        {/* <Text style={styles.sectionHeader}>Explore & Benefits</Text> */}
        <DrawerMenuItem
          label="Offers"
          iconName="flash-outline"
          onPress={() => handleNavigation("/(tabs)/home/offers")}
          disabled={isNavigating}
        />
        <DrawerMenuItem
          label="Refer & Earn"
          iconName="gift-outline"
          onPress={() => handleNavigation("/(tabs)/home/refer_earn")}
          disabled={isNavigating}
        />

        {/* Store Information Section */}
        {/* <Text style={styles.sectionHeader}>Store Information</Text> */}
        <DrawerMenuItem
          label="Our Stores"
          iconName="location-outline"
          onPress={() => handleNavigation("/(tabs)/home/our_stores")}
          disabled={isNavigating}
        />
        {/* <DrawerMenuItem
          label="Store Locator"
          iconName="location-outline"
          onPress={() => handleNavigation("/(tabs)/home/StoreLocator")}
          disabled={isNavigating}
        /> */}
        <DrawerMenuItem
          label="Contact Us"
          iconName="call-outline"
          onPress={() => handleNavigation("/(tabs)/home/contact_us")}
          disabled={isNavigating}
        />
        <DrawerMenuItem
          label="About Us"
          iconName="information-circle-outline"
          onPress={() => handleNavigation("/(tabs)/home/about_us")}
          disabled={isNavigating}
        />
        <DrawerMenuItem
          label="FAQ & Help"
          iconName="help-circle-outline"
          onPress={() => handleNavigation("/(tabs)/home/faq")}
          disabled={isNavigating}
        />

        {/* Legal & Policies Section */}
        {/* <Text style={styles.sectionHeader}>Legal & Policies</Text> */}
        <DrawerMenuItem
          label="Our Policies"
          iconName="shield-checkmark-outline"
          onPress={() => handleNavigation("/(tabs)/home/policies/ourPolicies")}
          disabled={isNavigating}
        />
        <DrawerMenuItem
          label="Privacy Policy"
          iconName="lock-closed-outline"
          onPress={() =>
            handleNavigation("/(tabs)/home/policies/privacyPolicy")
          }
          disabled={isNavigating}
        />
        <DrawerMenuItem
          label="Terms & Conditions"
          iconName="newspaper-outline"
          onPress={() =>
            handleNavigation("/(tabs)/home/policies/termsAndConditionsPolicies")
          }
          disabled={isNavigating}
        />
      </View>

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity
          style={[styles.logoutButton, isNavigating && styles.disabledLogout]}
          onPress={handleLogout}
          disabled={isNavigating}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={isNavigating ? "#aaa" : "white"}
            style={styles.logoutIcon}
          />
          <Text
            style={[styles.logoutText, isNavigating && styles.disabledText]}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// Styles remain mostly the same with these additions:
const styles = StyleSheet.create({
  disabledText: {
    color: "#666",
  },
  disabledLogout: {
    backgroundColor: "#555",
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 70,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderTopRightRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  logoutButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoContainer: {
    width: width * 0.3,
    height: 50,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  disabledMenuItem: {
    opacity: 0.5,
    backgroundColor: theme.colors.primary,
  },
});

export default CustomDrawerContent;
