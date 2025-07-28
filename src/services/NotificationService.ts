import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { users } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isSendingToken = false;

  // Helper method to check Google Services configuration
  private async checkGoogleServicesConfig() {
    try {
      const googleServicesPath = FileSystem.documentDirectory + 'google-services.json';
      const fileInfo = await FileSystem.getInfoAsync(googleServicesPath);
      
      console.log('📱 Google Services Configuration Check:', {
        fileExists: fileInfo.exists,
        fileSize: fileInfo.exists ? (fileInfo as any).size : 'N/A',
        fileUri: fileInfo.uri,
        platform: Platform.OS,
        projectId: Constants?.expoConfig?.extra?.eas?.projectId,
        expoConfig: {
          extra: Constants?.expoConfig?.extra,
          eas: Constants?.expoConfig?.extra?.eas
        }
      });

      return fileInfo.exists;
    } catch (error) {
      console.error('❌ Error checking Google Services config:', error);
      return false;
    }
  }

  private async storeDeviceToken(token: string) {
    try {
      await AsyncStorage.setItem('deviceToken', token);
      console.log('Device token stored locally');
    } catch (error) {
      console.error('Error storing device token:', error);
    }
  }

  private async getStoredDeviceToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('deviceToken');
    } catch (error) {
      console.error('Error getting stored device token:', error);
      return null;
    }
  }

  private async getLastSentDeviceToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('lastSentDeviceToken');
    } catch (error) {
      console.error('Error getting last sent device token:', error);
      return null;
    }
  }

  private async storeLastSentDeviceToken(token: string) {
    console.log('lastSentDeviceToken', token);
    try {
      await AsyncStorage.setItem('lastSentDeviceToken', token);
    } catch (error) {
      console.error('Error storing last sent device token:', error);
    }
  }

  // Get device token for notifications
  async getDeviceTokenAsync() {
    let deviceToken;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Get notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    try {
      // Debugger: Add breakpoint before device token generation
      debugger;
      
      // Check Google Services configuration
      await this.checkGoogleServicesConfig();
      
      // Get device information
      const deviceInfo = {
        deviceId: Device.deviceName || Device.modelName || 'unknown',
        deviceType: Platform.OS,
        deviceBrand: Device.brand || 'unknown',
        deviceModel: Device.modelName || 'unknown',
        deviceYear: Device.deviceYearClass || 'unknown',
        deviceName: Device.deviceName || 'unknown'
      };

      // Log device token generation details
      console.log('🔍 Device Token Generation Debug Info:', {
        deviceInfo,
        platform: Platform.OS,
        permissionsStatus: finalStatus
      });

      // Generate a unique device token using device information
      const deviceTokenData = {
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType,
        deviceBrand: deviceInfo.deviceBrand,
        deviceModel: deviceInfo.deviceModel,
        timestamp: Date.now(),
        randomId: Math.random().toString(36).substring(2, 15)
      };

      // Create a unique device token string
      deviceToken = `${deviceInfo.deviceType}_${deviceInfo.deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Store the device token locally
      await this.storeDeviceToken(deviceToken);

      // Immediately try to send device token to API
      await this.sendDeviceTokenToApi();

      console.log('✅ Device token generated and stored:', deviceToken);
      return deviceToken;
    } catch (error) {
      // Debugger: Add breakpoint for device token generation errors
      debugger;
      console.error('❌ Error getting device token:', error);
      console.log('🔍 Error details for debugging:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        platform: Platform.OS
      });
      return null;
    }
  }

  // New method to send device token to API when user info is available
  async sendDeviceTokenToApi(): Promise<void> {
    if (this.isSendingToken) return;
    this.isSendingToken = true;
    try {
      const deviceToken = await this.getStoredDeviceToken();
      if (!deviceToken) {
        console.log('🔄 No device token found, attempting to generate new device token...');
        
        // Debugger: Add breakpoint before generating new device token
        debugger;
        
        // Try to generate a new device token if none exists
        const newDeviceToken = await this.getDeviceTokenAsync();
        if (!newDeviceToken) {
          console.log('❌ Failed to generate new device token');
          this.isSendingToken = false;
          return;
        }
        // Device token was generated and stored, continue with sending
        this.isSendingToken = false;
        return this.sendDeviceTokenToApi(); // Recursively call with the new device token
      }

      // Get user data from store or storage
      let userId = 0;
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = Number(userData.user_id) || 0;
      } else {
        // Try to get from global store if available
        const user = useGlobalStore.getState().user;
        if (user) {
          userId = Number((user as any).user_id || user.id) || 0;
        }
      }

      if (userId > 0) {
        // Check last sent device token to avoid redundant API calls
        const lastSentDeviceToken = await this.getLastSentDeviceToken();
        if (lastSentDeviceToken === deviceToken) {
          console.log('✅ Device token already sent, skipping update');
          this.isSendingToken = false;
          return;
        }
        try {
          // First, check if there's an existing token
          const existingTokenResponse = await users.getDeviceToken(userId);
          const existingToken = existingTokenResponse.data?.token;

          if (existingToken) {
            // If token exists and is different, update it
            if (existingToken !== deviceToken) {
              const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
              console.log('📤 Sending device token update payload:', {
                userId,
                token: deviceToken,
                device_type: deviceType
              });
              const response = await users.updateDeviceToken(deviceToken, userId, deviceType);
              console.log('✅ Device token update response:', response);
              await this.storeLastSentDeviceToken(deviceToken);
            } else {
              console.log('✅ Device token unchanged, skipping update');
              await this.storeLastSentDeviceToken(deviceToken); // Mark as sent to avoid future redundant calls
            }
          } else {
            // If no token exists, send new device token
            const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
            console.log('📤 Sending new device token payload:', {
              userId,
              token: deviceToken,
              device_type: deviceType
            });
            const response = await users.updateDeviceToken(deviceToken, userId, deviceType);
            console.log('✅ New device token response:', response);
            await this.storeLastSentDeviceToken(deviceToken);
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            // If token endpoint returns 404, send new device token
            const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
            console.log('📤 Sending device token (404 fallback) payload:', {
              userId,
              token: deviceToken,
              device_type: deviceType
            });
            const response = await users.updateDeviceToken(deviceToken, userId, deviceType);
            console.log('✅ Device token (404 fallback) response:', response);
            await this.storeLastSentDeviceToken(deviceToken);
          } else {
            throw error;
          }
        }
      } else {
        console.log('⚠️ Skipping device token update - No valid user ID found');
      }
    } catch (error: any) {
      console.error('❌ Error handling device token:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      this.isSendingToken = false;
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // null means show immediately
    });
  }

  // Schedule a delayed notification
  async scheduleDelayedNotification(title: string, body: string, seconds: number, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Add notification received listener
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response received listener
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService(); 