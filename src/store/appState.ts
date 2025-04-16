import { AppState } from 'react-native';
import useGlobalStore from '../store/global.store'; // Adjust the import path as necessary
import { router } from 'expo-router';

let appStateTimeout: NodeJS.Timeout;

const setupAppStateListener = () => {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      // Set timeout for 5 seconds - adjust based on your security requirements
      appStateTimeout = setTimeout(() => {
        useGlobalStore.getState().logout();
      }, 300000);
    }

    if (nextAppState === 'active') {
      clearTimeout(appStateTimeout);
      // Force MPIN check when app comes back to foreground
      if (useGlobalStore.getState().isLoggedIn) {
        // useGlobalStore.getState().logout();
        router.replace("/(auth)/mpin_verify");
      }
    }
  });
};

export default setupAppStateListener;