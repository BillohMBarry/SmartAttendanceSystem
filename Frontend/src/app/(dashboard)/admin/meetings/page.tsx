/**
 * @fileoverview Admin meetings management page.
 * CRUD operations for meetings.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { meetingService } from '@/services/meeting.service';
import { adminService } from '@/services/admin.service';
import { jobService, type JobTitle } from '@/services/job.service';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { Plus, Calendar, Clock, MapPin, Trash2, Edit, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Meeting, User } from '@/types';

/**
 * Meeting form schema
 */
const meetingSchema = z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z.string().optional(),
    type: z.enum(['weekly', 'one-time']),
    attendees: z.array(z.string()),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

/**
 * Admin Meetings Page Component
 * Manage meetings (CRUD)
 */
export default function AdminMeetingsPage() {
    const toast = useToast();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<MeetingFormData>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            type: 'one-time',
            attendees: [],
        },
    });

    const selectedAttendeeIds = watch('attendees');
    const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');

    // Filter users based on job title
    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            (!selectedJobTitle || u.jobTitle === selectedJobTitle) &&
            !selectedAttendeeIds?.includes(u._id) // Filter out already selected
        );
    }, [users, selectedJobTitle, selectedAttendeeIds]);

    const handleAddAttendee = (userId: string) => {
        if (!userId) return;
        const current = selectedAttendeeIds || [];
        if (!current.includes(userId)) {
            setValue('attendees', [...current, userId]);
        }
    };

    const removeAttendee = (userId: string) => {
        const current = selectedAttendeeIds || [];
        setValue('attendees', current.filter(id => id !== userId));
    };

    /**
     * Fetch meetings and users on mount
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meetingsData, usersData, jobTitlesData] = await Promise.all([
                    meetingService.listMeetings(),
                    adminService.listUsers(),
                    jobService.getJobTitles(),
                ]);
                setMeetings(meetingsData);
                setUsers(usersData);
                setJobTitles(jobTitlesData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    /**
     * Open edit modal with meeting data
     */
    const openEditModal = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setValue('title', meeting.title);
        setValue('description', meeting.description || '');
        setValue('startTime', format(new Date(meeting.startTime), "yyyy-MM-dd'T'HH:mm"));
        setValue('endTime', format(new Date(meeting.endTime), "yyyy-MM-dd'T'HH:mm"));
        setValue('location', meeting.location || '');
        setValue('type', meeting.type);
        setValue('attendees', meeting.attendees.map((a) => a._id));
    };

    /**
     * Handle create/update meeting
     */
    const onSubmit = async (data: MeetingFormData) => {
        setIsSubmitting(true);

        try {
            if (editingMeeting) {
                // Update existing
                const updated = await meetingService.updateMeeting(editingMeeting._id, {
                    ...data,
                    startTime: new Date(data.startTime).toISOString(),
                    endTime: new Date(data.endTime).toISOString(),
                });
                setMeetings((prev) =>
                    prev.map((m) => (m._id === updated._id ? updated : m))
                );
                toast.success('Meeting updated successfully');
            } else {
                // Create new
                const created = await meetingService.createMeeting({
                    ...data,
                    startTime: new Date(data.startTime).toISOString(),
                    endTime: new Date(data.endTime).toISOString(),
                });
                setMeetings((prev) => [...prev, created]);
                toast.success('Meeting created successfully');
            }

            closeModal();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle delete meeting
     */
    const handleDelete = async () => {
        if (!deletingMeeting) return;

        setIsDeleting(true);

        try {
            await meetingService.deleteMeeting(deletingMeeting._id);
            setMeetings((prev) => prev.filter((m) => m._id !== deletingMeeting._id));
            toast.success('Meeting deleted');
            setDeletingMeeting(null);
        } catch (error) {
            toast.error('Failed to delete meeting');
        } finally {
            setIsDeleting(false);
        }
    };

    /**
     * Close modal and reset form
     */
    const closeModal = () => {
        setShowCreateModal(false);
        setEditingMeeting(null);
        reset();
    };

    if (isLoading) {
        return <LoadingState message="Loading meetings..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meeting Management</h1>
                    <p className="text-gray-500 mt-1">
                        Schedule and manage meetings
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Plus className="h-5 w-5" />}
                >
                    New Meeting
                </Button>
            </div>

            {/* Meetings list */}
            <Card>
                <CardContent className="p-0">
                    {meetings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No meetings scheduled</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {meetings.map((meeting) => (
                                <div
                                    key={meeting._id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                                            <StatusBadge variant={meeting.type === 'weekly' ? 'info' : 'neutral'} size="sm">
                                                {meeting.type}
                                            </StatusBadge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {format(new Date(meeting.startTime), 'MMM d, h:mm a')}
                                            </span>
                                            {meeting.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {meeting.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {meeting.attendees.length} attendees
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(meeting)}
                                            leftIcon={<Edit className="h-4 w-4" />}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-danger-600 hover:bg-danger-50"
                                            onClick={() => setDeletingMeeting(meeting)}
                                            leftIcon={<Trash2 className="h-4 w-4" />}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit modal */}
            <Modal
                isOpen={showCreateModal || !!editingMeeting}
                onClose={closeModal}
                title={editingMeeting ? 'Edit Meeting' : 'Create Meeting'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Title" error={errors.title?.message} {...register('title')} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Description
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                            {...register('description')}
                        />
                    </div>

                    {/* New Attendee Selection UI */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Add Attendees
                        </label>
                        <div className="flex gap-4 mb-3">
                            <div className="w-1/2">
                                <select
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedJobTitle}
                                    onChange={(e) => setSelectedJobTitle(e.target.value)}
                                >
                                    <option value="">All Job Titles</option>
                                    {jobTitles.map((title) => (
                                        <option key={title.value} value={title.value}>
                                            {title.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-1/2">
                                <select
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value=""
                                    onChange={(e) => handleAddAttendee(e.target.value)}
                                >
                                    <option value="">Select Employee...</option>
                                    {filteredUsers.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} ({user.jobTitle || 'No Title'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Selected Attendees List */}
                        <div className="min-h-[60px] p-3 border border-gray-200 rounded-lg bg-gray-50 flex flex-wrap gap-2">
                            {selectedAttendeeIds?.length === 0 && (
                                <p className="text-sm text-gray-400 w-full text-center py-1">
                                    No attendees selected
                                </p>
                            )}
                            {selectedAttendeeIds?.map((id) => {
                                const user = users.find(u => u._id === id);
                                if (!user) return null;
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                        {user.name}
                                        <button
                                            type="button"
                                            onClick={() => removeAttendee(id)}
                                            className="text-gray-400 hover:text-danger-500 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Time"
                            type="datetime-local"
                            error={errors.startTime?.message}
                            {...register('startTime')}
                        />
                        <Input
                            label="End Time"
                            type="datetime-local"
                            error={errors.endTime?.message}
                            {...register('endTime')}
                        />
                    </div>

                    <Input label="Location" placeholder="e.g., Conference Room A" {...register('location')} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="one-time" {...register('type')} className="w-4 h-4" />
                                <span>One-time</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="weekly" {...register('type')} className="w-4 h-4" />
                                <span>Weekly</span>
                            </label>
                        </div>
                    </div>



                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>
                            {editingMeeting ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete confirmation */}
            <ConfirmModal
                isOpen={!!deletingMeeting}
                onClose={() => setDeletingMeeting(null)}
                onConfirm={handleDelete}
                title="Delete Meeting"
                message={`Are you sure you want to delete "${deletingMeeting?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
