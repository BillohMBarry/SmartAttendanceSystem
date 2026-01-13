/**
 * @fileoverview Admin reports page.
 * View daily attendance reports with date picker and export.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, getAttendanceBadgeVariant, getAttendanceBadgeText } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import {
    Calendar,
    Download,
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    LogIn,
    LogOut,
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import type { DailyReport, Attendance, User } from '@/types';

/**
 * Admin Reports Page Component
 * View daily attendance reports
 */
export default function AdminReportsPage() {
    const { success, error: toastError } = useToast();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [report, setReport] = useState<DailyReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Fetch report for selected date
     */
    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const data = await adminService.getDailyReport(selectedDate);
                setReport(data);
            } catch (error) {
                console.error('Failed to fetch report:', error);
                toastError('Failed to load report');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [selectedDate, toastError]);

    /**
     * Handle date navigation
     */
    const navigateDate = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    /**
     * Handle CSV export
     */
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await adminService.exportCSV();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance-report-${selectedDate}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            success('Report exported successfully');
        } catch (error) {
            toastError('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Get user name from attendance record
     */
    const getUserName = (userId: string | User): string => {
        if (typeof userId === 'string') return userId;
        return userId.name || 'Unknown';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
                    <p className="text-gray-500 mt-1">
                        View attendance reports by date
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={handleExport}
                    isLoading={isExporting}
                    leftIcon={<Download className="h-5 w-5" />}
                >
                    Export CSV
                </Button>
            </div>

            {/* Date picker */}
            <Card>
                <CardContent className="flex items-center justify-between py-4">
                    <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        ← Previous
                    </button>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <button
                        onClick={() => navigateDate('next')}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={selectedDate >= format(new Date(), 'yyyy-MM-dd')}
                    >
                        Next →
                    </button>
                </CardContent>
            </Card>

            {isLoading ? (
                <LoadingState message="Loading report..." />
            ) : report ? (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card variant="elevated">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 rounded-lg">
                                        <Users className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.summary.totalRecords}
                                        </p>
                                        <p className="text-xs text-gray-500">Total Records</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-success-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-success-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.summary.totalCheckIns}
                                        </p>
                                        <p className="text-xs text-gray-500">Check-ins</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-warning-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-warning-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.summary.lateCheckIns}
                                        </p>
                                        <p className="text-xs text-gray-500">Late</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.summary.earlyCheckOuts}
                                        </p>
                                        <p className="text-xs text-gray-500">Early Leave</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Records table */}
                    <Card>
                        <CardHeader title="Attendance Records" />
                        <CardContent className="p-0">
                            {report.records.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No records for this date</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Employee
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Type
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Time
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                                    Verified
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {report.records.map((record) => (
                                                <tr key={record._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-gray-900">
                                                            {getUserName(record.userId)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
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
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {format(new Date(record.timestamp), 'h:mm:ss a')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge
                                                            variant={getAttendanceBadgeVariant(
                                                                record.verified,
                                                                record.isLate,
                                                                record.isEarlyLeave,
                                                                record.isSuspicious
                                                            )}
                                                            size="sm"
                                                        >
                                                            {getAttendanceBadgeText(
                                                                record.verified,
                                                                record.isLate,
                                                                record.isEarlyLeave,
                                                                record.isSuspicious
                                                            )}
                                                        </StatusBadge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {record.verified ? (
                                                            <CheckCircle className="h-5 w-5 text-success-500" />
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
