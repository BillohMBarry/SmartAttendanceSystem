/**
 * @fileoverview Face registration page for setting up facial recognition.
 * Allows users to capture and register their face for attendance verification.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { useToast } from '@/components/ui/Toast';
import { faceService } from '@/services/face.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { Camera, CheckCircle, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { FaceStatus } from '@/types';

/**
 * Face Registration Page Component
 * Register or update face for attendance verification
 */
export default function FaceRegistrationPage() {
    const router = useRouter();
    const toast = useToast();

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
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                setIsLoading(false);
            }
        };

        fetchFaceStatus();
    }, []);

    /**
     * Cleanup camera on unmount
     */
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    /**
     * Handle photo capture
     */
    const handleCapturePhoto = () => {
        if (photo) {
            clearPhoto();
            startCamera();
        } else {
            capturePhoto();
        }
    };

    /**
     * Handle face registration
     */
    const handleRegister = async () => {
        if (!photo) {
            toast.error('Please capture a photo first');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await faceService.registerFace(photo);

            setFaceStatus({
                faceRegistered: true,
                faceRegisteredAt: new Date().toISOString(),
                faceImageUrl: result.imageUrl,
                rekognitionAvailable: true,
            });

            toast.success('Face registered successfully!', `Confidence: ${result.confidence?.toFixed(1)}%`);
            stopCamera();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to register face');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle face deletion
     */
    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await faceService.deleteFace();

            setFaceStatus({
                faceRegistered: false,
                rekognitionAvailable: faceStatus?.rekognitionAvailable || false,
            });

            toast.success('Face registration deleted');
            setShowDeleteModal(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete face');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <LoadingState message="Loading face registration..." />;
    }

    // Check if service is available
    if (!faceStatus?.rekognitionAvailable) {
        return (
            <div className="max-w-lg mx-auto">
                <Card variant="bordered" className="border-warning-300 bg-warning-50">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-warning-600 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Service Unavailable
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Face recognition service is currently not available. Please contact your administrator.
                        </p>
                        <Button variant="secondary" onClick={() => router.push('/')}>
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
                <h1 className="text-2xl font-bold text-gray-900">Face Registration</h1>
                <p className="text-gray-500 mt-1">
                    {faceStatus?.faceRegistered
                        ? 'Your face is registered. You can update it below.'
                        : 'Register your face for secure attendance verification'}
                </p>
            </div>

            {/* Current status card */}
            {faceStatus?.faceRegistered && (
                <Card variant="elevated" className="border-l-4 border-success-500">
                    <CardContent className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-success-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Face Registered</p>
                                <p className="text-sm text-gray-500">
                                    Registered on{' '}
                                    {format(new Date(faceStatus.faceRegisteredAt!), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600 hover:bg-danger-50"
                            onClick={() => setShowDeleteModal(true)}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                            Remove
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Camera section */}
            <Card>
                <CardHeader
                    title={faceStatus?.faceRegistered ? 'Update Your Face' : 'Register Your Face'}
                    subtitle="Position your face in the center and ensure good lighting"
                />
                <CardContent>
                    {cameraError ? (
                        <div className="text-center py-12">
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
                                ) : isStreaming ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <Camera className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-400">Camera not started</p>
                                        </div>
                                    </div>
                                )}

                                {/* Hidden canvas for capture */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Face guide overlay */}
                                {isStreaming && !photo && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-64 border-2 border-white/50 rounded-full" />
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Tips for best results:
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Ensure your face is well-lit</li>
                                    <li>• Look directly at the camera</li>
                                    <li>• Remove sunglasses or hats</li>
                                    <li>• Keep a neutral expression</li>
                                </ul>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                {!isStreaming && !photo && (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={startCamera}
                                        isLoading={isCameraLoading}
                                        leftIcon={<Camera className="h-5 w-5" />}
                                    >
                                        Start Camera
                                    </Button>
                                )}

                                {isStreaming && !photo && (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={handleCapturePhoto}
                                        leftIcon={<Camera className="h-5 w-5" />}
                                    >
                                        Capture Photo
                                    </Button>
                                )}

                                {photo && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={handleCapturePhoto}
                                            leftIcon={<RefreshCw className="h-5 w-5" />}
                                        >
                                            Retake
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleRegister}
                                            isLoading={isSubmitting}
                                            leftIcon={<CheckCircle className="h-5 w-5" />}
                                        >
                                            {faceStatus?.faceRegistered ? 'Update Face' : 'Register Face'}
                                        </Button>
                                    </>
                                )}
                            </div>

                            {photo && (
                                <StatusBadge variant="success" showDot>
                                    Photo captured - Ready to register
                                </StatusBadge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Face Registration"
                message="Are you sure you want to remove your face registration? You will need to re-register your face to use face verification for check-in."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
