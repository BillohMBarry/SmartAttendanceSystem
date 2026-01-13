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

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true, // GPS for higher accuracy
                        timeout: 30000, // 30 second timeout
                        maximumAge: 0, // Don't use cached position
                    }
                );
            });

            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            let errorMessage = 'Failed to get location';

            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                }
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
