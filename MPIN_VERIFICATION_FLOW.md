# MPIN Verification Flow Documentation

## Overview

The MPIN verification flow is a security layer that requires users to enter their 4-digit MPIN after successful OTP verification. This ensures that even if someone gains access to the user's device, they cannot access the app without knowing the MPIN.

## Flow Sequence

### 1. App Launch
- **File**: `src/app/index.tsx` (AuthGuard)
- **Action**: Validates stored token and user data
- **Logic**:
  - Check if user is already logged in
  - Validate JWT token expiration
  - If valid token exists → Redirect to MPIN verification
  - If invalid/expired token → Clear data and redirect to login

### 2. MPIN Verification Screen
- **File**: `src/app/(auth)/mpin_verify.tsx`
- **Action**: Shows MPIN input interface
- **Features**:
  - 4-digit MPIN input with auto-focus
  - Secure text entry (dots instead of numbers)
  - Shake animation on error
  - Loading state during verification
  - Language switcher (English/Malayalam)

### 3. API Call
- **Endpoint**: `POST /auth/login-mpin`
- **Payload**:
```json
{
  "mobileNumber": "9003616461",
  "mpin": "1234"
}
```

### 4. Response Handling
- **Success Response**:
```json
{
  "success": true,
  "message": "MPIN verified successfully",
  "token": "jwt_token_here",
  "accessToken": "access_token_here",
  "refreshtoken": "refresh_token_here",
  "authToken": "auth_token_here",
  "user": {
    "user_id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile_number": "9003616461",
    "referralCode": "REF123"
  }
}
```

- **Error Response**:
```json
{
  "success": false,
  "message": "Invalid MPIN"
}
```

## Authentication Protection

### Protected Routes
All main app routes are now protected with the `AuthGuard` component:

- **Home Page** (`src/app/(app)/(tabs)/home/index.tsx`)
- **Savings Page** (`src/app/(app)/(tabs)/savings/index.tsx`)
- **Profile Page** (`src/app/(app)/(tabs)/profile.tsx`)
- **Other Tab Routes**

### AuthGuard Component
- **File**: `src/components/AuthGuard.tsx`
- **Purpose**: Wraps protected routes to ensure authentication
- **Features**:
  - Validates user login status
  - Checks token expiration
  - Redirects to MPIN verification if token is expired
  - Redirects to login if no valid authentication
  - Shows loading screen during validation

### Protection Logic
```typescript
// AuthGuard checks:
1. Is user logged in? → No → Login
2. Does user data exist? → No → Login  
3. Does auth token exist? → No → Login
4. Is token valid/not expired? → No → MPIN Verification
5. All checks passed → Show protected content
```

## Implementation Details

### Token Validation
```typescript
const validateToken = async (token: string): Promise<boolean> => {
  try {
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
```

### MPIN Verification API Call
```typescript
const verifyMpin = async (enteredMpin: string) => {
  setLoading(true);
  try {
    // Get user data from storage
    const userData = JSON.parse(
      (await AsyncStorage.getItem("userData")) || "{}"
    );
    
    if (!userData.mobile_number) {
      Alert.alert(t("error"), "User mobile number not found");
      return;
    }

    // Call the auth/login-mpin API endpoint
    const response = await fetch(`${theme.baseUrl}/auth/login-mpin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        mobileNumber: userData.mobile_number,
        mpin: enteredMpin
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store updated tokens
      if (data.accessToken) {
        await SecureStore.setItemAsync("accessToken", data.accessToken);
      }
      if (data.token) {
        await SecureStore.setItemAsync("token", data.token);
      }
      if (data.refreshtoken) {
        await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
      }
      if (data.authToken) {
        await SecureStore.setItemAsync("authToken", data.authToken);
      }

      // Update user data if provided
      if (data.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
      }

      // Login to global store
      useGlobalStore.getState().login(data.token || data.accessToken, {
        id: data.user?.user_id || userData.user_id,
        name: data.user?.name || userData.name,
        email: data.user?.email || userData.email,
        mobile: data.user?.mobile_number || userData.mobile_number,
        referralCode: data.user?.referralCode || userData.referralCode,
      });

      // Navigate to home
      router.replace("/(app)/(tabs)");
    } else {
      shakeError();
      Alert.alert(t("error"), data.message || t("incorrectMpin"));
      setMpinPins(["", "", "", ""]);
    }
  } catch (error) {
    console.error("Error verifying MPIN:", error);
    Alert.alert(t("error"), t("failedToVerifyMpin"));
    setMpinPins(["", "", "", ""]);
  } finally {
    setLoading(false);
  }
};
```

## Security Features

### 1. Token Validation
- JWT token expiration check on app launch
- Automatic cleanup of expired tokens
- 5-minute buffer before expiration

### 2. Secure Storage
- Tokens stored in SecureStore (encrypted)
- User data stored in AsyncStorage
- Automatic cleanup on logout/error

### 3. UI Security
- Secure text entry for MPIN input
- Visual feedback for errors (shake animation)
- Loading states to prevent multiple submissions

### 4. Error Handling
- Comprehensive error handling for network issues
- User-friendly error messages
- Automatic redirect to login on authentication failures

### 5. Route Protection
- All main app routes protected with AuthGuard
- Automatic redirect to MPIN verification for expired tokens
- No direct access to protected routes without authentication

## Navigation Flow

```
App Launch
    ↓
AuthGuard (index.tsx)
    ↓
Token Valid? → No → Login Screen
    ↓ Yes
User Data Exists? → No → Login Screen
    ↓ Yes
MPIN Verification Screen
    ↓
User Enters MPIN
    ↓
API Call: /auth/login-mpin
    ↓
Success? → No → Show Error, Clear MPIN
    ↓ Yes
Store Tokens & User Data
    ↓
Navigate to Home Screen
    ↓
Protected Routes (Home, Savings, Profile)
    ↓
AuthGuard checks on each route
    ↓
Token expired? → Yes → MPIN Verification
    ↓ No
Show Protected Content
```

## Error Scenarios

### 1. Invalid MPIN
- **Action**: Show error message, clear MPIN input
- **UI**: Shake animation on input fields
- **Message**: "Incorrect MPIN"

### 2. Network Error
- **Action**: Show network error alert
- **Message**: "Check your internet connection"

### 3. Token Expired
- **Action**: Clear all stored data, redirect to login
- **Message**: "Session expired, please login again"

### 4. Missing User Data
- **Action**: Clear tokens, redirect to login
- **Message**: "Authentication error, please login again"

### 5. Direct Access to Protected Routes
- **Action**: Redirect to MPIN verification or login
- **Behavior**: AuthGuard prevents access without proper authentication

## Testing

### Test Cases

1. **Valid MPIN**
   - Enter correct 4-digit MPIN
   - Should navigate to home screen
   - Should store all tokens

2. **Invalid MPIN**
   - Enter incorrect MPIN
   - Should show error message
   - Should clear input fields
   - Should show shake animation

3. **Expired Token**
   - Use expired JWT token
   - Should redirect to MPIN verification
   - Should clear all stored data

4. **Network Issues**
   - Disconnect internet
   - Should show network error
   - Should allow retry

5. **App Background/Resume**
   - Put app in background for >5 minutes
   - Resume app
   - Should require MPIN verification

6. **Direct Route Access**
   - Try to access protected routes without authentication
   - Should redirect to MPIN verification or login
   - Should not show protected content

7. **Token Expiration During Use**
   - Use app with valid token
   - Wait for token to expire
   - Try to access protected routes
   - Should redirect to MPIN verification

## Configuration

### Environment Variables
- `theme.baseUrl`: API base URL for authentication endpoints

### Translation Keys
- `enterMpinTitle`: "Enter MPIN"
- `enterMpinSubtitle`: "Enter your 4-digit MPIN to access your account"
- `incorrectMpin`: "Incorrect MPIN"
- `failedToVerifyMpin`: "Failed to verify MPIN"
- `verifyingCredentials`: "Verifying credentials..."

## Dependencies

- `expo-secure-store`: Secure token storage
- `@react-native-async-storage/async-storage`: User data storage
- `expo-router`: Navigation
- `zustand`: Global state management
- `react-native`: Core components and animations

## Security Best Practices

1. **Token Management**
   - Store tokens securely using SecureStore
   - Validate token expiration on every app launch
   - Clear tokens on logout or authentication failure

2. **Route Protection**
   - Wrap all protected routes with AuthGuard
   - Validate authentication on route access
   - Redirect unauthorized users appropriately

3. **MPIN Security**
   - Use secure text entry for MPIN input
   - Clear MPIN input on errors
   - Provide visual feedback for security events

4. **Error Handling**
   - Handle all authentication errors gracefully
   - Provide clear user feedback
   - Maintain security state on errors

5. **Session Management**
   - Implement proper session timeout
   - Handle app background/foreground transitions
   - Require re-authentication for sensitive operations 