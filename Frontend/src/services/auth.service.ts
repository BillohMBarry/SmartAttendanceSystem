/**
 * @fileoverview Authentication service for login, register, and profile operations.
 * Handles all authentication-related API calls.
 */

import apiClient, { unwrapResponse } from '@/lib/api-client';
import type {
    LoginRequest,
    LoginResponse,
    EmployeeSignupRequest,
    RegisterRequest,
    UpdateProfileRequest,
    User,
    ApiResponse
} from '@/types';

/**
 * Authentication Service
 * Provides methods for user authentication and profile management
 */
export const authService = {
    /**
     * Login user with email and password
     * @param credentials - Login credentials
     * @returns Token and user data
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
        return unwrapResponse(response);
    },

    /**
     * Sign up a new employee (public endpoint)
     * @param data - Employee signup data
     * @returns Created user ID
     */
    async signup(data: EmployeeSignupRequest): Promise<{ userId: string }> {
        const response = await apiClient.post<ApiResponse<{ userId: string }>>('/auth/signup', data);
        return unwrapResponse(response);
    },

    /**
     * Register a new user (admin only)
     * @param data - Registration data
     * @returns Created user ID
     */
    async register(data: RegisterRequest): Promise<{ userId: string }> {
        const response = await apiClient.post<ApiResponse<{ userId: string }>>('/auth/register', data);
        return unwrapResponse(response);
    },

    /**
     * Update current user's profile
     * @param data - Profile update data
     * @returns Updated user data
     */
    async updateProfile(data: UpdateProfileRequest): Promise<User> {
        const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
        return unwrapResponse(response);
    },
};
