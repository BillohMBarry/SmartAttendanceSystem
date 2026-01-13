/**
 * @fileoverview Meetings page for viewing scheduled meetings.
 * Displays list of meetings with date filtering.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { meetingService } from '@/services/meeting.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Calendar, Clock, MapPin, Users, User } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import type { Meeting } from '@/types';

/**
 * Meetings Page Component
 * View scheduled meetings with filtering
 */
export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [dateRange, setDateRange] = useState<'this-week' | 'next-week' | 'all'>('this-week');

    /**
     * Fetch meetings based on date range
     */
    useEffect(() => {
        const fetchMeetings = async () => {
            setIsLoading(true);
            try {
                let start: string | undefined;
                let end: string | undefined;

                const now = new Date();

                if (dateRange === 'this-week') {
                    start = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
                    end = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
                } else if (dateRange === 'next-week') {
                    const nextWeek = addWeeks(now, 1);
                    start = startOfWeek(nextWeek, { weekStartsOn: 1 }).toISOString();
                    end = endOfWeek(nextWeek, { weekStartsOn: 1 }).toISOString();
                }

                const data = await meetingService.listMeetings(start, end);
                setMeetings(data);
            } catch (error) {
                console.error('Failed to fetch meetings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetings();
    }, [dateRange]);

    /**
     * Get date label for a meeting
     */
    const getDateLabel = (dateStr: string): string => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'EEEE, MMM d');
    };

    /**
     * Group meetings by date
     */
    const groupedMeetings = meetings.reduce((groups, meeting) => {
        const dateKey = format(new Date(meeting.startTime), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(meeting);
        return groups;
    }, {} as Record<string, Meeting[]>);

    if (isLoading) {
        return <LoadingState message="Loading meetings..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
                    <p className="text-gray-500 mt-1">View your scheduled meetings</p>
                </div>

                {/* Date range filter */}
                <div className="flex gap-2">
                    {(['this-week', 'next-week', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {range === 'this-week'
                                ? 'This Week'
                                : range === 'next-week'
                                    ? 'Next Week'
                                    : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meetings list */}
            {meetings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No meetings scheduled</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedMeetings).map(([date, dayMeetings]) => (
                        <div key={date}>
                            {/* Date header */}
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {getDateLabel(dayMeetings[0].startTime)}
                            </h3>

                            {/* Meetings for this day */}
                            <div className="space-y-3">
                                {dayMeetings.map((meeting) => {
                                    const meetingDate = new Date(meeting.startTime);
                                    const isPastMeeting = isPast(new Date(meeting.endTime));

                                    return (
                                        <Card
                                            key={meeting._id}
                                            variant="bordered"
                                            className={`cursor-pointer hover:border-primary-300 transition-colors ${isPastMeeting ? 'opacity-60' : ''
                                                }`}
                                            onClick={() => setSelectedMeeting(meeting)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        {/* Time indicator */}
                                                        <div className="text-center min-w-[60px]">
                                                            <p className="text-lg font-bold text-primary-600">
                                                                {format(meetingDate, 'h:mm')}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(meetingDate, 'a')}
                                                            </p>
                                                        </div>

                                                        {/* Meeting details */}
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {meeting.title}
                                                            </h4>
                                                            {meeting.description && (
                                                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                                                    {meeting.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    {format(new Date(meeting.startTime), 'h:mm a')} -{' '}
                                                                    {format(new Date(meeting.endTime), 'h:mm a')}
                                                                </span>
                                                                {meeting.location && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-4 w-4" />
                                                                        {meeting.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status badge */}
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge
                                                            variant={meeting.type === 'weekly' ? 'info' : 'neutral'}
                                                            size="sm"
                                                        >
                                                            {meeting.type === 'weekly' ? 'Weekly' : 'One-time'}
                                                        </StatusBadge>
                                                        {isPastMeeting && (
                                                            <StatusBadge variant="neutral" size="sm">
                                                                Past
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Meeting details modal */}
            <Modal
                isOpen={!!selectedMeeting}
                onClose={() => setSelectedMeeting(null)}
                title="Meeting Details"
                size="md"
            >
                {selectedMeeting && (
                    <div className="space-y-6">
                        {/* Title and type */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <StatusBadge
                                    variant={selectedMeeting.type === 'weekly' ? 'info' : 'neutral'}
                                >
                                    {selectedMeeting.type === 'weekly' ? 'Weekly Meeting' : 'One-time Meeting'}
                                </StatusBadge>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedMeeting.title}</h3>
                            {selectedMeeting.description && (
                                <p className="text-gray-600 mt-2">{selectedMeeting.description}</p>
                            )}
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(selectedMeeting.startTime), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {format(new Date(selectedMeeting.startTime), 'h:mm a')} -{' '}
                                    {format(new Date(selectedMeeting.endTime), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        {selectedMeeting.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                <p className="text-gray-700">{selectedMeeting.location}</p>
                            </div>
                        )}

                        {/* Organizer */}
                        {selectedMeeting.createdBy && (
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Organized by</p>
                                    <p className="font-medium text-gray-900">
                                        {typeof selectedMeeting.createdBy === 'string'
                                            ? selectedMeeting.createdBy
                                            : selectedMeeting.createdBy.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Attendees */}
                        {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="h-5 w-5 text-gray-400" />
                                    <p className="font-medium text-gray-700">
                                        Attendees ({selectedMeeting.attendees.length})
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedMeeting.attendees.map((attendee) => (
                                        <span
                                            key={attendee._id}
                                            className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                                        >
                                            {attendee.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
