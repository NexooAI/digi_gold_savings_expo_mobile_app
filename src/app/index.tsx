import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.4;

export default function AuthGuard() {
  const router = useRouter();
  const { login, isLoggedIn } = useGlobalStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  // Validate token by checking expiration
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Simple JWT expiration check
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 5 minute buffer)
      if (payload.exp && payload.exp < currentTime + 300) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  };

  const checkAuthenticationStatus = async () => {
    try {
      // Check if user is already logged in from global state
      if (isLoggedIn) {
        router.replace("/(app)/(tabs)/home");
        return;
      }

      // Check for stored authentication token
      const token = await SecureStore.getItemAsync("authToken");
      
      if (token) {
        // Validate token expiration
        const isTokenValid = await validateToken(token);
        
        if (!isTokenValid) {
          console.log("Token is invalid/expired, redirecting to login");
          // Clear invalid token and redirect to login
          await SecureStore.deleteItemAsync("authToken");
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("refreshToken");
          await AsyncStorage.removeItem("userData");
          router.replace("/(auth)/login");
          return;
        }

        // Token exists and is valid, check if user data is available
        const userData = await AsyncStorage.getItem("userData");
        
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          
          // Check if MPIN is set up (this is now handled on server)
          // Since MPIN is stored on server, we can directly go to MPIN verification
          console.log("Valid token and user data found, redirecting to MPIN verification");
          router.replace("/(auth)/mpin_verify");
        } else {
          // Token exists but no user data → Go to login
          console.log("Token exists but no user data, redirecting to login");
          await SecureStore.deleteItemAsync("authToken");
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("refreshToken");
          router.replace("/(auth)/login");
        }
      } else {
        // No token → Go to login
        console.log("No auth token found, redirecting to login");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Authentication check error:", error);
      // On error, clear all stored data and go to login screen
      try {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("refreshToken");
        await AsyncStorage.removeItem("userData");
      } catch (clearError) {
        console.error("Error clearing stored data:", clearError);
      }
      router.replace("/(auth)/login");
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <ImageBackground
        source={theme.image.bg_image}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <Image
              source={theme.image.transparentLogo}
              style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
              resizeMode="contain"
            />
            <ActivityIndicator 
              size="large" 
              color="#ffc90c" 
              style={styles.loader}
            />
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  // This should not render as we're redirecting
  return null;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
