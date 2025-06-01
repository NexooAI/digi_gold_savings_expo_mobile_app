// services/api.ts
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './notification';
import { Alert } from 'react-native';
import Toast from 'react-native-root-toast';
import LoadingService from './loadingServices';

// Network state check
const checkNetworkState = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.error('Network state: No internet connection');
      throw new Error('NO_INTERNET');
    }
    console.log('Network state: Connected', netInfo.type);
    return true;
  } catch (error) {
    console.error('Network state check failed:', error);
    throw error;
  }
};

const checkTokenValidity = async () => {
  try {
    const token = await SecureStore.getItem("authToken");
    if (!token) {
      // No token found, redirect to login
      handleLogout();
      return null;
    }

    // Check if token is expired
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expirationTime) {
        // Token is expired, try to refresh
        const refreshToken = await SecureStore.getItem("refreshToken");
        if (refreshToken) {
          try {
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const newToken = response.data.token;
            await SecureStore.setItem("authToken", newToken);
            return newToken;
          } catch (error) {
            // Refresh failed, logout user
            handleLogout();
            return null;
          }
        } else {
          // No refresh token, logout user
          handleLogout();
          return null;
        }
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      handleLogout();
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error checking token:", error);
    handleLogout();
    return null;
  }
};

// Create an Axios instance
const api = axios.create({
  baseURL: theme.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const handleLogout = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
    await AsyncStorage.removeItem("userData");
    router.replace("/(auth)/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      console.log('Making API request to:', config.url);
      LoadingService.show('Loading...');
      
      await checkNetworkState();

      const token = await checkTokenValidity();
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error: any) {
      console.error('Request interceptor error:', error);
      LoadingService.hide();
      
      if (error.message === 'NO_INTERNET') {
        showToast('No internet connection. Please check your network.', 'error');
      }
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    LoadingService.hide();
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API response received:', response.config.url, response.status);
    LoadingService.hide();
    
    if (response.config.method?.toUpperCase() !== 'GET') {
      const message = response.data?.message || 'Operation completed successfully';
      showToast(message, 'success', Toast.durations.SHORT);
    }
    return response;
  },
  async (error: AxiosError) => {
    console.error('API error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    LoadingService.hide();
    
    if (error.code === 'ECONNABORTED') {
      showToast('Request timeout. Please try again.', 'error');
    } else if (!error.response) {
      showToast('Network error. Please check your connection.', 'error');
    } else {
      const status = error.response?.status;
      const errorData = error.response?.data;

      let message = 'An unexpected error occurred';
      if (typeof errorData === 'object' && errorData !== null) {
        message = (errorData as any).message ||
          (errorData as any).error ||
          JSON.stringify(errorData);
      } else if (typeof errorData === 'string') {
        message = errorData;
      }

      switch (status) {
        case 401:
          showToast('Session expired. Please login again.', 'error');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [{
              text: 'OK',
              onPress: () => handleLogout()
            }]
          );
          break;
        case 403:
          if (message.toLowerCase().includes('token') || message.toLowerCase().includes('authorization')) {
            showToast('Authentication failed. Please login again.', 'error');
            handleLogout();
          } else {
            showToast('You are not authorized for this action.', 'error');
          }
          break;
        case 404:
          showToast('Resource not found.', 'warning');
          break;
        case 422:
          if (errorData && typeof errorData === 'object' && 'errors' in errorData) {
            const errors = (errorData as { errors: Record<string, string[]> }).errors;
            message = Object.values(errors).flat().join('\n');
          }
          showToast(message, 'warning');
          break;
        case 500:
          showToast('Server error. Please try again later.', 'error');
          break;
        default:
          showToast(message, 'error');
          break;
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const schemes = {
  getSchemes: () => api.get('/schemes'),
  getSchemeById: (id: string) => api.get(`/schemes/${id}`),
  getActiveSchemesCount: () => api.get('/schemes/active/count'),
  getUserActiveSchemesCount: (userId: string) => api.get(`/schemes/user/${userId}/active/count`),
};

export const rates = {
  getLiveRates: async () => await api.get('/rates/current'),
};

export const users = {
  updateFcmToken: (token: string, userId: number, device_type: 'ios' | 'android') => {
    return api.post('/notifications/token', { 
      userId,
      token,
      device_type
    });
  },
  getFcmToken: (userId: number) => {
    return api.get(`/notifications/tokens/${userId}`);
  }
};

export const news = {
  getActiveFlashNews: () => api.get('/flash-news/active'),
};

export const posts = {
  getActivePosts: () => api.get('/posts-active'),
};

export const collections = {
  getCollections: () => api.get('/collections'),
};

export const posters = {
  getActivePosters: () => api.get('/posters/active'),
};

export default api;