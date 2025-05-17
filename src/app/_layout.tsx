import { Drawer } from "expo-router/drawer";
import { Slot, useRouter, useNavigation, Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import { ActivityIndicator, View, StyleSheet, Alert, BackHandler } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { useEffect, useState, useRef } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "./services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";
import NotificationService from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const { isFirstLaunch, isLoading: isAppLoading } = useFirstLaunch();
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const router = useRouter();
  const { isLoggedIn } = useGlobalStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [backPressCount, setBackPressCount] = useState(0);
  const backPressTimeout = useRef<NodeJS.Timeout>();

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

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoggedIn) {
        setBackPressCount(prev => {
          const newCount = prev + 1;
          
          // Clear previous timeout
          if (backPressTimeout.current) {
            clearTimeout(backPressTimeout.current);
          }

          // Reset count after 2 seconds
          backPressTimeout.current = setTimeout(() => {
            setBackPressCount(0);
          }, 2000);

          // Close app after 2 presses
          if (newCount >= 2) {
            BackHandler.exitApp();
            return 0;
          }

          return newCount;
        });
        return true;
      }
      return false;
    });

    return () => {
      backHandler.remove();
      if (backPressTimeout.current) {
        clearTimeout(backPressTimeout.current);
      }
    };
  }, [isLoggedIn]);

  useEffect(() => {
    setupAppStateListener();
  }, []);

  useEffect(() => {
    // Register for push notifications
    NotificationService.registerForPushNotificationsAsync();

    // Listen for incoming notifications while the app is foregrounded
    notificationListener.current = NotificationService.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

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
        router.replace("/(auth)/mpin_verify");
      } else {
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
            <Drawer.Screen
              name="(tabs)"
              options={{ drawerLabel: "Home", title: "Home" }}
            />
            <Drawer.Screen
              name="(auth)"
              options={{
                drawerLabel: "Authentication",
                title: "Login/Register",
              }}
            />
          </Drawer>

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
