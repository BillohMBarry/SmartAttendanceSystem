/**
 * @fileoverview Smart QR Code Scan Page
 * Dynamic route that identifies the scanning station and determines
 * whether to show Check-In or Check-Out button based on user's status.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { attendanceService } from '@/services/attendance.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
    QrCode,
    LogIn,
    LogOut,
    CheckCircle,
    AlertTriangle,
    MapPin,
} from 'lucide-react';
import type { AttendanceStatusResponse } from '@/types';

/**
 * Smart QR Scan Page Component
 * Scans station, checks user status, and shows appropriate action
 */
export default function ScanPage({ params }: { params: { stationId: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [status, setStatus] = useState<AttendanceStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stationId = params.stationId;

    /**
     * Fetch attendance status on mount
     */
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setIsLoading(true);
                const statusData = await attendanceService.getAttendanceStatus();
                setStatus(statusData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [toast]);

    /**
     * Handle check-in action
     */
    const handleCheckIn = () => {
        router.push(`/check-in?stationId=${encodeURIComponent(stationId)}`);
    };

    /**
     * Handle check-out action
     */
    const handleCheckOut = () => {
        router.push(`/check-out?stationId=${encodeURIComponent(stationId)}`);
    };

    if (isLoading) {
        return <LoadingState message="Checking your status..." />;
    }

    if (error || !status) {
        return (
            <div className="max-w-lg mx-auto">
                <Card variant="elevated">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-danger-100">
                            <AlertTriangle className="h-8 w-8 text-danger-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Error Loading Status
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {error || 'Unable to determine your attendance status'}
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
        <div className="max-w-lg mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">QR Code Scanned</h1>
                <p className="text-gray-500 mt-1">
                    Station identified. Choose your action below.
                </p>
            </div>

            {/* Station Info */}
            <Card variant="bordered" className="border-primary-300 bg-primary-50">
                <CardContent className="flex items-center gap-3 py-4">
                    <div className="p-2 bg-primary-100 rounded-full">
                        <MapPin className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                        <p className="font-medium text-primary-900">Station ID</p>
                        <p className="text-sm text-primary-700 capitalize">
                            {stationId.replace(/-/g, ' ')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Status & Action Card */}
            <Card variant="elevated">
                <CardHeader
                    title="Attendance Status"
                    subtitle="Based on today's records"
                />
                <CardContent className="space-y-6">
                    {/* Current Status Display */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${status.status === 'not-checked-in'
                                ? 'bg-gray-100'
                                : status.status === 'checked-in'
                                    ? 'bg-success-100'
                                    : 'bg-primary-100'
                                }`}>
                                {status.status === 'not-checked-in' ? (
                                    <QrCode className="h-6 w-6 text-gray-400" />
                                ) : status.status === 'checked-in' ? (
                                    <LogIn className="h-6 w-6 text-success-600" />
                                ) : (
                                    <LogOut className="h-6 w-6 text-primary-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {status.status === 'not-checked-in'
                                        ? 'Not Checked In Yet'
                                        : status.status === 'checked-in'
                                            ? 'Currently Checked In'
                                            : 'Already Checked Out'
                                    }
                                </p>
                                {status.lastCheckIn && (
                                    <p className="text-sm text-gray-500">
                                        Last check-in: {new Date(status.lastCheckIn.timestamp).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <StatusBadge
                            variant={
                                status.status === 'not-checked-in'
                                    ? 'neutral'
                                    : status.status === 'checked-in'
                                        ? 'success'
                                        : 'info'
                            }
                        >
                            {status.status === 'not-checked-in'
                                ? 'Pending'
                                : status.status === 'checked-in'
                                    ? 'Active'
                                    : 'Complete'
                            }
                        </StatusBadge>
                    </div>

                    {/* Action Buttons */}
                    {status.status === 'not-checked-in' && (
                        <>
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-success-100">
                                    <LogIn className="h-8 w-8 text-success-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Ready to Check In
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    You haven't checked in today. Tap below to start your attendance.
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleCheckIn}
                                leftIcon={<LogIn className="h-5 w-5" />}
                            >
                                Proceed to Check-In
                            </Button>
                        </>
                    )}

                    {status.status === 'checked-in' && (
                        <>
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-primary-100">
                                    <LogOut className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Ready to Check Out
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    You're currently checked in. Tap below to complete your attendance.
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleCheckOut}
                                leftIcon={<LogOut className="h-5 w-5" />}
                            >
                                Proceed to Check-Out
                            </Button>
                        </>
                    )}

                    {status.status === 'checked-out' && (
                        <>
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-success-100">
                                    <CheckCircle className="h-8 w-8 text-success-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    All Done for Today!
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    You've already checked in and out today. See you tomorrow!
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="lg"
                                fullWidth
                                onClick={() => router.push('/')}
                            >
                                Back to Dashboard
                            </Button>
                        </>
                    )}

                    {/* Show today's summary */}
                    {status.todayRecords.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Today's Activity
                            </p>
                            <div className="space-y-2">
                                {status.todayRecords.map((record) => (
                                    <div
                                        key={record._id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            {record.type === 'check-in' ? (
                                                <LogIn className="h-4 w-4 text-success-600" />
                                            ) : (
                                                <LogOut className="h-4 w-4 text-primary-600" />
                                            )}
                                            <span className="capitalize text-gray-700">
                                                {record.type.replace('-', ' ')}
                                            </span>
                                        </div>
                                        <span className="text-gray-500">
                                            {new Date(record.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
