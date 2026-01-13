/**
 * @fileoverview Attendance history page.
 * Displays paginated list of attendance records with filtering.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { attendanceService } from '@/services/attendance.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge, getAttendanceBadgeVariant, getAttendanceBadgeText } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { LogIn, LogOut, MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import type { Attendance } from '@/types';

/**
 * History Page Component
 * Shows attendance history with details modal
 */
export default function HistoryPage() {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
    const [filter, setFilter] = useState<'all' | 'check-in' | 'check-out'>('all');

    /**
     * Fetch attendance history on mount
     */
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await attendanceService.getHistory();
                setAttendance(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    /**
     * Filter records based on selected filter
     */
    const filteredRecords = attendance.filter((record) => {
        if (filter === 'all') return true;
        return record.type === filter;
    });

    if (isLoading) {
        return <LoadingState message="Loading history..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
                    <p className="text-gray-500 mt-1">
                        View your past attendance records
                    </p>
                </div>

                {/* Filter buttons */}
                <div className="flex gap-2">
                    {(['all', 'check-in', 'check-out'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === type
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {type === 'all' ? 'All' : type === 'check-in' ? 'Check-ins' : 'Check-outs'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Records list */}
            <Card>
                <CardContent className="p-0">
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No attendance records found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredRecords.map((record) => (
                                <button
                                    key={record._id}
                                    onClick={() => setSelectedRecord(record)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`p-2.5 rounded-full ${record.type === 'check-in'
                                                    ? 'bg-success-100'
                                                    : 'bg-primary-100'
                                                }`}
                                        >
                                            {record.type === 'check-in' ? (
                                                <LogIn className="h-5 w-5 text-success-600" />
                                            ) : (
                                                <LogOut className="h-5 w-5 text-primary-600" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {record.type.replace('-', ' ')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(record.timestamp), 'EEEE, MMM d, yyyy • h:mm a')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status badges */}
                                    <div className="flex items-center gap-2">
                                        {record.isSuspicious && (
                                            <StatusBadge variant="suspicious" size="sm">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Suspicious
                                            </StatusBadge>
                                        )}
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
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details modal */}
            <Modal
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                title="Attendance Details"
                size="md"
            >
                {selectedRecord && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-full ${selectedRecord.type === 'check-in'
                                        ? 'bg-success-100'
                                        : 'bg-primary-100'
                                    }`}
                            >
                                {selectedRecord.type === 'check-in' ? (
                                    <LogIn className="h-6 w-6 text-success-600" />
                                ) : (
                                    <LogOut className="h-6 w-6 text-primary-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900 capitalize">
                                    {selectedRecord.type.replace('-', ' ')}
                                </p>
                                <p className="text-gray-500">
                                    {format(new Date(selectedRecord.timestamp), 'EEEE, MMMM d, yyyy • h:mm:ss a')}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge
                                variant={selectedRecord.verified ? 'verified' : 'unverified'}
                                showDot
                            >
                                {selectedRecord.verified ? 'Verified' : 'Not Verified'}
                            </StatusBadge>
                            {selectedRecord.isLate && (
                                <StatusBadge variant="late" showDot>
                                    Late
                                </StatusBadge>
                            )}
                            {selectedRecord.isEarlyLeave && (
                                <StatusBadge variant="early" showDot>
                                    Early Leave
                                </StatusBadge>
                            )}
                            {selectedRecord.isSuspicious && (
                                <StatusBadge variant="suspicious" showDot>
                                    Suspicious
                                </StatusBadge>
                            )}
                        </div>

                        {/* Verification factors */}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">
                                Verification Factors
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'GPS', verified: selectedRecord.gpsVerified },
                                    { label: 'QR Code', verified: selectedRecord.qrVerified },
                                    { label: 'IP Address', verified: selectedRecord.ipVerified },
                                    { label: 'Photo', verified: selectedRecord.photoVerified },
                                ].map((factor) => (
                                    <div
                                        key={factor.label}
                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                                    >
                                        {factor.verified ? (
                                            <CheckCircle className="h-5 w-5 text-success-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-700">
                                            {factor.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        {selectedRecord.location && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Location</p>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">
                                        {selectedRecord.location.lat.toFixed(6)}, {selectedRecord.location.lng.toFixed(6)}
                                        {selectedRecord.location.accuracyMeters && (
                                            <span className="text-gray-400">
                                                {' '}
                                                (±{selectedRecord.location.accuracyMeters.toFixed(0)}m)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Comment */}
                        {selectedRecord.userComment && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Comment</p>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {selectedRecord.userComment}
                                </p>
                            </div>
                        )}

                        {/* Suspicious reasons */}
                        {selectedRecord.isSuspicious && selectedRecord.suspiciousReasons && (
                            <div>
                                <p className="text-sm font-medium text-danger-700 mb-2">
                                    Suspicious Activity Flags
                                </p>
                                <ul className="list-disc list-inside text-sm text-danger-600 bg-danger-50 p-3 rounded-lg">
                                    {selectedRecord.suspiciousReasons.map((reason, idx) => (
                                        <li key={idx}>{reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
