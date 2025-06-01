import { AppState, AppStateStatus } from 'react-native';
import useGlobalStore from '../store/global.store';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

let appStateTimeout: NodeJS.Timeout;
let backgroundTime: number = 0;
const BACKGROUND_TIMEOUT = 30000; // 30 seconds - adjust based on your security requirements

const setupAppStateListener = () => {
  const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
    const { isLoggedIn } = useGlobalStore.getState();
    
    if (nextAppState === 'background') {
      // Record when app goes to background
      backgroundTime = Date.now();
      
      // Set timeout for automatic logout after extended background time
      appStateTimeout = setTimeout(() => {
        if (isLoggedIn) {
          useGlobalStore.getState().logout();
          // Clear sensitive data
          SecureStore.deleteItemAsync("authToken");
          router.replace("/(auth)/login");
        }
      }, 300000); // 5 minutes
    }

    if (nextAppState === 'active') {
      // Clear the logout timeout
      clearTimeout(appStateTimeout);
      
      // Check if user is logged in and app was in background
      if (isLoggedIn && backgroundTime > 0) {
        const timeInBackground = Date.now() - backgroundTime;
        
        // If app was in background for more than the threshold, require MPIN
        if (timeInBackground > BACKGROUND_TIMEOUT) {
          try {
            // Check if user has valid token and MPIN
            const token = await SecureStore.getItemAsync("authToken");
            const storedMPIN = await SecureStore.getItemAsync("user_mpin");
            
            if (token && storedMPIN) {
              // Force MPIN verification for security
              router.replace("/(auth)/mpin_verify");
            } else {
              // No valid authentication, go to login
              useGlobalStore.getState().logout();
              router.replace("/(auth)/login");
            }
          } catch (error) {
            console.error("Error checking authentication on app resume:", error);
            // On error, logout for security
            useGlobalStore.getState().logout();
            router.replace("/(auth)/login");
          }
        }
      }
      
      // Reset background time
      backgroundTime = 0;
    }
  });
  
  // Return cleanup function
  return () => {
    subscription.remove();
    if (appStateTimeout) {
      clearTimeout(appStateTimeout);
    }
  };
};

export default setupAppStateListener;