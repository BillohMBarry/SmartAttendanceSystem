/**
 * @fileoverview Loading spinner component with size variants.
 * Provides visual feedback during async operations.
 */

import React from 'react';

/**
 * Spinner size types
 */
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner props
 */
interface SpinnerProps {
    /** Size of the spinner */
    size?: SpinnerSize;
    /** Color class for the spinner */
    color?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Size styles mapping (width/height)
 */
const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
};

/**
 * Spinner Component
 * An animated loading spinner
 * 
 * @example
 * ```tsx
 * <Spinner size="md" />
 * <Spinner size="lg" color="text-primary-600" />
 * ```
 */
export function Spinner({ size = 'md', color = 'text-primary-600', className = '' }: SpinnerProps) {
    return (
        <svg
            className={`animate-spin ${sizeStyles[size]} ${color} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/**
 * Full page loading spinner with backdrop
 */
interface LoadingOverlayProps {
    /** Loading message to display */
    message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="xl" />
                <p className="text-gray-600 font-medium">{message}</p>
            </div>
        </div>
    );
}

/**
 * Inline loading state for content areas
 */
interface LoadingStateProps {
    /** Loading message */
    message?: string;
    /** Additional CSS classes */
    className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500">{message}</p>
        </div>
    );
}

export type { SpinnerProps, SpinnerSize };
