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

// Network state check
const checkNetworkState = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('NO_INTERNET');
  }
  return true;
};

const checkTokenValidity = async () => {
  try {
    const token = await SecureStore.getItem("authToken");
    return token;
  } catch (error) {
    console.error("Error checking token:", error);
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
      await checkNetworkState();

      const token = await checkTokenValidity();
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error: any) {
      if (error.message === 'NO_INTERNET') {
        showToast('No internet connection. Please check your network.', 'error');
      }
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Show success toast for non-GET requests
    if (response.config.method?.toUpperCase() !== 'GET') {
      const message = response.data?.message || 'Operation completed successfully';
      showToast(message, 'success', Toast.durations.SHORT);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Handle different error cases
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
          showToast('You are not authorized for this action.', 'error');
          break;
        case 404:
          showToast('Resource not found.', 'warning');
          break;
        case 422: // Validation errors
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
  getLiveRates: () => api.get('/rates/current'),
};

export const users = {
  updateFcmToken: (token: string, userId: number, device_type: 'ios' | 'android') => {
    return api.post('/notifications/token', { 
      userId,
      token,
      device_type
    });
  },
};

export const news = {
  getActiveFlashNews: () => api.get('/flash-news-active'),
};

export const posts = {
  getActivePosts: () => api.get('/posts-active'),
};

export const collections = {
  getCollections: () => api.get('/collections'),
};

export default api;