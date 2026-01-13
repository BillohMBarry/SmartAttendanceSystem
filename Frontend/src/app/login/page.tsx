/**
 * @fileoverview Login page component.
 * Handles user authentication with email and password.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, AlertCircle } from 'lucide-react';

/**
 * Login form validation schema
 */
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page Component
 * Provides email/password authentication with form validation
 */
export default function LoginPage() {
    const { login, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    /**
     * Handle form submission
     */
    const onSubmit = async (data: LoginFormData) => {
        setError(null);

        try {
            await login(data);
            // Redirect happens in AuthContext
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-40 h-33 bg-primary-600 rounded-2xl mb-4 shadow-lg">
                        <h1 className="text-white text-3xl font-bold p-5">CMDA</h1>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-1">Sign in to your attendance account</p>
                </div>

                {/* Login card */}
                <Card variant="elevated" className="p-8">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
                            <p className="text-sm text-danger-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email input */}
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            leftIcon={<Mail className="h-5 w-5" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        {/* Password input */}
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            leftIcon={<Lock className="h-5 w-5" />}
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        {/* Submit button */}
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                            className="mt-6"
                        >
                            Sign In
                        </Button>
                    </form>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Smart Attendance System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
