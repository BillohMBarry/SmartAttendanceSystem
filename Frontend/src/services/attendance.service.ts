/**
 * @fileoverview Attendance service for check-in, check-out, and history operations.
 * Handles all attendance-related API calls including file uploads.
 */

import apiClient, { unwrapResponse, createFormData } from '@/lib/api-client';
import type {
    CheckInRequest,
    CheckInResponse,
    CheckOutRequest,
    CheckOutResponse,
    Attendance,
    ApiResponse,
} from '@/types';

/**
 * Attendance Service
 * Provides methods for attendance check-in/out and history
 */
export const attendanceService = {
    /**
     * Perform attendance check-in with location, photo, and optional QR code
     * @param data - Check-in data including location and optional photo
     * @returns Check-in verification result
     */
    async checkIn(data: CheckInRequest): Promise<CheckInResponse> {
        // Create FormData for multipart upload (if photo is included)
        const formData = createFormData({
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            qrToken: data.qrToken,
            comment: data.comment,
        });

        // Append photo file if provided
        if (data.photo) {
            formData.append('photo', data.photo);
        }

        const response = await apiClient.post<ApiResponse<CheckInResponse>>(
            '/attendance/check-in',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return unwrapResponse(response);
    },

    /**
     * Perform attendance check-out
     * @param data - Check-out data including location
     * @returns Check-out result with early leave flag
     */
    async checkOut(data: CheckOutRequest): Promise<CheckOutResponse> {
        const response = await apiClient.post<ApiResponse<CheckOutResponse>>(
            '/attendance/check-out',
            data
        );
        return unwrapResponse(response);
    },

    /**
     * Get attendance history for the current user
     * @returns List of attendance records sorted by timestamp descending
     */
    async getHistory(): Promise<Attendance[]> {
        const response = await apiClient.get<ApiResponse<Attendance[]>>('/attendance/me/history');
        return unwrapResponse(response);
    },
};
