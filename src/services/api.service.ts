// src/services/apiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import LoadingService from './loadingServices';
import { theme } from '@/constants/theme';
import * as SecureStore from "expo-secure-store";

// API Logger for this service
class ApiServiceLogger {
  private logs: Array<{
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    requestData?: any;
    responseData?: any;
    error?: any;
  }> = [];

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

    console.log('🚀 API SERVICE REQUEST:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      data: logEntry.requestData,
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

    console.log('✅ API SERVICE RESPONSE:', {
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

    console.log('❌ API SERVICE ERROR:', {
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
}

const apiServiceLogger = new ApiServiceLogger();

const apiClient: AxiosInstance = axios.create({
  baseURL: theme.baseUrl, // Replace with your API base URL
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor: add auth tokens, start loading indicator, etc.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const startTime = Date.now();
    
    // Log the request
    apiServiceLogger.logRequest(config, startTime);
    
    LoadingService.show();
    
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
      console.error('Error adding auth token:', error);
    }
    
    // Store start time for response logging
    (config as any).startTime = startTime;
    
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    LoadingService.hide();
    return Promise.reject(error);
  }
);

// Response interceptor: hide loading indicator and handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const startTime = (response.config as any).startTime || Date.now();
    
    // Log the response
    apiServiceLogger.logResponse(response, startTime);
    
    LoadingService.hide();
    return response;
  },
  (error: AxiosError) => {
    const startTime = (error.config as any)?.startTime || Date.now();
    
    // Log the error
    apiServiceLogger.logError(error, startTime);
    
    LoadingService.hide();
    
    // Don't show automatic alerts for MPIN verification endpoint
    // Let the component handle the error display
    const isMpinVerification = error.config?.url?.includes('/auth/login-mpin');
    
    if (!isMpinVerification) {
      if (error.response) {
        Alert.alert('Error', (error.response.data && (error.response.data as any).message) || 'Something went wrong!');
      } else if (error.request) {
        console.log(error)
        Alert.alert('Network Error', 'Please check your internet connection.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Fetches the investments for a given user.
 * @param userId The ID of the user whose investments are to be retrieved.
 * @returns A promise that resolves with the investments response data.
 */
export const getInvestmentsByUser = async (userId: number | string): Promise<any> => {
  try {
    const response: AxiosResponse = await apiClient.get(`/investments/?userId=${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const processPayment = async (amount: number | string): Promise<any> => {
  try {
    const response: AxiosResponse = await apiClient.post(`/initiate`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Uploads a profile image for a user.
 * @param userId The ID of the user
 * @param fileUri The local file URI of the image to upload
 * @returns A promise that resolves with the upload response data
 */
export const uploadProfileImage = async (userId: number | string, fileUri: string): Promise<any> => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg', // You can make this dynamic based on file extension
      name: 'profile_image.jpg'
    } as any);
    
    console.log("📤 Upload request - userId:", userId);
    console.log("📤 Upload request - fileUri:", fileUri);
    console.log("📤 Upload request - formData:", formData);
    
    const response: AxiosResponse = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("✅ Upload response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Upload error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });
    throw error;
  }
};

export default {
  getInvestmentsByUser,
  processPayment,
  uploadProfileImage
};

// Export the logger for external access
export { apiServiceLogger };

// Export the apiClient for external access
export { apiClient };
