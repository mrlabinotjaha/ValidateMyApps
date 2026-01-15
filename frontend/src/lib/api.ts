import axios from 'axios';
import { mockApi } from './mockApi';

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true';

// In production, use relative URL if VITE_API_URL is not set (same domain)
// This works when frontend is served from the same backend
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const api = USE_MOCK_DATA ? mockApi : (() => {
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  // Handle auth errors with token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: any) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried refreshing yet
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token by calling the refresh endpoint directly
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          });
          const tokens = refreshResponse.data;
          localStorage.setItem('access_token', tokens.access_token);
          processQueue(null, tokens.access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          }
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear token and redirect to login
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          isRefreshing = false;
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // For other errors or if refresh already attempted, reject normally
      return Promise.reject(error);
    }
  );

  return axiosInstance;
})();
