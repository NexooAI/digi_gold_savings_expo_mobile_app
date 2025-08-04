// services/api.ts - Unified API Service
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './notification';
import { Alert } from 'react-native';
import LoadingService from './loadingServices';

// ============================================================================
// API LOGGER CLASS
// ============================================================================

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

  private safeParseRequestData(data: any): any {
    if (!data) return undefined;
    
    try {
      if (typeof data === 'object') {
        return data;
      } else if (typeof data === 'string') {
        return JSON.parse(data);
      } else {
        return String(data);
      }
    } catch (parseError) {
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
        response: error.response?.data,
        status: error.response?.status,
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
    const totalRequests = this.logs.length;
    const successfulRequests = this.logs.filter(log => log.status && log.status >= 200 && log.status < 300).length;
    const failedRequests = this.logs.filter(log => log.error).length;
    const averageDuration = this.logs.reduce((sum, log) => sum + (log.duration || 0), 0) / totalRequests || 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averageDuration: Math.round(averageDuration),
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const checkNetworkState = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/check-mobile',
    '/auth/verify-otp',
    '/auth/refresh-token',
    '/register/complete'
  ];
  return publicEndpoints.some(endpoint => url.includes(endpoint));
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const checkTokenValidity = async () => {
  try {
    let token = await SecureStore.getItem("token");
    if (!token) {
      token = await SecureStore.getItem("accessToken");
    }
    
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.log('No valid token found, but not logging out automatically');
      // Don't automatically logout - let the user continue
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error("Invalid token format - not a valid JWT, but not logging out");
      // Don't automatically logout for invalid token format
      return null;
    }

    try {
      const tokenData = JSON.parse(atob(tokenParts[1]));
      const expirationTime = tokenData.exp * 1000;
      
      if (Date.now() >= expirationTime) {
        const refreshToken = await SecureStore.getItem("refreshToken");
        if (refreshToken) {
          try {
            const response = await apiClient.post('/auth/refresh-token', { refreshToken });
            const newToken = response.data.token;
            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshtoken;
            
            await SecureStore.setItem("token", newToken);
            await SecureStore.setItem("accessToken", newAccessToken);
            await SecureStore.setItem("refreshToken", newRefreshToken);
            await SecureStore.setItem("authToken", newToken);
            
            return newToken;
          } catch (error) {
            console.log('Token refresh failed, but not logging out automatically');
            // Don't automatically logout on refresh failure
            return null;
          }
        } else {
          console.log('No refresh token available, but not logging out automatically');
          // Don't automatically logout when no refresh token
          return null;
        }
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      // Don't automatically logout on parsing error
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error checking token:", error);
    // Don't automatically logout on error
    return null;
  }
};

const handleLogout = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await AsyncStorage.removeItem("userData");
    router.replace("/(auth)/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const apiLogger = ApiLogger.getInstance();

const apiClient: AxiosInstance = axios.create({
  baseURL: theme.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const startTime = Date.now();
    
    // Log the request
    apiLogger.logRequest(config, startTime);
    
    LoadingService.show();
    
    // Store start time for response logging
    (config as any).startTime = startTime;
    
    // Add authentication token
    try {
      let token = await SecureStore.getItemAsync("token");
      console.log('🔑 Token from SecureStore (token):', token);
      
      if (!token) {
        token = await SecureStore.getItemAsync("accessToken");
        console.log('🔑 Token from SecureStore (accessToken):', token);
      }
      
      if (!token) {
        token = await SecureStore.getItemAsync("authToken");
        console.log('🔑 Token from SecureStore (authToken):', token);
      }
      
      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set:', config.headers.Authorization);
      } else {
        console.log('❌ No token found in SecureStore');
      }
    } catch (error) {
      console.error('Error setting authorization header:', error);
    }

    return config;
  },
  (error: AxiosError) => {
    LoadingService.hide();
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any).startTime || Date.now();
    apiLogger.logResponse(response, startTime);
    LoadingService.hide();
    return response;
  },
  async (error: AxiosError) => {
    const startTime = (error.config as any)?.startTime || Date.now();
    apiLogger.logError(error, startTime);
    LoadingService.hide();

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - attempting token refresh');
      const newToken = await checkTokenValidity();
      if (newToken && error.config) {
        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      }
    }

    // Handle network errors
    if (!error.response) {
      const isConnected = await checkNetworkState();
      if (!isConnected) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Authentication APIs
export const authAPI = {
  checkMobile: async (mobileNumber: string) => {
    return apiClient.post('/auth/check-mobile', { mobile_number: mobileNumber });
  },

  verifyOtp: async (mobileNumber: string, otp: string) => {
    return apiClient.post('/auth/verify-otp', { mobile_number: mobileNumber, otp });
  },

  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  }
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    return apiClient.get('/user/profile');
  },

  updateProfile: async (userData: any) => {
    return apiClient.put('/user/profile', userData);
  },

  uploadProfileImage: async (userId: number | string, fileUri: string) => {
    try {
      // Extract file extension from URI
      const uriParts = fileUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      
      // Determine MIME type based on extension
      let mimeType = 'image/jpeg';
      let fileName = 'profile.jpg';
      
      if (fileExtension === 'png') {
        mimeType = 'image/png';
        fileName = 'profile.png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
        fileName = 'profile.gif';
      } else if (fileExtension === 'webp') {
        mimeType = 'image/webp';
        fileName = 'profile.webp';
      }
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append('userId', userId.toString());

      console.log('Uploading with formData:', {
        userId: userId.toString(),
        fileName,
        mimeType,
        uri: fileUri
      });

      return apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  },

  updateFcmTokenWithCompleteData: async (payload: any, userId: number | string, deviceType: string) => {
    return apiClient.post('/notifications/token',{
      // ...payload,
      token: payload?.deviceToken,
      user_id: userId,
      device_type: deviceType
    });
  }
};

// Investment APIs
export const investmentAPI = {
  getInvestmentsByUser: async (userId: number | string) => {
    return apiClient.get(`/investments/user/${userId}`);
  },

  getInvestmentDetails: async (investmentId: number | string) => {
    return apiClient.get(`/investments/${investmentId}`);
  },

  createInvestment: async (investmentData: any) => {
    return apiClient.post('/investments', investmentData);
  }
};

// Payment APIs
export const paymentAPI = {
  processPayment: async (amount: number | string) => {
    return apiClient.post('/payments/process', { amount });
  },

  getPaymentHistory: async () => {
    return apiClient.get('/payments/history');
  },

  getPaymentStatus: async (paymentId: string) => {
    return apiClient.get(`/payments/status/${paymentId}`);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;
export { apiLogger, checkTokenValidity, handleLogout, checkNetworkState };