import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { users } from '@/app/services/api';
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
  private async storeFcmToken(token: string) {
    try {
      await AsyncStorage.setItem('fcmToken', token);
      console.log('FCM token stored locally');
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

  // New method to send token to API when user info is available
  async sendTokenToApi() {
    try {
      const token = await this.getStoredFcmToken();
      if (!token) {
        console.log('No FCM token available to send');
        return;
      }

      // Check if this token was already sent
      const lastSentToken = await this.getLastSentToken();
      if (lastSentToken === token) {
        console.log('Token already sent to API, skipping...');
        return;
      }

      // Get user data from store or storage
      let userId = 0;
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('User data:------------------', userData);
        userId = Number(userData.user_id) || 0;
      } else {
        // Try to get from global store if available
        const user = useGlobalStore.getState().user;
        if (user) {
          // Handle both possible user object structures
          userId = Number((user as any).user_id || user.id) || 0;
        }
      }

      if (userId > 0) {
        console.log('Sending FCM token to API - User ID:', userId);
        const response = await users.updateFcmToken(token, userId, Platform.OS === 'ios' ? 'ios' : 'android');
        console.log('FCM token sent to API successfully', response.data);
        // Store the token as last sent
        await this.storeLastSentToken(token);
      } else {
        console.log('Skipping FCM token update - No valid user ID found');
      }
    } catch (error: any) {
      console.error('Error sending FCM token to API:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
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
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        // Extract just the token part without ExponentPushToken[] wrapper
        const cleanToken = token.replace('ExponentPushToken[', '').replace(']', '');
        console.log('Push token generated:', cleanToken);
        
        // Store the clean token locally
        await this.storeFcmToken(cleanToken);
        
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
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