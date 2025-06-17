import { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';

// Import SMS Retriever for Android
let SmsRetriever: any;
if (Platform.OS === 'android') {
  try {
    SmsRetriever = require('react-native-sms-retriever').default;
  } catch (error) {
    //console.log('SMS Retriever not available:', error);
  }
}

interface UseOtpAutoFetchProps {
  onOtpReceived: (otp: string) => void;
  isActive: boolean;
  senderName?: string;
}

export const useOtpAutoFetch = ({
  onOtpReceived,
  isActive,
  senderName = 'Dc Jewellery'
}: UseOtpAutoFetchProps) => {
  const smsListenerRef = useRef<any>(null);

  // Extract OTP from message based on your SMS format
  const extractOtpFromMessage = (message: string): string | null => {
    //console.log('Received SMS message:', message);

    // Multiple patterns to match different OTP formats
    const patterns = [
      // Pattern for "Your OTP for Dc Jewellery DigitalApp registration is 5799"
      /Your OTP for.*?is\s+(\d{4,6})/i,
      // Generic 4-6 digit OTP patterns
      /OTP.*?(\d{4,6})/i,
      /(\d{4,6}).*?OTP/i,
      /verification.*?(\d{4,6})/i,
      /code.*?(\d{4,6})/i,
      // Match any 4-6 digit number (fallback)
      /\b(\d{4,6})\b/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const otp = match[1];
        //console.log('Extracted OTP:', otp);
        return otp;
      }
    }

    //console.log('No OTP pattern matched');
    return null;
  };

  // Open app settings
  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  // Show permission denied alert
  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'SMS Permission Required',
      'Please enable SMS permissions in Settings to use auto-fill OTP feature.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open Settings',
          onPress: openAppSettings
        }
      ]
    );
  };

  // Request SMS permission for Android
  const requestSmsPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      // Request both READ_SMS and RECEIVE_SMS permissions
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      // Check if all permissions are granted
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        //console.log('SMS permissions not granted:', results);

        // Check if any permission is permanently denied
        const hasPermanentDenial = Object.values(results).some(
          result => result === 'never_ask_again'
        );

        if (hasPermanentDenial) {
          showPermissionDeniedAlert();
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error('SMS permission error:', error);
      return false;
    }
  };

  // Start SMS listening for Android
  const startSmsListener = async () => {
    if (Platform.OS !== 'android' || !SmsRetriever) {
      //console.log('SMS Retriever not available for this platform');
      return;
    }

    try {
      const hasPermission = await requestSmsPermission();
      if (!hasPermission) {
        //console.log('SMS permissions denied');
        return;
      }

      // Start SMS listener
      await SmsRetriever.requestPhoneNumber();

      smsListenerRef.current = SmsRetriever.addSmsListener((event: any) => {
        //console.log('SMS Listener Event:', event);

        if (event && event.message) {
          // Check if SMS is from the expected sender
          const isFromExpectedSender = event.message
            .toLowerCase()
            .includes(senderName.toLowerCase());

          if (isFromExpectedSender) {
            const otp = extractOtpFromMessage(event.message);
            if (otp) {
              //console.log('Auto-filled OTP:', otp);
              onOtpReceived(otp);
              stopSmsListener(); // Stop listening after successful OTP extraction
            }
          }
        }
      });

      //console.log('SMS listener started successfully');
    } catch (error) {
      console.error('Error starting SMS listener:', error);
    }
  };

  // Stop SMS listener
  const stopSmsListener = () => {
    if (smsListenerRef.current) {
      try {
        if (Platform.OS === 'android' && SmsRetriever) {
          SmsRetriever.removeSmsListener();
        }
        smsListenerRef.current = null;
        //console.log('SMS listener stopped');
      } catch (error) {
        console.error('Error stopping SMS listener:', error);
      }
    }
  };

  // Effect to manage SMS listener lifecycle
  useEffect(() => {
    if (isActive && Platform.OS === 'android') {
      startSmsListener();
    }

    return () => {
      stopSmsListener();
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSmsListener();
    };
  }, []);

  return {
    startSmsListener,
    stopSmsListener,
    extractOtpFromMessage,
  };
}; 