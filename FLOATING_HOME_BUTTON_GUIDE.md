# Floating Home Button Guide

## Overview

The floating home button is a circular button that appears on the bottom right side of the screen **only on pages where the bottom navigation bar is hidden**. This provides users with a quick way to navigate back to the home screen when they're on pages without the bottom navigation.

## How It Works

### 1. **Automatic Visibility**
The floating home button automatically shows/hides based on the current route:

- **Shows on**: Pages listed in `HIDE_TABS_ROUTES` in `src/config/navigation.ts`
- **Hides on**: All other pages (where the bottom bar is visible)

### 2. **Pages Where Floating Button Appears**
Currently, the floating home button appears on these pages:
- `offers`
- `refer_earn` 
- `our_stores`
- `contact_us`
- `about_us`
- `faq`
- `ourPolicies`
- `privacyPolicy`
- `termsAndConditionsPolicies`
- `StoreLocator`
- `paymentNewOverView`
- `payment-success`
- `payment-failure`

### 3. **Features**
- **Smooth Animations**: Scale and bounce animations when appearing/disappearing
- **Press Animation**: Button scales down when pressed for tactile feedback
- **Accessibility**: Proper accessibility labels and hints
- **Platform Optimized**: Different positioning for iOS and Android
- **Gradient Design**: Beautiful gradient background matching app theme

## Customization

### Adding New Pages
To make the floating button appear on a new page, add the route name to `HIDE_TABS_ROUTES` in `src/config/navigation.ts`:

```typescript
export const HIDE_TABS_ROUTES = [
  'offers',
  'refer_earn', 
  'our_stores',
  'contact_us',
  'about_us',
  'faq',
  'ourPolicies',
  'privacyPolicy',
  'termsAndConditionsPolicies',
  'StoreLocator',
  'paymentNewOverView',
  'payment-success',
  'payment-failure',
  'your-new-page', // Add your new page here
] as const;
```

### Customizing the Button
You can modify the floating button by editing `src/components/FloatingHomeButton.tsx`:

#### Change Colors
```typescript
<LinearGradient
  colors={['#B31313', '#8B0000']} // Change these colors
  style={styles.gradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
```

#### Change Size
```typescript
const styles = StyleSheet.create({
  button: {
    width: 56,  // Change width
    height: 56, // Change height
    borderRadius: 28, // Should be half of width/height for circle
  },
});
```

#### Change Position
```typescript
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80, // Adjust bottom position
    right: 20, // Adjust right position
    zIndex: 1000,
    elevation: 1000,
  },
});
```

#### Change Icon
```typescript
<Ionicons 
  name="home" // Change icon name
  size={24}   // Change icon size
  color="#FFFFFF" // Change icon color
/>
```

### Custom Navigation
You can customize what happens when the button is pressed by passing an `onPress` prop:

```typescript
<FloatingHomeButton 
  onPress={() => {
    // Your custom navigation logic
    router.push('/(app)/(tabs)/home');
    // Or any other action
  }} 
/>
```

## Technical Details

### Component Location
- **File**: `src/components/FloatingHomeButton.tsx`
- **Integration**: Added to `src/components/AppLayoutWrapper.tsx`

### Dependencies
- `react-native-reanimated` for animations
- `expo-linear-gradient` for gradient background
- `@expo/vector-icons` for the home icon
- `expo-router` for navigation

### Animation Details
- **Scale Animation**: Button scales from 0 to 1 when appearing
- **Bounce Animation**: Subtle bounce effect after scaling in
- **Press Animation**: Scales down to 0.9 when pressed
- **Exit Animation**: Scales back to 0 when hiding

## Testing

To test the floating home button:

1. Navigate to any page listed in `HIDE_TABS_ROUTES`
2. The floating home button should appear on the bottom right
3. Tap the button to navigate back to home
4. Navigate to a page not in the list - the button should disappear

## Troubleshooting

### Button Not Appearing
- Check if the current route is in `HIDE_TABS_ROUTES`
- Verify the route name matches exactly (case-sensitive)
- Check console for any errors

### Button Not Navigating
- Verify the navigation path in `handlePress` function
- Check if there are any navigation guards preventing the navigation

### Animation Issues
- Ensure `react-native-reanimated` is properly installed
- Check if animations are disabled in developer settings 