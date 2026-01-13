/**
 * @fileoverview Toast notification system with variants.
 * Provides non-blocking notifications for user feedback.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast variant types
 */
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast data structure
 */
interface Toast {
    id: string;
    variant: ToastVariant;
    message: string;
    title?: string;
    duration?: number;
}

/**
 * Toast context type
 */
interface ToastContextType {
    /** Add a new toast */
    toast: (options: Omit<Toast, 'id'>) => void;
    /** Quick success toast */
    success: (message: string, title?: string) => void;
    /** Quick error toast */
    error: (message: string, title?: string) => void;
    /** Quick warning toast */
    warning: (message: string, title?: string) => void;
    /** Quick info toast */
    info: (message: string, title?: string) => void;
    /** Dismiss a toast */
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Icon mapping for toast variants
 */
const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-success-500" />,
    error: <AlertCircle className="h-5 w-5 text-danger-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
    info: <Info className="h-5 w-5 text-primary-500" />,
};

/**
 * Background styles for toast variants
 */
const bgStyles: Record<ToastVariant, string> = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
};

/**
 * Individual Toast component
 */
interface ToastItemProps extends Toast {
    onDismiss: (id: string) => void;
}

function ToastItem({ id, variant, message, title, onDismiss }: ToastItemProps) {
    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slide-up max-w-sm
        ${bgStyles[variant]}
      `}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[variant]}</div>
            <div className="flex-1 min-w-0">
                {title && <p className="font-medium text-gray-900 text-sm">{title}</p>}
                <p className={`text-sm text-gray-600 ${title ? 'mt-0.5' : ''}`}>{message}</p>
            </div>
            <button
                type="button"
                className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-500 transition-colors"
                onClick={() => onDismiss(id)}
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Toast Provider component
 */
interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    /**
     * Add a new toast
     */
    const addToast = useCallback((options: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const duration = options.duration ?? 5000;

        setToasts((prev) => [...prev, { ...options, id }]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    /**
     * Dismiss a toast by ID
     */
    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    /**
     * Helper methods for quick toasts
     */
    const success = useCallback((message: string, title?: string) => {
        addToast({ variant: 'success', message, title });
    }, [addToast]);

    const error = useCallback((message: string, title?: string) => {
        addToast({ variant: 'error', message, title });
    }, [addToast]);

    const warning = useCallback((message: string, title?: string) => {
        addToast({ variant: 'warning', message, title });
    }, [addToast]);

    const info = useCallback((message: string, title?: string) => {
        addToast({ variant: 'info', message, title });
    }, [addToast]);

    const contextValue: ToastContextType = React.useMemo(() => ({
        toast: addToast,
        success,
        error,
        warning,
        info,
        dismiss,
    }), [addToast, success, error, warning, info, dismiss]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * Hook to access toast functions
 */
export function useToast(): ToastContextType {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}

export type { Toast, ToastVariant, ToastContextType };
