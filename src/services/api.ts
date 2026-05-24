import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';

const api = axios.create({
  baseURL: new URL('/api', BASE_URL).toString(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  transformRequest: [
    (data: unknown, headers: Record<string, string> | undefined) => {
      if (data && typeof data === 'object' && headers?.['Content-Type']?.includes('application/json')) {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('auth_token');
    }
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const setToken = async (token: string | null) => {
  try {
    if (Platform.OS === 'web') {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    } else {
      if (token) await AsyncStorage.setItem('auth_token', token);
      else await AsyncStorage.removeItem('auth_token');
    }
  } catch {
    // silently fail
  }
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      setToken(null);
      logoutCallback?.();
    }
    return Promise.reject(error);
  },
);

export default api;
