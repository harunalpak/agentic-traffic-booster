import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URLs
const PRODUCT_API_URL = process.env.NEXT_PUBLIC_PRODUCT_API || 'http://localhost:8080/api';
const CAMPAIGN_API_URL = process.env.NEXT_PUBLIC_CAMPAIGN_API || 'http://localhost:8082/api';

// Helper to create axios instance with interceptors
const createApiClient = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - attach JWT token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export separate clients for each microservice
export const apiProducts = createApiClient(PRODUCT_API_URL);
export const apiCampaigns = createApiClient(CAMPAIGN_API_URL);

// Default export for backward compatibility
export default apiProducts;

