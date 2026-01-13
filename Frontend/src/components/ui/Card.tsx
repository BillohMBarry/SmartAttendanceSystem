/**
 * @fileoverview Reusable Card component with variants.
 * Provides consistent card styling for content containers.
 */

import React, { HTMLAttributes, forwardRef } from 'react';

/**
 * Card variant types
 */
type CardVariant = 'default' | 'elevated' | 'bordered';

/**
 * Card component props
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual variant of the card */
    variant?: CardVariant;
    /** Remove default padding */
    noPadding?: boolean;
}

/**
 * Variant styles mapping
 */
const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-lg hover:shadow-xl transition-shadow duration-200',
    bordered: 'bg-white border border-gray-200',
};

/**
 * Card Component
 * A container component for grouping related content
 * 
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', noPadding = false, children, className = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`
          rounded-xl ${variantStyles[variant]}
          ${noPadding ? '' : 'p-6'}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

/**
 * Card Header component for consistent header styling
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    /** Card title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Optional action element (e.g., button) */
    action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ title, subtitle, action, className = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex items-center justify-between mb-4 ${className}`}
                {...props}
            >
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Content component for main content area
 */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className = '', ...props }, ref) => {
        return (
            <div ref={ref} className={`${className}`} {...props}>
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

/**
 * Card Footer component for actions or additional info
 */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
export type { CardProps, CardVariant };
