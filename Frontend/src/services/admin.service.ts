/**
 * @fileoverview Admin service for user management, reports, and QR tokens.
 * Handles all admin-related API calls.
 */

import apiClient, { unwrapResponse } from '@/lib/api-client';
import type {
    User,
    RegisterRequest,
    QRToken,
    GenerateQRTokenRequest,
    DailyReport,
    ApiResponse,
} from '@/types';

/**
 * Admin Service
 * Provides methods for admin operations including user management and reports
 */
export const adminService = {
    /**
     * List all users in the system
     * @returns List of all users
     */
    async listUsers(): Promise<User[]> {
        const response = await apiClient.get<ApiResponse<User[]>>('/admin/users');
        return unwrapResponse(response);
    },

    /**
     * Create a new user
     * @param data - User registration data
     * @returns Created user data
     */
    async createUser(data: RegisterRequest): Promise<User> {
        const response = await apiClient.post<ApiResponse<User>>('/admin/users', data);
        return unwrapResponse(response);
    },

    /**
     * Generate a QR token for attendance check-in
     * @param data - QR token generation request
     * @returns Generated QR token data
     */
    async generateQRToken(data: GenerateQRTokenRequest): Promise<QRToken> {
        const response = await apiClient.post<ApiResponse<QRToken>>('/admin/qr-token', data);
        return unwrapResponse(response);
    },

    /**
     * List existing QR tokens
     * Note: Backend uses stateless tokens, so this may return limited data
     */
    async listQRTokens(): Promise<{ message: string }> {
        const response = await apiClient.get<ApiResponse<{ message: string }>>('/admin/qr-tokens');
        return unwrapResponse(response);
    },

    /**
     * Get daily attendance report
     * @param date - Date string in YYYY-MM-DD format
     * @returns Daily report with summary and records
     */
    async getDailyReport(date: string): Promise<DailyReport> {
        const response = await apiClient.get<ApiResponse<DailyReport>>(
            `/admin/attendance/daily?date=${encodeURIComponent(date)}`
        );
        return unwrapResponse(response);
    },

    /**
     * Export attendance data as CSV
     * @returns CSV file as Blob
     */
    async exportCSV(): Promise<Blob> {
        const response = await apiClient.get('/admin/export-csv', {
            responseType: 'blob',
        });
        return response.data;
    },
};
