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
    AttendanceStatusResponse,
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
        /**
         * IMPORTANT:
         * The backend `/attendance/check-in` endpoint currently expects JSON
         * (parsed by Express) and runs Zod validation on `req.body`.
         *
         * When we always send `multipart/form-data` (even without a photo),
         * `req.body` ends up empty because no Multer middleware is attached,
         * causing "Validation failed" errors in production.
         *
         * Strategy:
         * - If NO photo is provided → send a normal JSON payload.
         * - If a photo IS provided  → send multipart/form-data so the backend
         *   can later be wired up with Multer for file handling.
         */

        // Case 1: No photo → simple JSON body (works with current backend)
        if (!data.photo) {
            const response = await apiClient.post<ApiResponse<CheckInResponse>>(
                '/attendance/check-in',
                {
                    lat: data.lat,
                    lng: data.lng,
                    accuracy: data.accuracy,
                    qrToken: data.qrToken,
                    stationId: data.stationId,
                    comment: data.comment,
                }
            );

            return unwrapResponse(response);
        }

        // Case 2: Photo present → multipart/form-data for future file support
        const formData = createFormData({
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            qrToken: data.qrToken,
            stationId: data.stationId,
            comment: data.comment,
        });

        formData.append('photo', data.photo);

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

    /**
     * Get current attendance status for today
     * Used by smart QR scan to determine whether to show check-in or check-out
     * @returns Current status and today's records
     */
    async getAttendanceStatus(): Promise<AttendanceStatusResponse> {
        const response = await apiClient.get<ApiResponse<AttendanceStatusResponse>>('/attendance/status');
        return unwrapResponse(response);
    },
};
