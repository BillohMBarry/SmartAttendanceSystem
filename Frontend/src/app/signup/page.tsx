/**
 * @fileoverview Employee signup page component.
 * Handles employee registration with fullName, email, jobTitle, and password.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { jobService, JobTitle } from '@/services/job.service';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Mail, Lock, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';



/**
 * Signup form validation schema
 */
const signupSchema = z.object({
    name: z.string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters'),
    email: z.string()
        .email('Please enter a valid email address')
        .toLowerCase(),
    jobTitle: z.string().min(1, 'Please select a job title'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .refine(
            (password) => /[a-z]/.test(password),
            'Password must contain at least one lowercase letter'
        )
        .refine(
            (password) => /[A-Z]/.test(password),
            'Password must contain at least one uppercase letter'
        )
        .refine(
            (password) => /[0-9]/.test(password),
            'Password must contain at least one number'
        ),
});

type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Signup Page Component
 * Provides employee registration with form validation
 */
export default function SignupPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

    useEffect(() => {
        const fetchJobTitles = async () => {
            const titles = await jobService.getJobTitles();
            setJobTitles(titles);
        };
        fetchJobTitles();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            jobTitle: undefined,
            password: '',
        },
    });

    /**
     * Handle form submission
     */
    const onSubmit = async (data: SignupFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            await authService.signup(data);
            setIsSuccess(true);
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
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
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 mt-1">Sign up to get started with attendance tracking</p>
                </div>

                {/* Signup card */}
                <Card variant="elevated" className="p-8">
                    {/* Success message */}
                    {isSuccess && (
                        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
                            <p className="text-sm text-success-700">Account created successfully! Redirecting to login...</p>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
                            <p className="text-sm text-danger-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name input */}
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Enter your full name"
                            leftIcon={<User className="h-5 w-5" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        {/* Email input */}
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            leftIcon={<Mail className="h-5 w-5" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        {/* Job Title dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Job Title
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    className={`
                                        block w-full rounded-lg border transition-colors duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-0
                                        pl-10 pr-4 py-2.5 text-base
                                        ${errors.jobTitle
                                            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }
                                    `}
                                    {...register('jobTitle')}
                                >
                                    <option value="">Select your job title</option>
                                    {jobTitles.map((title) => (
                                        <option key={title.value} value={title.value}>
                                            {title.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.jobTitle && (
                                <p className="mt-1.5 text-sm text-danger-600">{errors.jobTitle.message}</p>
                            )}
                        </div>

                        {/* Password input */}
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            leftIcon={<Lock className="h-5 w-5" />}
                            error={errors.password?.message}
                            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                            {...register('password')}
                        />

                        {/* Submit button */}
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                            disabled={isSuccess}
                            className="mt-6"
                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Login link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Smart Attendance System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
