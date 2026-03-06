import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging in development
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`API ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      (error.response?.data as { error?: string })?.error ??
      'An unexpected error occurred';
    console.error('API error:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
