/**
 * @fileoverview Check-in page with GPS, camera, and QR code support.
 * Handles multi-factor attendance verification.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCamera } from '@/hooks/useCamera';
import { useToast } from '@/components/ui/Toast';
import { attendanceService } from '@/services/attendance.service';
import { faceService } from '@/services/face.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import {
    MapPin,
    Camera,
    QrCode,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import type { FaceStatus } from '@/types';

/**
 * Check-in Page Component
 * Multi-factor attendance check-in with GPS, camera, and QR
 */
export default function CheckInPage() {
    const router = useRouter();
    const toast = useToast();

    // Geolocation hook
    const {
        latitude,
        longitude,
        accuracy,
        isLoading: isGettingLocation,
        error: locationError,
        getCurrentPosition,
        hasLocation,
    } = useGeolocation();

    // Camera hook
    const {
        videoRef,
        canvasRef,
        isStreaming,
        isLoading: isCameraLoading,
        error: cameraError,
        photo,
        startCamera,
        stopCamera,
        capturePhoto,
        clearPhoto,
    } = useCamera();

    const [faceStatus, setFaceStatus] = useState<FaceStatus | null>(null);
    const [qrToken, setQrToken] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [submitResult, setSubmitResult] = useState<{
        success: boolean;
        verified: boolean;
        isLate: boolean;
        factors: Record<string, boolean>;
    } | null>(null);

    /**
     * Fetch face status on mount
     */
    useEffect(() => {
        const fetchFaceStatus = async () => {
            try {
                const status = await faceService.getStatus();
                setFaceStatus(status);
            } catch (error) {
                console.error('Failed to fetch face status:', error);
            } finally {
                setIsLoadingStatus(false);
            }
        };

        fetchFaceStatus();
    }, []);

    /**
     * Auto-get location on mount
     */
    useEffect(() => {
        getCurrentPosition();
    }, [getCurrentPosition]);

    /**
     * Start camera if face is registered
     */
    useEffect(() => {
        if (faceStatus?.faceRegistered && !isStreaming && !photo) {
            startCamera();
        }
    }, [faceStatus, isStreaming, photo, startCamera]);

    /**
     * Cleanup camera on unmount
     */
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    /**
     * Handle check-in submission
     */
    const handleSubmit = async () => {
        if (!hasLocation) {
            toast.error('Location is required for check-in');
            return;
        }

        // If face is registered but no photo captured
        if (faceStatus?.faceRegistered && !photo) {
            toast.error('Please capture a photo for face verification');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create a File from the photo blob if available
            let photoFile: File | undefined;
            if (photo) {
                photoFile = new File([photo], 'checkin-photo.jpg', { type: 'image/jpeg' });
            }

            const result = await attendanceService.checkIn({
                lat: latitude!,
                lng: longitude!,
                accuracy: accuracy!,
                qrToken: qrToken || undefined,
                comment: comment || undefined,
                photo: photoFile,
            });

            setSubmitResult({
                success: true,
                verified: result.verified,
                isLate: result.isLate,
                factors: result.factors as unknown as Record<string, boolean>,
            });

            if (result.verified) {
                toast.success('Check-in successful!', result.isLate ? 'Marked as late' : undefined);
            } else {
                toast.warning('Check-in recorded but not fully verified');
            }

            // Stop camera after successful check-in
            stopCamera();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Check-in failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle taking/retaking photo
     */
    const handleCapturePhoto = () => {
        if (photo) {
            clearPhoto();
            startCamera();
        } else {
            capturePhoto();
        }
    };

    if (isLoadingStatus) {
        return <LoadingState message="Preparing check-in..." />;
    }

    // Show result after successful check-in
    if (submitResult) {
        return (
            <div className="max-w-lg mx-auto">
                <Card variant="elevated">
                    <CardContent className="py-12 text-center">
                        <div
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${submitResult.verified ? 'bg-success-100' : 'bg-warning-100'
                                }`}
                        >
                            {submitResult.verified ? (
                                <CheckCircle className="h-8 w-8 text-success-600" />
                            ) : (
                                <AlertTriangle className="h-8 w-8 text-warning-600" />
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {submitResult.verified ? 'Check-in Verified!' : 'Check-in Recorded'}
                        </h2>

                        {submitResult.isLate && (
                            <StatusBadge variant="late" showDot className="mb-4">
                                Marked as Late
                            </StatusBadge>
                        )}

                        <p className="text-gray-500 mb-6">
                            {submitResult.verified
                                ? 'Your attendance has been successfully recorded and verified.'
                                : 'Your attendance was recorded but some verification factors failed.'}
                        </p>

                        {/* Verification factors */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Verification Factors:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(submitResult.factors).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        {value ? (
                                            <CheckCircle className="h-4 w-4 text-success-600" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="capitalize">{key.replace('Verified', '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button variant="primary" onClick={() => router.push('/')} fullWidth>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
                <p className="text-gray-500 mt-1">
                    Verify your location and identity to check in
                </p>
            </div>

            {/* Location section */}
            <Card>
                <CardHeader
                    title="Location"
                    subtitle="Your GPS location for verification"
                />
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-3 rounded-full ${hasLocation ? 'bg-success-100' : 'bg-gray-100'
                                    }`}
                            >
                                <MapPin
                                    className={`h-6 w-6 ${hasLocation ? 'text-success-600' : 'text-gray-400'
                                        }`}
                                />
                            </div>
                            <div>
                                {hasLocation ? (
                                    <>
                                        <p className="font-medium text-gray-900">Location Captured</p>
                                        <p className="text-sm text-gray-500">
                                            Accuracy: {accuracy?.toFixed(0)}m
                                        </p>
                                    </>
                                ) : locationError ? (
                                    <>
                                        <p className="font-medium text-danger-600">Location Error</p>
                                        <p className="text-sm text-danger-500">{locationError}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500">Getting location...</p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={getCurrentPosition}
                            isLoading={isGettingLocation}
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                        >
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Camera section (only if face is registered) */}
            {faceStatus?.faceRegistered && (
                <Card>
                    <CardHeader
                        title="Face Verification"
                        subtitle="Take a selfie for identity verification"
                    />
                    <CardContent>
                        {cameraError ? (
                            <div className="text-center py-8">
                                <AlertTriangle className="h-12 w-12 text-warning-500 mx-auto mb-3" />
                                <p className="text-gray-700 font-medium">Camera Error</p>
                                <p className="text-sm text-gray-500 mb-4">{cameraError}</p>
                                <Button variant="outline" onClick={startCamera}>
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Video preview / captured photo */}
                                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                    {photo ? (
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt="Captured photo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {/* Hidden canvas for capture */}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>

                                {/* Capture button */}
                                <Button
                                    variant={photo ? 'secondary' : 'primary'}
                                    fullWidth
                                    onClick={handleCapturePhoto}
                                    isLoading={isCameraLoading}
                                    leftIcon={<Camera className="h-5 w-5" />}
                                >
                                    {photo ? 'Retake Photo' : 'Capture Photo'}
                                </Button>

                                {photo && (
                                    <StatusBadge variant="success" showDot>
                                        Photo captured
                                    </StatusBadge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* QR Code section (optional) */}
            <Card>
                <CardHeader
                    title="QR Code (Optional)"
                    subtitle="Scan the office QR code for additional verification"
                />
                <CardContent>
                    <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6 text-gray-400" />
                        <Input
                            placeholder="Enter QR token or scan"
                            value={qrToken}
                            onChange={(e) => setQrToken(e.target.value)}
                            fullWidth
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Comment section */}
            <Card>
                <CardHeader
                    title="Comment (Optional)"
                    subtitle="Add any notes about your check-in"
                />
                <CardContent>
                    <textarea
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Submit button */}
            <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!hasLocation || (faceStatus?.faceRegistered && !photo)}
            >
                Submit Check-In
            </Button>
        </div>
    );
}
