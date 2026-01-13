/**
 * @fileoverview QR token validation service.
 * Handles QR token validation API calls.
 */

import apiClient, { unwrapResponse } from '@/lib/api-client';
import type {
    ValidateQRTokenRequest,
    ValidateQRTokenResponse,
    ApiResponse,
} from '@/types';

/**
 * QR Service
 * Provides methods for QR token validation
 */
export const qrService = {
    /**
     * Validate a QR token
     * @param token - The QR token string to validate
     * @returns Validation result with decoded token data
     */
    async validateToken(token: string): Promise<ValidateQRTokenResponse> {
        const response = await apiClient.post<ApiResponse<ValidateQRTokenResponse>>(
            '/qr/validate',
            { token } as ValidateQRTokenRequest
        );
        return unwrapResponse(response);
    },
};
