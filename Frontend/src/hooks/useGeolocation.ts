/**
 * @fileoverview Geolocation hook for getting user's current GPS position.
 * Provides location data with high accuracy for attendance check-in verification.
 */

'use client';

import { useState, useCallback } from 'react';

/**
 * Geolocation state
 */
interface GeolocationState {
    /** Current latitude */
    latitude: number | null;
    /** Current longitude */
    longitude: number | null;
    /** GPS accuracy in meters */
    accuracy: number | null;
    /** Error message if location access failed */
    error: string | null;
    /** Whether location is being fetched */
    isLoading: boolean;
}

/**
 * Geolocation hook return type
 */
interface UseGeolocationResult extends GeolocationState {
    /** Get current position */
    getCurrentPosition: () => Promise<void>;
    /** Check if location is available */
    hasLocation: boolean;
}

/**
 * Hook for accessing user's geolocation
 * Uses high accuracy mode for attendance verification
 * 
 * @example
 * ```tsx
 * const { latitude, longitude, accuracy, isLoading, error, getCurrentPosition } = useGeolocation();
 * 
 * const handleCheckIn = async () => {
 *   await getCurrentPosition();
 *   if (latitude && longitude) {
 *     // Submit check-in with location
 *   }
 * };
 * ```
 */
export function useGeolocation(): UseGeolocationResult {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        isLoading: false,
    });

    /**
     * Get current GPS position with high accuracy
     */
    /**
     * Get current GPS position with fallback retry
     */
    const getCurrentPosition = useCallback(async (): Promise<void> => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: 'Geolocation is not supported by your browser',
                isLoading: false,
            }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Helper to get position with specific options
        const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        try {
            // Attempt 1: High Accuracy (GPS)
            // Timeout reduced to 10s to fail faster if GPS is weak
            const position = await getPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }).catch(async (err) => {
                // If permission denied, don't retry - just throw
                if (err.code === err.PERMISSION_DENIED) throw err;

                console.warn('High accuracy location failed, trying fallback...', err.message);

                // Attempt 2: Low Accuracy (Wi-Fi/Cellular) via IP or strict fallback
                // Longer timeout (20s) and older cached data allowed (30s)
                return await getPosition({
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 30000,
                });
            });

            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                isLoading: false,
            });
        } catch (error: any) {
            let errorMessage = 'Failed to get location';

            // Handle GeolocationPositionError
            if (error.code) {
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        errorMessage = 'Location information is unavailable. Check your GPS or network.';
                        break;
                    case 3: // TIMEOUT
                        errorMessage = 'Location request timed out. Please check signal or move to an open area.';
                        break;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, []);

    return {
        ...state,
        getCurrentPosition,
        hasLocation: state.latitude !== null && state.longitude !== null,
    };
}
