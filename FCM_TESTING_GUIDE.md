# FCM Token Testing Guide

## Overview
This guide explains how to test and verify the FCM (Firebase Cloud Messaging) token generation and server communication in your React Native Expo app.

## Setup Verification

### 1. Check Configuration
Ensure your `app.config.js` has the correct project ID:
```javascript
extra: {
  eas: {
    projectId: "9af1745a-105c-44f9-9e53-a111bc6ed9ce", // Your project ID
  },
}
```

### 2. Verify Google Services
Ensure `google-services.json` is present in your project root for Android.

## Testing Methods

### Method 1: Automatic Testing (Recommended)
The FCM token is automatically generated and sent when the app starts. Check the console logs for:

```
✅ Setting up notifications...
✅ FCM token registered successfully: [token]
✅ FCM token sent to server successfully
```

### Method 2: Manual Testing via UI
1. Open your app
2. Navigate to the **Notifications** screen
3. Use the test buttons:

#### **Test FCM Button** (Blue)
- Sends existing FCM token to server
- Good for testing server communication

#### **Debug FCM Button** (Green)
- Shows current FCM token status
- Displays token existence and sent status

#### **Test Flow Button** (Orange)
- Runs complete FCM flow test
- Generates new token and sends to server
- Most comprehensive test

### Method 3: Console Testing
Open your browser's developer console and run:

```javascript
// Debug current FCM status
await NotificationService.debugFcmTokenStatus();

// Test complete flow
await NotificationService.testCompleteFcmFlow();

// Manually send token
await NotificationService.manuallySendFcmToken();
```

## Expected Console Output

### Successful Token Generation:
```
🧪 Starting FCM Flow Test...
📱 Step 1: Generating FCM token...
✅ FCM token generated: dwduljk5Qp6DjoAOjzlfTO:APA91bHxmsZFxR6Iw77FKt-ZVxmFdpvj8XyppNognrUENfABYnXbhqzL9h6Kf4P_xXemtTObA5uVG48ChjJAUUBtZWUoBh6hul_X1bEpsM7XSVWK5B79rGw
🌐 Step 2: Sending token to server...
✅ FCM token sent to server successfully
🔍 Step 3: Verifying token status...
=== FCM Token Debug Info ===
Stored Token: dwduljk5Qp6DjoAOjzlfTO:APA91bHxmsZFxR6Iw77FKt-ZVxmFdpvj8XyppNognrUENfABYnXbhqzL9h6Kf4P_xXemtTObA5uVG48ChjJAUUBtZWUoBh6hul_X1bEpsM7XSVWK5B79rGw
Device ID: device_1703123456789_abc123def
Last Sent Token: dwduljk5Qp6DjoAOjzlfTO:APA91bHxmsZFxR6Iw77FKt-ZVxmFdpvj8XyppNognrUENfABYnXbhqzL9h6Kf4P_xXemtTObA5uVG48ChjJAUUBtZWUoBh6hul_X1bEpsM7XSVWK5B79rGw
Token Exists: true
Token Sent: true
===========================
✅ FCM flow test completed successfully!
```

## Server API Endpoints

Your server should handle these endpoints:

### 1. Basic Token Update
**POST** `/notifications/token`
```json
{
  "userId": 123,
  "deviceToken": "dwduljk5Qp6DjoAOjzlfTO:APA91bHxmsZFxR6Iw77FKt-ZVxmFdpvj8XyppNognrUENfABYnXbhqzL9h6Kf4P_xXemtTObA5uVG48ChjJAUUBtZWUoBh6hul_X1bEpsM7XSVWK5B79rGw",
  "device_type": "android"
}
```

### 2. Complete FCM Data
**POST** `/notifications/token`
```json
{
  "userId": 123,
  "deviceToken": "dwduljk5Qp6DjoAOjzlfTO:APA91bHxmsZFxR6Iw77FKt-ZVxmFdpvj8XyppNognrUENfABYnXbhqzL9h6Kf4P_xXemtTObA5uVG48ChjJAUUBtZWUoBh6hul_X1bEpsM7XSVWK5B79rGw",
  "device_type": "android",
  "fcmType": "fcm",
  "deviceId": "device_1703123456789_abc123def",
  "development": false,
  "appId": "com.nexooai.dcjewellery",
  "projectId": "9af1745a-105c-44f9-9e53-a111bc6ed9ce"
}
```

## Troubleshooting

### Common Issues:

1. **"Project ID not found"**
   - Check `app.config.js` has correct `projectId`
   - Verify EAS project configuration

2. **"Failed to get push token"**
   - Check internet connection
   - Verify Expo account permissions
   - Check device permissions

3. **"No valid user ID found"**
   - User must be logged in
   - Check user data storage

4. **Server communication errors**
   - Check server endpoint availability
   - Verify API authentication
   - Check network connectivity

### Debug Steps:

1. **Check Permissions:**
   ```javascript
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Notification permission status:', status);
   ```

2. **Check Stored Data:**
   ```javascript
   const token = await AsyncStorage.getItem('fcmToken');
   const deviceId = await AsyncStorage.getItem('deviceId');
   console.log('Stored token:', token);
   console.log('Device ID:', deviceId);
   ```

3. **Test Server Endpoint:**
   ```javascript
   // Test basic endpoint
   fetch('/notifications/token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: 123,
       deviceToken: 'test-token',
       device_type: 'android'
     })
   });
   ```

## Success Criteria

✅ FCM token is generated successfully  
✅ Token is stored locally  
✅ Token is sent to server  
✅ Server responds with success  
✅ Token is marked as sent  
✅ Debug info shows correct status  

## Next Steps

Once FCM is working:
1. Test push notification delivery
2. Implement notification handling
3. Add notification categories
4. Set up notification scheduling
5. Implement notification preferences

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify all configuration files
3. Test on both development and production builds
4. Check server logs for API errors 