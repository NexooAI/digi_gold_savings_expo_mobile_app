# SMS OTP Auto-Fetch Implementation

## Overview

This implementation provides automatic SMS OTP detection and filling for both Android and iPhone platforms in your React Native Expo app.

## Features

✅ **Android**: Automatic SMS reading with permission request  
✅ **iPhone**: iOS built-in SMS OTP autofill support  
✅ **Smart Pattern Matching**: Supports multiple OTP formats  
✅ **Auto-Verification**: Automatically verifies OTP when detected  
✅ **Secure**: Only reads SMS from trusted senders  

## SMS Format Support

The implementation supports your current SMS format:
```
"Dear User , Your OTP for Dc Jewellery DigitalApp registration is 5799. Thank you for choosing Dc Jewellery DigitalApp."
```

And also supports these generic patterns:
- `OTP.*?(\d{4,6})` - "Your OTP is 1234"
- `(\d{4,6}).*?OTP` - "1234 is your OTP"
- `verification.*?(\d{4,6})` - "Verification code 1234"
- `code.*?(\d{4,6})` - "Your code is 1234"

## How It Works

### Android
1. **Permission Request**: App requests SMS reading permission
2. **SMS Listener**: Listens for incoming SMS messages
3. **Sender Verification**: Only processes SMS from "Dc Jewellery"
4. **Pattern Matching**: Extracts OTP using regex patterns
5. **Auto-Fill**: Automatically fills OTP inputs
6. **Auto-Verify**: Verifies OTP after 500ms delay

### iPhone
1. **iOS AutoFill**: Uses `textContentType="oneTimeCode"` and `autoComplete="sms-otp"`
2. **System Integration**: iOS automatically suggests OTP from SMS
3. **Manual Fill**: User can tap to auto-fill from iOS suggestion

## Implementation Details

### Files Created/Modified

1. **`src/hooks/useOtpAutoFetch.ts`** - Custom hook for SMS auto-fetch
2. **`src/app/(auth)/login.tsx`** - Updated with auto-fetch functionality
3. **`src/app/(auth)/register.tsx`** - Updated with auto-fetch functionality
4. **`plugins/withAndroidManifest.js`** - Added SMS permissions

### Key Components

#### Custom Hook: `useOtpAutoFetch`
```typescript
const { startSmsListener, stopSmsListener } = useOtpAutoFetch({
  onOtpReceived: handleOtpAutoFill,
  isActive: isShowOtp, // Start when OTP screen is shown
  senderName: 'Dc Jewellery', // Filter SMS by sender
});
```

#### Auto-Fill Handler
```typescript
const handleOtpAutoFill = (otp: string) => {
  const otpArray = otp.split('');
  setPins(otpArray);
  
  // Auto-verify after 500ms
  if (otp.length === 4) {
    setTimeout(() => verifyOtp(otp), 500);
  }
};
```

## Permissions

### Android Permissions Added
```xml
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.READ_SMS" />
```

### iOS Configuration
- Uses built-in `textContentType="oneTimeCode"`
- Uses `autoComplete="sms-otp"` for web compatibility

## Testing

### Android Testing
1. Send test SMS with format: "Your OTP for Dc Jewellery DigitalApp registration is 1234"
2. App should automatically detect and fill OTP
3. Check console logs for debugging

### iPhone Testing
1. Send test SMS with OTP
2. iOS should show OTP suggestion above keyboard
3. Tap suggestion to auto-fill

## Debugging

### Console Logs
- `SMS auto-fetch initialized for Android` - Hook initialized
- `Received SMS message: [message]` - SMS detected
- `Extracted OTP: [otp]` - OTP pattern matched
- `Auto-filling OTP: [otp]` - OTP being filled

### Common Issues
1. **Permission Denied**: User declined SMS permission
2. **Pattern Not Matched**: SMS format doesn't match patterns
3. **Wrong Sender**: SMS not from "Dc Jewellery"

## Security Features

1. **Sender Filtering**: Only processes SMS from trusted sender
2. **Pattern Validation**: Validates OTP format before processing
3. **Auto-Stop**: Stops listening after successful OTP extraction
4. **Cleanup**: Properly removes listeners on component unmount

## Customization

### Update Sender Name
```typescript
senderName: 'Your Company Name'
```

### Add Custom Patterns
```typescript
const patterns = [
  /Your custom pattern (\d{4,6})/i,
  // ... existing patterns
];
```

### Adjust Auto-Verify Delay
```typescript
setTimeout(() => verifyOtp(otp), 1000); // 1 second delay
```

## Future Enhancements

1. **Multiple Sender Support**: Support OTP from multiple senders
2. **Dynamic Patterns**: Configure OTP patterns from server
3. **Analytics**: Track auto-fetch success rates
4. **Fallback Methods**: Alternative OTP extraction methods

## Support

For issues or questions about the OTP auto-fetch implementation:
1. Check console logs for debugging information
2. Verify SMS format matches supported patterns
3. Ensure permissions are granted on Android
4. Test with different OTP formats if needed 