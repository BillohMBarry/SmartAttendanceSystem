/**
 * @fileoverview Axios API client with preconfigured base URL and interceptors.
 * Handles JWT token injection, response unwrapping, and error handling.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './auth';
import type { ApiResponse, ApiError } from '@/types';

/**
 * Base URL for API requests - configurable via environment variable
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Create configured Axios instance with base URL
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor - Inject JWT token into Authorization header
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - Handle response unwrapping and errors
 */
apiClient.interceptors.response.use(
    (response) => {
        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ API Response: ${response.config.url}`, response.data);
        }

        // Return the response data directly (unwrap Axios response)
        return response;
    },
    (error: AxiosError<ApiError>) => {
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ API Error:', error.response?.data || error.message);
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            removeToken();

            // Redirect to login if not already there (client-side only)
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Extract error message from response or use default
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

        return Promise.reject(new Error(errorMessage));
    }
);

/**
 * Helper function to extract data from API response
 * @param response - Axios response with ApiResponse wrapper
 * @returns The unwrapped data
 */
export function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
    return response.data.data;
}

/**
 * Helper function for multipart/form-data requests (file uploads)
 */
export function createFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
            } else {
                formData.append(key, String(value));
            }
        }
    });

    return formData;
}

export { API_BASE_URL };
export default apiClient;
