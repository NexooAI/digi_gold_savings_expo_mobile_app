// services/api.ts
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";

const checkTokenValidity = async () => {
  try {
    // const token = await AsyncStorage.getItem("userToken");
    const token = await SecureStore.getItem("authToken");
    // Alert.alert("Token", token);
    return token;
    // if (!token) return;

    // Token decoding and checking can be added here if necessary.
    // In any case, proceed with login flow.
  } catch (error) {
    console.error("Error checking token:", error);
  }
};
// Create an Axios instance with a base URL and default config
const api = axios.create({
  baseURL: theme.baseUrl, // Replace with your API's base URL
  timeout: 10000, // Optional: set a timeout for requests (in milliseconds)
});

const handleLogout = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken"); // Remove stored token
    await AsyncStorage.removeItem("userData"); // Remove user data
    // Redirect to login page
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

// Request interceptor to add headers (e.g., Authorization)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // For example, get a token from AsyncStorage or state management
    const token = await checkTokenValidity(); // Replace with your token retrieval logic
    if (token) {
      // Ensure headers exist
      config.headers = config.headers || new axios.AxiosHeaders();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Handle the request error here
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses or errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Process the response if needed (e.g., logging)
    return response;
  },
  async (error: AxiosError) => {
    // Handle errors (e.g., token expiration, unauthorized access)
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access - perhaps redirect to login?');
      await handleLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
