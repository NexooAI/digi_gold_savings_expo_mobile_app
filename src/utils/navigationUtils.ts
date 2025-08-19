import { router } from 'expo-router';

/**
 * Safely navigates back using router.back() with fallback to home
 * @param fallbackRoute - Route to navigate to if back navigation fails (defaults to home)
 * @returns boolean - true if navigation was successful, false otherwise
 */
export const safeNavigateBack = (fallbackRoute: string = '/(app)/(tabs)/home'): boolean => {
  try {
    // Try to go back
    router.back();
    return true;
  } catch (error) {
    console.log('safeNavigateBack: router.back() failed, using fallback:', error);
    
    try {
      // Fallback to specified route
      router.replace(fallbackRoute as any);
      return true;
    } catch (fallbackError) {
      console.log('safeNavigateBack: Fallback navigation also failed:', fallbackError);
      
      // Final fallback to home
      try {
        router.replace('/(app)/(tabs)/home');
        return true;
      } catch (finalError) {
        console.log('safeNavigateBack: All navigation attempts failed:', finalError);
        return false;
      }
    }
  }
};

/**
 * Safely navigates back with custom error handling
 * @param onBackSuccess - Callback when back navigation succeeds
 * @param onBackFailure - Callback when back navigation fails
 * @param fallbackRoute - Route to navigate to if back navigation fails
 */
export const safeNavigateBackWithCallbacks = (
  onBackSuccess?: () => void,
  onBackFailure?: () => void,
  fallbackRoute: string = '/(app)/(tabs)/home'
) => {
  const success = safeNavigateBack(fallbackRoute);
  
  if (success && onBackSuccess) {
    onBackSuccess();
  } else if (!success && onBackFailure) {
    onBackFailure();
  }
};

/**
 * Checks if the current route is a home screen
 * @param pathname - Current route pathname
 * @returns boolean - true if on home screen
 */
export const isOnHomeScreen = (pathname: string): boolean => {
  return pathname === '/(app)/(tabs)/home' || 
         pathname === '/(app)/(tabs)/' || 
         pathname === '/(app)/(tabs)';
};

/**
 * Safely navigates back only if not on home screen
 * @param pathname - Current route pathname
 * @param fallbackRoute - Route to navigate to if back navigation fails
 * @returns boolean - true if navigation was successful or not needed
 */
export const safeNavigateBackIfNotHome = (
  pathname: string, 
  fallbackRoute: string = '/(app)/(tabs)/home'
): boolean => {
  if (isOnHomeScreen(pathname)) {
    console.log('safeNavigateBackIfNotHome: Already on home screen, ignoring back navigation');
    return true;
  }
  
  return safeNavigateBack(fallbackRoute);
};

