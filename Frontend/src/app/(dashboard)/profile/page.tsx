/**
 * @fileoverview Profile page for viewing and updating user profile.
 * Includes face registration status and settings.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { authService } from '@/services/auth.service';
import { faceService } from '@/services/face.service';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { User, Mail, Briefcase, Camera, CheckCircle, XCircle, Building } from 'lucide-react';
import type { FaceStatus } from '@/types';

/**
 * Profile form validation schema
 */
const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    jobTitle: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Profile Page Component
 * View and edit user profile information
 */
export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [faceStatus, setFaceStatus] = useState<FaceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            jobTitle: user?.jobTitle || '',
        },
    });

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
     * Reset form when user data changes
     */
    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                jobTitle: user.jobTitle || '',
            });
        }
    }, [user, reset]);

    /**
     * Handle profile update
     */
    const onSubmit = async (data: ProfileFormData) => {
        setIsSaving(true);

        try {
            const updatedUser = await authService.updateProfile(data);
            updateUser(updatedUser);
            toast.success('Profile updated successfully');
            reset(data); // Reset dirty state
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingState message="Loading profile..." />;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account information</p>
            </div>

            {/* Profile info card */}
            <Card>
                <CardHeader title="Personal Information" />
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <Input
                            label="Full Name"
                            leftIcon={<User className="h-5 w-5" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">{user?.email}</span>
                                <span className="ml-auto text-xs text-gray-400">Cannot be changed</span>
                            </div>
                        </div>

                        {/* Job Title */}
                        <Input
                            label="Job Title"
                            leftIcon={<Briefcase className="h-5 w-5" />}
                            placeholder="e.g., Software Engineer"
                            error={errors.jobTitle?.message}
                            {...register('jobTitle')}
                        />

                        {/* Role (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Role
                            </label>
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                <Building className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700 capitalize">{user?.role}</span>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isLoading={isSaving}
                        disabled={!isDirty}
                    >
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Face recognition card */}
            <Card>
                <CardHeader
                    title="Face Recognition"
                    subtitle="Secure your attendance with facial verification"
                />
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-full ${faceStatus?.faceRegistered ? 'bg-success-100' : 'bg-gray-100'
                                    }`}
                            >
                                {faceStatus?.faceRegistered ? (
                                    <CheckCircle className="h-6 w-6 text-success-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {faceStatus?.faceRegistered ? 'Face Registered' : 'Not Registered'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {faceStatus?.faceRegistered
                                        ? `Registered on ${new Date(faceStatus.faceRegisteredAt!).toLocaleDateString()}`
                                        : 'Register your face for secure check-in'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <StatusBadge
                                variant={faceStatus?.rekognitionAvailable ? 'success' : 'warning'}
                                size="sm"
                            >
                                {faceStatus?.rekognitionAvailable ? 'Service Active' : 'Service Unavailable'}
                            </StatusBadge>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href="/face-registration">
                        <Button
                            variant={faceStatus?.faceRegistered ? 'secondary' : 'primary'}
                            leftIcon={<Camera className="h-4 w-4" />}
                        >
                            {faceStatus?.faceRegistered ? 'Update Face' : 'Register Face'}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>

            {/* Office info (if available) */}
            {user?.office && (
                <Card>
                    <CardHeader title="Office Assignment" />
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Office Name</span>
                                <span className="font-medium text-gray-900">{user.office.name}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Location</span>
                                <span className="font-medium text-gray-900">{user.office.location}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-500">Check-in Radius</span>
                                <span className="font-medium text-gray-900">
                                    {user.office.radiusMeters}m
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
