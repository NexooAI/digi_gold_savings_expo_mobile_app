// src/services/apiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import LoadingService from './loadingServices';
import { theme } from '@/constants/theme';

const apiClient: AxiosInstance = axios.create({
  baseURL: theme.baseUrl, // Replace with your API base URL
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor: add auth tokens, start loading indicator, etc.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    LoadingService.show();
    // Example: if you have an auth token, attach it
    // const token = await AsyncStorage.getItem('userToken');
    // if (token) {
    //   config.headers = {
    //     ...config.headers,
    //     Authorization: `Bearer ${token}`,
    //   };
    // }
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
    LoadingService.hide();
    return response;
  },
  (error: AxiosError) => {
    LoadingService.hide();
    if (error.response) {
      Alert.alert('Error', (error.response.data && (error.response.data as any).message) || 'Something went wrong!');
    } else if (error.request) {
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else {
      Alert.alert('Error', error.message);
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
    console.log('---********** ---', response);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const processPayment = async (amount: number | string): Promise<any> => {
  try {
    const response: AxiosResponse = await apiClient.post(`/initiate`);
    console.log('---********** ---payment process-------------', response);
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  getInvestmentsByUser,
  processPayment
};
