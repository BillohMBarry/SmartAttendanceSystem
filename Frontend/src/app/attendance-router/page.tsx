/**
 * @fileoverview Attendance Router Page
 * Intelligently routes users to check-in or check-out based on their current attendance status.
 * This page is accessed when scanning a QR code.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { attendanceService } from '@/services/attendance.service';
import { LoadingState } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

/**
 * Attendance Router Component
 * Checks user authentication and attendance status, then redirects appropriately
 */
function AttendanceRouterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const qrToken = searchParams.get('qr_token');
    const toast = useToast();
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'not-authenticated'>('loading');

    useEffect(() => {
        if (!qrToken) {
            toast.error('No QR token provided');
            router.push('/');
            return;
        }

        const checkAuthAndRoute = async () => {
            try {
                // Check if user is authenticated by calling attendance status endpoint
                const statusResponse = await attendanceService.getAttendanceStatus();

                setStatus('authenticated');

                // Based on attendance status, redirect to appropriate page
                const attendanceStatus = statusResponse.status;

                if (attendanceStatus === 'not-checked-in' || attendanceStatus === 'checked-out') {
                    // User hasn't checked in today, redirect to check-in
                    router.push(`/check-in?qr_token=${encodeURIComponent(qrToken)}`);
                } else if (attendanceStatus === 'checked-in') {
                    // User has already checked in, redirect to check-out
                    router.push(`/check-out?qr_token=${encodeURIComponent(qrToken)}`);
                } else {
                    // Unknown status, default to check-in
                    router.push(`/check-in?qr_token=${encodeURIComponent(qrToken)}`);
                }
            } catch (error: any) {
                // User is not authenticated or error occurred
                if (error?.response?.status === 401 || error?.message?.includes('401')) {
                    setStatus('not-authenticated');
                    // Redirect to login with return URL
                    const returnUrl = encodeURIComponent(`/attendance-router?qr_token=${encodeURIComponent(qrToken)}`);
                    router.push(`/login?redirect=${returnUrl}`);
                } else {
                    // Other error
                    toast.error('Failed to check attendance status');
                    router.push('/');
                }
            }
        };

        checkAuthAndRoute();
    }, [qrToken, router, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingState
                message={
                    status === 'loading'
                        ? 'Checking your attendance status...'
                        : status === 'authenticated'
                            ? 'Redirecting you to the correct page...'
                            : 'Redirecting to login...'
                }
            />
        </div>
    );
}

export default function AttendanceRouterPage() {
    return <AttendanceRouterContent />;
}
