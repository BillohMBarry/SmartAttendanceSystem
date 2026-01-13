/**
 * @fileoverview Dashboard home page.
 * Shows attendance summary, quick actions, and recent activity.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { attendanceService } from '@/services/attendance.service';
import { faceService } from '@/services/face.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, getAttendanceBadgeVariant, getAttendanceBadgeText } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import {
    LogIn,
    LogOut,
    History,
    Camera,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { Attendance, FaceStatus } from '@/types';

/**
 * Dashboard Page Component
 * Main dashboard with attendance summary and quick actions
 */
export default function DashboardPage() {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [faceStatus, setFaceStatus] = useState<FaceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetch attendance history and face status on mount
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyData, faceData] = await Promise.all([
                    attendanceService.getHistory(),
                    faceService.getStatus(),
                ]);
                setAttendance(historyData);
                setFaceStatus(faceData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    /**
     * Get today's check-in and check-out records
     */
    const todayRecords = attendance.filter((record) =>
        isToday(new Date(record.timestamp))
    );
    const todayCheckIn = todayRecords.find((r) => r.type === 'check-in');
    const todayCheckOut = todayRecords.find((r) => r.type === 'check-out');

    if (isLoading) {
        return <LoadingState message="Loading dashboard..." />;
    }

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-500 mt-1">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
            </div>

            {/* Face registration alert */}
            {faceStatus && !faceStatus.faceRegistered && (
                <Card variant="bordered" className="border-warning-300 bg-warning-50">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-warning-600" />
                            <div>
                                <p className="font-medium text-warning-800">Face Not Registered</p>
                                <p className="text-sm text-warning-600">
                                    Register your face for secure attendance verification
                                </p>
                            </div>
                        </div>
                        <Link href="/face-registration">
                            <Button variant="outline" size="sm" leftIcon={<Camera className="h-4 w-4" />}>
                                Setup Now
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Today's status cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-in status */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today&apos;s Check-in</p>
                                {todayCheckIn ? (
                                    <>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {format(new Date(todayCheckIn.timestamp), 'h:mm a')}
                                        </p>
                                        <StatusBadge
                                            variant={getAttendanceBadgeVariant(
                                                todayCheckIn.verified,
                                                todayCheckIn.isLate,
                                                false,
                                                todayCheckIn.isSuspicious
                                            )}
                                            showDot
                                            className="mt-2"
                                        >
                                            {getAttendanceBadgeText(
                                                todayCheckIn.verified,
                                                todayCheckIn.isLate,
                                                false,
                                                todayCheckIn.isSuspicious
                                            )}
                                        </StatusBadge>
                                    </>
                                ) : (
                                    <p className="text-lg text-gray-400 mt-1">Not checked in yet</p>
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-full ${todayCheckIn ? 'bg-success-100' : 'bg-gray-100'
                                    }`}
                            >
                                {todayCheckIn ? (
                                    <CheckCircle className="h-6 w-6 text-success-600" />
                                ) : (
                                    <Clock className="h-6 w-6 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Check-out status */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today&apos;s Check-out</p>
                                {todayCheckOut ? (
                                    <>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {format(new Date(todayCheckOut.timestamp), 'h:mm a')}
                                        </p>
                                        <StatusBadge
                                            variant={todayCheckOut.isEarlyLeave ? 'early' : 'success'}
                                            showDot
                                            className="mt-2"
                                        >
                                            {todayCheckOut.isEarlyLeave ? 'Early Leave' : 'On Time'}
                                        </StatusBadge>
                                    </>
                                ) : (
                                    <p className="text-lg text-gray-400 mt-1">Not checked out yet</p>
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-full ${todayCheckOut ? 'bg-primary-100' : 'bg-gray-100'
                                    }`}
                            >
                                {todayCheckOut ? (
                                    <CheckCircle className="h-6 w-6 text-primary-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <Card>
                <CardHeader title="Quick Actions" />
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Link href="/check-in" className="block">
                            <Button
                                variant="primary"
                                fullWidth
                                leftIcon={<LogIn className="h-5 w-5" />}
                                disabled={!!todayCheckIn}
                            >
                                Check In
                            </Button>
                        </Link>
                        <Link href="/check-out" className="block">
                            <Button
                                variant="secondary"
                                fullWidth
                                leftIcon={<LogOut className="h-5 w-5" />}
                                disabled={!todayCheckIn || !!todayCheckOut}
                            >
                                Check Out
                            </Button>
                        </Link>
                        <Link href="/history" className="block">
                            <Button
                                variant="outline"
                                fullWidth
                                leftIcon={<History className="h-5 w-5" />}
                            >
                                History
                            </Button>
                        </Link>
                        <Link href="/face-registration" className="block">
                            <Button
                                variant="ghost"
                                fullWidth
                                leftIcon={<Camera className="h-5 w-5" />}
                            >
                                Face Setup
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
                <CardHeader
                    title="Recent Activity"
                    action={
                        <Link href="/history" className="text-sm text-primary-600 hover:underline">
                            View All
                        </Link>
                    }
                />
                <CardContent>
                    {attendance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No attendance records yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {attendance.slice(0, 5).map((record) => (
                                <div
                                    key={record._id}
                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`p-2 rounded-full ${record.type === 'check-in'
                                                    ? 'bg-success-100'
                                                    : 'bg-primary-100'
                                                }`}
                                        >
                                            {record.type === 'check-in' ? (
                                                <LogIn className="h-4 w-4 text-success-600" />
                                            ) : (
                                                <LogOut className="h-4 w-4 text-primary-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {record.type.replace('-', ' ')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(record.timestamp), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge
                                        variant={getAttendanceBadgeVariant(
                                            record.verified,
                                            record.isLate,
                                            record.isEarlyLeave,
                                            record.isSuspicious
                                        )}
                                    >
                                        {getAttendanceBadgeText(
                                            record.verified,
                                            record.isLate,
                                            record.isEarlyLeave,
                                            record.isSuspicious
                                        )}
                                    </StatusBadge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
