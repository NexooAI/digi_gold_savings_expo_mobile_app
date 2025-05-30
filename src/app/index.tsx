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
        // Token exists, check if user data is available
        const userData = await AsyncStorage.getItem("userData");
        
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          
          // Check if MPIN is set up
          const storedMPIN = await SecureStore.getItemAsync("user_mpin");
          
          if (storedMPIN) {
            // User has token and MPIN set up → Go to MPIN verification
            router.replace("/(auth)/mpin_verify");
          } else {
            // User has token but no MPIN → Go to MPIN setup
            router.replace("/(auth)/reset_mpin");
          }
        } else {
          // Token exists but no user data → Go to login
          await SecureStore.deleteItemAsync("authToken");
          router.replace("/(auth)/login");
        }
      } else {
        // No token → Go to login
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Authentication check error:", error);
      // On error, go to login screen
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
