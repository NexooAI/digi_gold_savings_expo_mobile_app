import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await SecureStore.getItemAsync('hasLaunched');
        setIsFirstLaunch(!hasLaunched);
      } catch (error) {
        console.error(error);
        setIsFirstLaunch(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const markAsLaunched = async () => {
    try {
      await SecureStore.setItemAsync('hasLaunched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error(error);
    }
  };

  return { isFirstLaunch, isLoading, markAsLaunched };
};