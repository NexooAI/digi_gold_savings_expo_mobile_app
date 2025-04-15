import { Drawer } from "expo-router/drawer";
import { Slot, useRouter, useNavigation } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import { ActivityIndicator, View, StyleSheet, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { useEffect, useState } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "./services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";

export default function RootLayout() {
  const { isFirstLaunch, isLoading: isAppLoading } = useFirstLaunch();
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const router = useRouter();
  const { isLoggedIn } = useGlobalStore();

  // Initialize locale
  useEffect(() => {
    initializeAppLocale();
  }, []);

  // Register global loading callback
  useEffect(() => {
    LoadingService.register(setApiLoading);
  }, []);

  // Navigation readiness handler
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      setIsNavigationReady(true);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    setupAppStateListener();
  }, []);

  // Auth check with navigation readiness
  // useEffect(() => {
  //   if (!isNavigationReady) return;

  //   const checkAuth = async () => {
  //     const token = await SecureStore.getItemAsync("authToken");
  //     if (token) {
  //       Alert.alert( "User is logged in",token);
  //       router.replace("/(auth)/mpin_verify");
  //       // router.replace("/login");
  //     } else {
  //       router.replace("/login");
  //     }
  //   };
  //   checkAuth();
  // }, [isLoggedIn, isNavigationReady]);
  useEffect(() => {
    if (!isNavigationReady) return;

    // If user is already logged in, redirect to home.
    if (isLoggedIn) {
      router.replace("/(tabs)/home");
      return;
    }

    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        // Alert.alert( "User is logged in",token);
        router.replace("/(auth)/mpin_verify");
      } else {
        // Alert.alert( "User is logged in",token);
        router.replace("/login");
      }
    };
    checkAuth();
  }, [isLoggedIn, isNavigationReady]);
  const overallLoading = isAppLoading || apiLoading;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider1>
          {/* Always render drawer */}
          <Drawer
            screenOptions={{
              headerShown: false,
              drawerActiveBackgroundColor: theme.colors.primary,
              drawerActiveTintColor: "white",
              drawerInactiveTintColor: "black",
            }}
          >
            <Drawer.Screen
              name="index"
              options={{ drawerLabel: "Welcome", title: "Welcome" }}
            />
            {/* <Drawer.Screen
              name="(tabs)"
              options={{ drawerLabel: "Home", title: "Home" }}
            />
            <Drawer.Screen
              name="(auth)"
              options={{
                drawerLabel: "Authentication",
                title: "Login/Register",
              }}
            /> */}
          </Drawer>

          {/* Loading overlay */}
          {overallLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </LanguageProvider1>
      </AuthProvider>
    </GestureHandlerRootView>
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
