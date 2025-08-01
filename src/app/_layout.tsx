import { Drawer } from "expo-router/drawer";
import { Stack, useRouter, useNavigation } from "expo-router";
// // import { AuthProvider } from "@/contexts/AuthContext";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useEffect, useState, useRef } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "@/services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";
import NotificationService from "@/services/NotificationService";
import * as Notifications from "expo-notifications";
import { RootSiblingParent } from "react-native-root-siblings";
import GlobalLoadingProvider from "@/app/components/GlobalLoadingProvider";

export default function RootLayout() {
  const { isFirstLaunch } = useFirstLaunch();
  const router = useRouter();
  const navigation = useNavigation();
  const [overallLoading, setOverallLoading] = useState<boolean>(false);
  const { user, updateUser, setLanguage } = useGlobalStore();

  // Initialize language on app start
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const locale = await initializeAppLocale();
        setLanguage(locale as "en" | "mal" | "ta");
      } catch (error) {
        console.error("Failed to initialize language:", error);
        setLanguage("en"); // fallback
      }
    };

    initLanguage();
  }, [setLanguage]);

  // Setup notification handler
  useEffect(() => {
    const setupNotifications = async () => {
      await NotificationService.setupNotifications();
    };

    setupNotifications();

    // Handle notification when app is opened
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle notification tap
        // //console.log("Notification tapped:", response);
      }
    );

    return () => subscription.remove();
  }, []);

  // Auto-login functionality
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const storedUserData = await AsyncStorage.getItem("userData");
        
        if (token && storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            console.log('🔍 Layout: Found stored user data:', parsedUser);
            
            // Only update global store if we have valid user data
            if (parsedUser.user_id) {
              const globalStoreUser = {
                id: parsedUser.user_id,
                name: parsedUser.name,
                email: parsedUser.email,
                mobile: parsedUser.mobile_number,
                profileImage: parsedUser.profile_photo || "",
                idProof: "",
                referralCode: parsedUser.referralCode || "",
                rewards: 0,
                mpinStatus: parsedUser.mpinStatus,
                usertype: parsedUser.userType,
              };
              updateUser(globalStoreUser);
              console.log('🔍 Layout: Updated global store with user data');
              
              // If token exists, redirect to MPIN screen instead of home
              router.replace("/mpin_verify");
            } else {
              console.log('🔍 Layout: No valid user_id found in stored data');
            }
          } catch (parseError) {
            console.error("Error parsing stored user data:", parseError);
          }
        } else {
          console.log('🔍 Layout: No token or user data found');
        }
      } catch (error) {
        console.error("Error retrieving stored user:", error);
      }
    };

    checkStoredUser();
  }, [updateUser, router]);

  // Register loading service
  useEffect(() => {
    LoadingService.register((isLoading: boolean) => {
      setOverallLoading(isLoading);
    });
  }, []);

  // Setup app state listener
  useEffect(() => {
    return setupAppStateListener();
  }, []);

  // Android back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Get current route
        const state = navigation.getState?.();
        const currentRoute = state?.routes?.[state.index];

        // Allow back on certain screens
        const allowedBackScreens = [
          "home",
          "savings",
          "transactions",
          "profile",
          "login",
        ];

        if (currentRoute && allowedBackScreens.includes(currentRoute.name)) {
          return false; // Allow default behavior
        }

        // On main tabs, show exit confirmation
        if (currentRoute?.name === "(tabs)" || currentRoute?.name === "index") {
          Alert.alert(
            "Exit App",
            "Are you sure you want to exit?",
            [
              {
                text: "Cancel",
                onPress: () => null,
                style: "cancel",
              },
              {
                text: "Exit",
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: false }
          );
          return true; // Prevent default behavior
        }

        return false; // Allow default behavior for other screens
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <RootSiblingParent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider1>
          <GlobalLoadingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="intro"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="(app)"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="(auth)"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="login"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="[...missing]"
                options={{
                  gestureEnabled: false,
                  animation: "fade",
                }}
              />
            </Stack>
          </GlobalLoadingProvider>
        </LanguageProvider1>
      </GestureHandlerRootView>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
