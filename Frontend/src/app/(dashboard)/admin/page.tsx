/**
 * @fileoverview Admin dashboard home page.
 * Shows statistics and quick links to admin functions.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Spinner';
import {
    Users,
    QrCode,
    FileText,
    Calendar,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { DailyReportSummary, User } from '@/types';

/**
 * Admin Dashboard Page Component
 * Overview of system statistics and quick actions
 */
export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [todayStats, setTodayStats] = useState<DailyReportSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetch dashboard data on mount
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch users and today's report in parallel
                const [usersData, reportData] = await Promise.all([
                    adminService.listUsers(),
                    adminService.getDailyReport(format(new Date(), 'yyyy-MM-dd')),
                ]);

                setUsers(usersData);
                setTodayStats(reportData.summary);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <LoadingState message="Loading admin dashboard..." />;
    }

    // Calculate user statistics
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const employeeCount = users.filter((u) => u.role === 'employee').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Overview and management tools
                </p>
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {adminCount} admins, {employeeCount} employees
                                </p>
                            </div>
                            <div className="p-3 bg-primary-100 rounded-full">
                                <Users className="h-6 w-6 text-primary-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Check-ins */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today&apos;s Check-ins</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {todayStats?.totalCheckIns || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Out of {employeeCount} employees
                                </p>
                            </div>
                            <div className="p-3 bg-success-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-success-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Late Check-ins */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Late Check-ins</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {todayStats?.lateCheckIns || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">After 10:00 AM</p>
                            </div>
                            <div className="p-3 bg-warning-100 rounded-full">
                                <Clock className="h-6 w-6 text-warning-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Early Check-outs */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Early Check-outs</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {todayStats?.earlyCheckOuts || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Before 5:00 PM</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <Card>
                <CardHeader title="Quick Actions" subtitle="Common administrative tasks" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/admin/users" className="block">
                            <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                                <Users className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Manage Users</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Add, edit, or view user accounts
                                </p>
                            </div>
                        </Link>

                        <Link href="/admin/qr-tokens" className="block">
                            <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                                <QrCode className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-3" />
                                <h3 className="font-medium text-gray-900">QR Tokens</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Generate check-in QR codes
                                </p>
                            </div>
                        </Link>

                        <Link href="/admin/reports" className="block">
                            <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                                <FileText className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Reports</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    View daily attendance reports
                                </p>
                            </div>
                        </Link>

                        <Link href="/admin/meetings" className="block">
                            <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                                <Calendar className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Meetings</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Schedule and manage meetings
                                </p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance rate card */}
            <Card>
                <CardHeader title="Today's Summary" />
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${employeeCount > 0
                                                ? ((todayStats?.totalCheckIns || 0) / employeeCount) * 100
                                                : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-success-600" />
                            <span className="font-semibold text-gray-900">
                                {employeeCount > 0
                                    ? Math.round(((todayStats?.totalCheckIns || 0) / employeeCount) * 100)
                                    : 0}
                                %
                            </span>
                            <span className="text-gray-500">attendance rate</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
