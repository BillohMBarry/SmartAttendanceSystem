/**
 * @fileoverview Face recognition service for face registration and verification.
 * Handles all face recognition-related API calls.
 */

import apiClient, { unwrapResponse } from '@/lib/api-client';
import type {
    FaceRegistrationResponse,
    FaceVerificationResponse,
    FaceStatus,
    ApiResponse,
} from '@/types';

/**
 * Face Recognition Service
 * Provides methods for face registration, verification, and status
 */
export const faceService = {
    /**
     * Register user's face for facial recognition
     * @param imageFile - Face image file (from camera capture)
     * @returns Face registration result with faceId and confidence
     */
    async registerFace(imageFile: File | Blob): Promise<FaceRegistrationResponse> {
        const formData = new FormData();
        formData.append('face', imageFile);

        const response = await apiClient.post<ApiResponse<FaceRegistrationResponse>>(
            '/face/register',
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
     * Verify user's face (for testing purposes)
     * @param imageFile - Face image file to verify
     * @returns Verification result with match status and similarity score
     */
    async verifyFace(imageFile: File | Blob): Promise<FaceVerificationResponse> {
        const formData = new FormData();
        formData.append('face', imageFile);

        const response = await apiClient.post<ApiResponse<FaceVerificationResponse>>(
            '/face/verify',
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
     * Get face registration status for current user
     * @returns Face status including registration state and Rekognition availability
     */
    async getStatus(): Promise<FaceStatus> {
        const response = await apiClient.get<ApiResponse<FaceStatus>>('/face/status');
        return unwrapResponse(response);
    },

    /**
     * Delete user's registered face
     */
    async deleteFace(): Promise<void> {
        await apiClient.delete('/face');
    },
};
