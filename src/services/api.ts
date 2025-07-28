// services/api.ts
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './notification';
import { Alert } from 'react-native';
// import Toast from 'react-native-root-toast';
import LoadingService from './loadingServices';

// API Logger Class
class ApiLogger {
  private static instance: ApiLogger;
  private logs: Array<{
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    requestData?: any;
    responseData?: any;
    error?: any;
    userId?: string;
  }> = [];

  static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger();
    }
    return ApiLogger.instance;
  }

  logRequest(config: InternalAxiosRequestConfig, startTime: number) {
    // Safely parse request data using the utility function
    const requestData = this.safeParseRequestData(config.data);

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || 'UNKNOWN',
      requestData,
      startTime,
    };

    console.log('🚀 API REQUEST:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      data: logEntry.requestData,
      headers: config.headers,
    });

    this.logs.push(logEntry);
    return logEntry;
  }

  /**
   * Safely parse request data with error handling
   */
  private safeParseRequestData(data: any): any {
    if (!data) return undefined;
    
    try {
      // If data is already an object, use it directly
      if (typeof data === 'object') {
        return data;
      } else if (typeof data === 'string') {
        // If it's a string, try to parse it as JSON
        return JSON.parse(data);
      } else {
        // For other types, stringify for logging
        return String(data);
      }
    } catch (parseError) {
      // If JSON parsing fails, log the raw data as string
      console.warn('Failed to parse request data as JSON:', parseError);
      return String(data);
    }
  }

  logResponse(response: AxiosResponse, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: response.config.method?.toUpperCase() || 'UNKNOWN',
      url: response.config.url || 'UNKNOWN',
      status: response.status,
      duration,
      responseData: response.data,
    };

    console.log('✅ API RESPONSE:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      data: logEntry.responseData,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url) {
      Object.assign(lastLog, logEntry);
    }

    return logEntry;
  }

  logError(error: AxiosError, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || 'UNKNOWN',
      status: error.response?.status,
      duration,
      error: {
        message: error.message,
        code: error.code,
        responseData: error.response?.data,
      },
    };

    console.log('❌ API ERROR:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      error: logEntry.error,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url) {
      Object.assign(lastLog, logEntry);
    }

    return logEntry;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  getApiSummary() {
    const summary = {
      totalRequests: this.logs.length,
      successful: this.logs.filter(log => log.status && log.status >= 200 && log.status < 300).length,
      failed: this.logs.filter(log => log.error || (log.status && (log.status < 200 || log.status >= 300))).length,
      averageResponseTime: 0,
      endpoints: {} as Record<string, { count: number; avgTime: number; errors: number }>,
    };

    const successfulRequests = this.logs.filter(log => log.duration);
    if (successfulRequests.length > 0) {
      summary.averageResponseTime = successfulRequests.reduce((sum, log) => sum + (log.duration || 0), 0) / successfulRequests.length;
    }

    // Group by endpoint
    this.logs.forEach(log => {
      const endpoint = log.url || 'unknown';
      if (!summary.endpoints[endpoint]) {
        summary.endpoints[endpoint] = { count: 0, avgTime: 0, errors: 0 };
      }
      summary.endpoints[endpoint].count++;
      if (log.error) {
        summary.endpoints[endpoint].errors++;
      }
      if (log.duration) {
        summary.endpoints[endpoint].avgTime = 
          (summary.endpoints[endpoint].avgTime * (summary.endpoints[endpoint].count - 1) + log.duration) / summary.endpoints[endpoint].count;
      }
    });

    return summary;
  }
}

// Global API Logger instance
const apiLogger = ApiLogger.getInstance();

// Network state check
const checkNetworkState = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // console.error('Network state: No internet connection');
      throw new Error('NO_INTERNET');
    }
    // console.log('Network state: Connected', netInfo.type);
    return true;
  } catch (error) {
    console.error('Network state check failed:', error);
    throw error;
  }
};

// Check if endpoint is public (doesn't require authentication)
const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password'];
  return publicEndpoints.some(endpoint => url.includes(endpoint));
};

const checkTokenValidity = async () => {
  try {
    const token = await SecureStore.getItem("authToken");
    if (!token || typeof token !== 'string' || token.trim() === '') {
      // No token found or invalid token, redirect to login
      console.log('No valid token found, logging out');
      handleLogout();
      return null;
    }

    // Validate token format (should be a JWT with 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error("Invalid token format - not a valid JWT");
      handleLogout();
      return null;
    }

    // Check if token is expired
    try {
      const tokenData = JSON.parse(atob(tokenParts[1]));
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
            console.log('Token refresh failed, logging out');
            handleLogout();
            return null;
          }
        } else {
          // No refresh token, logout user
          console.log('No refresh token available, logging out');
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
    const startTime = Date.now();
    
    try {
      // Log the request
      apiLogger.logRequest(config, startTime);
      
      // console.log('Making API request to:', config.url);
      LoadingService.show('Loading...');
      
      await checkNetworkState();

      const token = await checkTokenValidity();
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // If no valid token and this is not a public endpoint, reject the request
        if (!isPublicEndpoint(config.url)) {
          console.log('No valid token for protected endpoint, rejecting request');
          return Promise.reject(new Error('NO_VALID_TOKEN'));
        }
      }
      
      // Store start time for response logging
      (config as any).startTime = startTime;
      
      return config;
    } catch (error: any) {
      console.error('Request interceptor error:', error);
      LoadingService.hide();
      
      if (error.message === 'NO_INTERNET') {
        showToast('No internet connection. Please check your network.', 'error');
      } else if (error.message === 'NO_VALID_TOKEN') {
        console.log('No valid token - user should be logged out already');
        // Don't show toast as logout should handle this
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
    const startTime = (response.config as any).startTime || Date.now();
    
    // Log the response
    apiLogger.logResponse(response, startTime);
    
    // console.log('API response received:', response.config.url, response.status);
    LoadingService.hide();
    
    if (response.config.method?.toUpperCase() !== 'GET') {
      const message = response.data?.message || 'Operation completed successfully';
      // showToast(message, 'success', Toast.durations.SHORT);
    }
    return response;
  },
  async (error: AxiosError) => {
    const startTime = (error.config as any)?.startTime || Date.now();
    
    // Log the error
    apiLogger.logError(error, startTime);
    
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
          // Handle 401 Unauthorized - immediate logout for token issues
          const errorMessage = message.toLowerCase();
          if (errorMessage.includes('no token provided') || 
              errorMessage.includes('access denied') || 
              errorMessage.includes('token') ||
              errorMessage.includes('unauthorized')) {
            console.log('401 Unauthorized - Token issue detected, logging out immediately');
            showToast('Authentication failed. Please login again.', 'error');
            // Immediate logout without alert for token-related issues
            handleLogout();
          } else {
            // For other 401 errors, show alert first
            showToast('Session expired. Please login again.', 'error');
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please login again.',
              [{
                text: 'OK',
                onPress: () => handleLogout()
              }]
            );
          }
          break;
        case 403:
          if (message.toLowerCase().includes('token') || message.toLowerCase().includes('authorization')) {
            // showToast('Authentication failed. Please login again.', 'error');
            handleLogout();
          } else {
            // showToast('You are not authorized for this action.', 'error');
          }
          break;
        case 404:
          // showToast('Resource not found.', 'warning');
          break;
        case 422:
          if (errorData && typeof errorData === 'object' && 'errors' in errorData) {
            const errors = (errorData as { errors: Record<string, string[]> }).errors;
            message = Object.values(errors).flat().join('\n');
          }
          // showToast(message, 'warning');
          break;
        case 500:
          // showToast('Server error. Please try again later.', 'error');
          break;
        default:
          // showToast(message, 'error');
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
  updateDeviceToken: (deviceToken: string, userId: number, device_type: 'ios' | 'android') => {
    return api.post('/notifications/token', { 
      userId,
      token: deviceToken, // Using 'token' key as backend expects device token in this field
      device_type
    });
  },
  getDeviceToken: (userId: number) => {
    return api.get(`/notifications/tokens/${userId}`);
  },
  // Updated method to send complete FCM data to existing endpoint
  updateFcmTokenWithCompleteData: (fcmData: {
    type: string;
    deviceId: string;
    development: boolean;
    appId: string;
    deviceToken: string;
    projectId: string;
  }, userId: number, device_type: 'ios' | 'android') => {
    return api.post('/notifications/token', { 
      userId,
      token: fcmData.deviceToken, // Using 'token' key as backend expects device token in this field
      device_type,
      // Include additional FCM data as extra fields
      fcmType: fcmData.type,
      deviceId: fcmData.deviceId,
      development: fcmData.development,
      appId: fcmData.appId,
      projectId: fcmData.projectId
    });
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

// Export the logger for external access
export { apiLogger };

export default api;