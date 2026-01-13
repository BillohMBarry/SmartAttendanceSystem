/**
 * @fileoverview Status badge component for displaying attendance status.
 * Provides visual indicators for verified, late, early leave, and suspicious states.
 */

import React from 'react';

/**
 * Status badge variant types
 */
type BadgeVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'verified'
    | 'unverified'
    | 'late'
    | 'early'
    | 'suspicious';

/**
 * Status badge size types
 */
type BadgeSize = 'sm' | 'md';

/**
 * Status badge props
 */
interface StatusBadgeProps {
    /** Badge variant determining color scheme */
    variant: BadgeVariant;
    /** Badge text */
    children: React.ReactNode;
    /** Badge size */
    size?: BadgeSize;
    /** Show dot indicator */
    showDot?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Variant styles mapping
 */
const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    success: {
        bg: 'bg-success-100',
        text: 'text-success-700',
        dot: 'bg-success-500',
    },
    warning: {
        bg: 'bg-warning-100',
        text: 'text-warning-700',
        dot: 'bg-warning-500',
    },
    danger: {
        bg: 'bg-danger-100',
        text: 'text-danger-700',
        dot: 'bg-danger-500',
    },
    info: {
        bg: 'bg-primary-100',
        text: 'text-primary-700',
        dot: 'bg-primary-500',
    },
    neutral: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        dot: 'bg-gray-500',
    },
    // Semantic variants for attendance
    verified: {
        bg: 'bg-success-100',
        text: 'text-success-700',
        dot: 'bg-success-500',
    },
    unverified: {
        bg: 'bg-danger-100',
        text: 'text-danger-700',
        dot: 'bg-danger-500',
    },
    late: {
        bg: 'bg-warning-100',
        text: 'text-warning-700',
        dot: 'bg-warning-500',
    },
    early: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
    },
    suspicious: {
        bg: 'bg-danger-100',
        text: 'text-danger-700',
        dot: 'bg-danger-500',
    },
};

/**
 * Size styles mapping
 */
const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

/**
 * StatusBadge Component
 * A badge for displaying status with color-coded variants
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="verified">Verified</StatusBadge>
 * <StatusBadge variant="late" showDot>Late</StatusBadge>
 * <StatusBadge variant="suspicious">Suspicious Activity</StatusBadge>
 * ```
 */
export function StatusBadge({
    variant,
    children,
    size = 'sm',
    showDot = false,
    className = '',
}: StatusBadgeProps) {
    const styles = variantStyles[variant];

    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full
        ${styles.bg} ${styles.text}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {showDot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`} />
            )}
            {children}
        </span>
    );
}

/**
 * Helper function to get badge variant from attendance record
 */
export function getAttendanceBadgeVariant(
    verified: boolean,
    isLate: boolean,
    isEarlyLeave: boolean,
    isSuspicious: boolean
): BadgeVariant {
    if (isSuspicious) return 'suspicious';
    if (isLate) return 'late';
    if (isEarlyLeave) return 'early';
    return verified ? 'verified' : 'unverified';
}

/**
 * Helper function to get badge text from attendance record
 */
export function getAttendanceBadgeText(
    verified: boolean,
    isLate: boolean,
    isEarlyLeave: boolean,
    isSuspicious: boolean
): string {
    if (isSuspicious) return 'Suspicious';
    if (isLate) return 'Late';
    if (isEarlyLeave) return 'Early Leave';
    return verified ? 'Verified' : 'Unverified';
}

export type { StatusBadgeProps, BadgeVariant, BadgeSize };
