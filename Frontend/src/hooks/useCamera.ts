/**
 * @fileoverview Camera hook for capturing photos from webcam.
 * Used for face registration and verification during attendance check-in.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Camera state
 */
interface CameraState {
    /** Whether camera is currently streaming */
    isStreaming: boolean;
    /** Whether camera is being initialized */
    isLoading: boolean;
    /** Error message if camera access failed */
    error: string | null;
    /** Captured photo as Blob */
    photo: Blob | null;
}

/**
 * Camera hook return type
 */
interface UseCameraResult extends CameraState {
    /** Reference to attach to video element */
    videoRef: React.RefObject<HTMLVideoElement>;
    /** Reference to hidden canvas for capture */
    canvasRef: React.RefObject<HTMLCanvasElement>;
    /** Start camera stream */
    startCamera: () => Promise<void>;
    /** Stop camera stream */
    stopCamera: () => void;
    /** Capture current frame as photo */
    capturePhoto: () => Blob | null;
    /** Clear captured photo */
    clearPhoto: () => void;
}

/**
 * Hook for accessing webcam and capturing photos
 * Uses front-facing camera for selfie capture
 * 
 * @example
 * ```tsx
 * const { videoRef, canvasRef, isStreaming, startCamera, capturePhoto, photo } = useCamera();
 * 
 * // In JSX:
 * <video ref={videoRef} autoPlay playsInline />
 * <canvas ref={canvasRef} style={{ display: 'none' }} />
 * <button onClick={() => startCamera()}>Start Camera</button>
 * <button onClick={() => capturePhoto()}>Take Photo</button>
 * ```
 */
export function useCamera(): UseCameraResult {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [state, setState] = useState<CameraState>({
        isStreaming: false,
        isLoading: false,
        error: null,
        photo: null,
    });

    /**
     * Start camera stream
     */
    const startCamera = useCallback(async (): Promise<void> => {
        // Check for camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setState((prev) => ({
                ...prev,
                error: 'Camera is not supported by your browser',
            }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request camera access with front-facing preference
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera for selfies
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });

            streamRef.current = stream;

            // Attach stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setState({
                isStreaming: true,
                isLoading: false,
                error: null,
                photo: null,
            });
        } catch (error) {
            let errorMessage = 'Failed to access camera';

            if (error instanceof DOMException) {
                switch (error.name) {
                    case 'NotAllowedError':
                        errorMessage = 'Camera access denied. Please enable camera permissions.';
                        break;
                    case 'NotFoundError':
                        errorMessage = 'No camera found on this device.';
                        break;
                    case 'NotReadableError':
                        errorMessage = 'Camera is in use by another application.';
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

    /**
     * Stop camera stream and release resources
     */
    const stopCamera = useCallback((): void => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setState((prev) => ({
            ...prev,
            isStreaming: false,
        }));
    }, []);

    /**
     * Capture current video frame as a Blob
     * @returns Captured photo as Blob or null if capture failed
     */
    const capturePhoto = useCallback((): Blob | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !state.isStreaming) {
            return null;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);

        // Convert canvas to Blob
        let capturedPhoto: Blob | null = null;

        canvas.toBlob(
            (blob) => {
                capturedPhoto = blob;
                setState((prev) => ({ ...prev, photo: blob }));
            },
            'image/jpeg',
            0.9 // 90% quality
        );

        // Return synchronously if possible (for immediate use)
        // The async blob will update state
        return capturedPhoto;
    }, [state.isStreaming]);

    /**
     * Clear the captured photo
     */
    const clearPhoto = useCallback((): void => {
        setState((prev) => ({ ...prev, photo: null }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return {
        ...state,
        videoRef,
        canvasRef,
        startCamera,
        stopCamera,
        capturePhoto,
        clearPhoto,
    };
}
