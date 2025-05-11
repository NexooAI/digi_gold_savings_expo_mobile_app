// services/api.ts
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

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

// Create an Axios instance with a base URL and default config
const api = axios.create({
  baseURL: theme.baseUrl,
  timeout: 15000, // Increased timeout to 15 seconds
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

// Schemes API
export const schemes = {
  getSchemes: () => api.get('/schemes'),
  getSchemeById: (id: string) => api.get(`/schemes/${id}`),
};

// Rates API
export const rates = {
  getLiveRates: () => api.get('/rates/current'),
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Check network state before making request
      await checkNetworkState();
      
      const token = await checkTokenValidity();
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error: any) {
      if (error.message === 'NO_INTERNET') {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [
            {
              text: 'Retry',
              onPress: async () => {
                const netState = await NetInfo.fetch();
                if (netState.isConnected) {
                  // Retry the request
                  return config;
                }
              }
            }
          ]
        );
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
    return response;
  },
  async (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      Alert.alert(
        'Request Timeout',
        'The request took too long to complete. Please try again.',
        [{ text: 'OK' }]
      );
    } else if (!error.response) {
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    } else if (error.response.status === 401) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [{ 
          text: 'OK',
          onPress: () => handleLogout()
        }]
      );
    } else if (error.response.status === 500) {
      Alert.alert(
        'Server Error',
        'Something went wrong on our end. Please try again later.',
        [{ text: 'OK' }]
      );
    } else {
      const errorMessage = error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? (error.response.data as { message: string }).message
        : 'An unexpected error occurred.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
    return Promise.reject(error);
  }
);

export default api;
