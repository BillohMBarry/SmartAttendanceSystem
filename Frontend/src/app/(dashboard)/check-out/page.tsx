/**
 * @fileoverview Check-out page with location verification.
 * Simpler than check-in, focuses on location and optional comment.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/components/ui/Toast';
import { attendanceService } from '@/services/attendance.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MapPin, CheckCircle, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

/**
 * Check-out Page Component
 * Simple attendance check-out with location
 */
export default function CheckOutPage() {
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

    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{
        success: boolean;
        isEarlyLeave: boolean;
        timestamp: string;
    } | null>(null);

    /**
     * Auto-get location on mount
     */
    useEffect(() => {
        getCurrentPosition();
    }, [getCurrentPosition]);

    /**
     * Check if current time is before 5 PM (early leave warning)
     */
    const currentHour = new Date().getHours();
    const isEarlyTime = currentHour < 17;

    /**
     * Handle check-out submission
     */
    const handleSubmit = async () => {
        if (!hasLocation) {
            toast.error('Location is required for check-out');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await attendanceService.checkOut({
                lat: latitude!,
                lng: longitude!,
                accuracy: accuracy!,
                comment: comment || undefined,
            });

            setSubmitResult({
                success: true,
                isEarlyLeave: result.isEarlyLeave,
                timestamp: result.timestamp,
            });

            if (result.isEarlyLeave) {
                toast.warning('Check-out recorded. Marked as early leave.');
            } else {
                toast.success('Check-out successful!');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Check-out failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show result after successful check-out
    if (submitResult) {
        return (
            <div className="max-w-lg mx-auto">
                <Card variant="elevated">
                    <CardContent className="py-12 text-center">
                        <div
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${submitResult.isEarlyLeave ? 'bg-warning-100' : 'bg-success-100'
                                }`}
                        >
                            {submitResult.isEarlyLeave ? (
                                <Clock className="h-8 w-8 text-warning-600" />
                            ) : (
                                <CheckCircle className="h-8 w-8 text-success-600" />
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Check-out Recorded!
                        </h2>

                        {submitResult.isEarlyLeave && (
                            <StatusBadge variant="early" showDot className="mb-4">
                                Early Leave
                            </StatusBadge>
                        )}

                        <p className="text-gray-500 mb-6">
                            Your check-out has been recorded at{' '}
                            {new Date(submitResult.timestamp).toLocaleTimeString()}
                        </p>

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
                <h1 className="text-2xl font-bold text-gray-900">Check Out</h1>
                <p className="text-gray-500 mt-1">Record your departure for today</p>
            </div>

            {/* Early leave warning */}
            {isEarlyTime && (
                <Card variant="bordered" className="border-warning-300 bg-warning-50">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertTriangle className="h-5 w-5 text-warning-600" />
                        <p className="text-warning-700">
                            It&apos;s before 5:00 PM. This check-out will be marked as{' '}
                            <strong>early leave</strong>.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Location section */}
            <Card>
                <CardHeader
                    title="Location"
                    subtitle="Your GPS location for check-out"
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

            {/* Comment section */}
            <Card>
                <CardHeader
                    title="Comment (Optional)"
                    subtitle="Add any notes about your check-out"
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
                disabled={!hasLocation}
            >
                Submit Check-Out
            </Button>
        </div>
    );
}
