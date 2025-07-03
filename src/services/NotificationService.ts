import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { users } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  private async storeFcmToken(token: string) {
    try {
      await AsyncStorage.setItem('fcmToken', token);
      //console.log('FCM token stored locally');
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  }

  private async getStoredFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcmToken');
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  private async getLastSentToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('lastSentFcmToken');
    } catch (error) {
      console.error('Error getting last sent FCM token:', error);
      return null;
    }
  }

  private async storeLastSentToken(token: string) {
    try {
      await AsyncStorage.setItem('lastSentFcmToken', token);
    } catch (error) {
      console.error('Error storing last sent FCM token:', error);
    }
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        //console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }

        // Get the token
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        if (!expoPushToken?.data) {
          throw new Error('Failed to get push token');
        }

        // Extract just the token part without ExponentPushToken[] wrapper
        const cleanToken = expoPushToken.data.replace('ExponentPushToken[', '').replace(']', '');
        //console.log('Push token generated:', cleanToken);

        // Store the clean token locally
        console.log('cleanToken',cleanToken)
        await this.storeFcmToken(cleanToken);

        // Immediately try to send token to API
        await this.sendTokenToApi();

        return cleanToken;
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      //console.log('Must use physical device for Push Notifications');
      return null;
    }
  }

  // New method to send token to API when user info is available
  async sendTokenToApi(): Promise<void> {
    if (this.isSendingToken) return;
    this.isSendingToken = true;
    try {
      const token = await this.getStoredFcmToken();
      if (!token) {
        //console.log('No FCM token available to send');
        // Try to generate a new token if none exists
        const newToken = await this.registerForPushNotificationsAsync();
        if (!newToken) {
          //console.log('Failed to generate new FCM token');
          this.isSendingToken = false;
          return;
        }
        // Token was generated and stored, continue with sending
        this.isSendingToken = false;
        return this.sendTokenToApi(); // Recursively call with the new token
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
        // Check last sent token to avoid redundant API calls
        const lastSentToken = await this.getLastSentToken();
        if (lastSentToken === token) {
          //console.log('FCM token already sent, skipping update');
          this.isSendingToken = false;
          return;
        }
        try {
          // First, check if there's an existing token
          const existingTokenResponse = await users.getFcmToken(userId);
          const existingToken = existingTokenResponse.data?.token;

          if (existingToken) {
            // If token exists and is different, update it
            if (existingToken !== token) {
              const response = await users.updateFcmToken(token, userId, Platform.OS === 'ios' ? 'ios' : 'android');
              await this.storeLastSentToken(token);
            } else {
              //console.log('FCM token unchanged, skipping update');
              await this.storeLastSentToken(token); // Mark as sent to avoid future redundant calls
            }
          } else {
            // If no token exists, send new token
            const response = await users.updateFcmToken(token, userId, Platform.OS === 'ios' ? 'ios' : 'android');
            await this.storeLastSentToken(token);
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            // If token endpoint returns 404, send new token
            const response = await users.updateFcmToken(token, userId, Platform.OS === 'ios' ? 'ios' : 'android');
            await this.storeLastSentToken(token);
          } else {
            throw error;
          }
        }
      } else {
        //console.log('Skipping FCM token update - No valid user ID found');
      }
    } catch (error: any) {
      console.error('Error handling FCM token:', {
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

  // Setup notifications and register for push notifications
  async setupNotifications() {
    await this.registerForPushNotificationsAsync();
  }
}

export default new NotificationService(); 