/**
 * @fileoverview Form Input component with label, error, and icon support.
 * Provides consistent input styling with validation states.
 */

import React, { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Input component props
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Left icon */
    leftIcon?: React.ReactNode;
    /** Right icon */
    rightIcon?: React.ReactNode;
    /** Full width */
    fullWidth?: boolean;
}

/**
 * Input Component
 * A form input with label, error message, and icon support
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email?.message}
 *   leftIcon={<Mail className="h-5 w-5" />}
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        // Generate unique ID if not provided
        const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}

                {/* Input container */}
                <div className="relative">
                    {/* Left icon */}
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input field */}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`
              block w-full rounded-lg border transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2.5 text-base
              ${error
                                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                            }
              ${className}
            `}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                        {...props}
                    />

                    {/* Right icon */}
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-600">
                        {error}
                    </p>
                )}

                {/* Helper text */}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
