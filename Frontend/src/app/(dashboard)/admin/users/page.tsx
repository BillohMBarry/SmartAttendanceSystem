/**
 * @fileoverview Admin users management page.
 * Lists users and allows creating new users.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/Spinner';
import { Plus, User, Mail, Briefcase, Shield, CheckCircle, XCircle, Search } from 'lucide-react';
import type { User as UserType } from '@/types';

/**
 * Create user form schema
 */
const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'employee']),
    jobTitle: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Admin Users Page Component
 * Manage system users
 */
export default function AdminUsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: 'employee',
        },
    });

    /**
     * Fetch users on mount
     */
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await adminService.listUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                toast.error('Failed to load users');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [toast]);

    /**
     * Handle create user
     */
    const onCreateUser = async (data: CreateUserFormData) => {
        setIsCreating(true);

        try {
            const newUser = await adminService.createUser(data);
            setUsers((prev) => [...prev, newUser]);
            toast.success('User created successfully');
            setShowCreateModal(false);
            reset();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    /**
     * Filter users by search term
     */
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <LoadingState message="Loading users..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">
                        {users.length} users in the system
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Plus className="h-5 w-5" />}
                >
                    Add User
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>

            {/* Users list */}
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No users found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary-600 font-semibold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* User info */}
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Status and role */}
                                    <div className="flex items-center gap-3">
                                        {user.jobTitle && (
                                            <span className="text-sm text-gray-500">{user.jobTitle}</span>
                                        )}
                                        <StatusBadge variant={user.role === 'admin' ? 'info' : 'neutral'}>
                                            {user.role}
                                        </StatusBadge>
                                        {user.faceRegistered ? (
                                            <span title="Face registered">
                                                <CheckCircle className="h-5 w-5 text-success-500" />
                                            </span>
                                        ) : (
                                            <span title="Face not registered">
                                                <XCircle className="h-5 w-5 text-gray-300" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create user modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    reset();
                }}
                title="Create New User"
                size="md"
            >
                <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
                    <Input
                        label="Full Name"
                        leftIcon={<User className="h-5 w-5" />}
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        leftIcon={<Mail className="h-5 w-5" />}
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <Input
                        label="Password"
                        type="password"
                        error={errors.password?.message}
                        {...register('password')}
                    />

                    <Input
                        label="Job Title (Optional)"
                        leftIcon={<Briefcase className="h-5 w-5" />}
                        {...register('jobTitle')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Role
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="employee"
                                    {...register('role')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">Employee</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="admin"
                                    {...register('role')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">Admin</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isCreating}>
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
