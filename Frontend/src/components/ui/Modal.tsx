/**
 * @fileoverview Modal dialog component with backdrop and accessibility.
 * Provides a reusable modal for dialogs, confirmations, and forms.
 */

'use client';

import React, { useEffect, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Modal size types
 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal props
 */
interface ModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal description */
    description?: string;
    /** Modal content */
    children: ReactNode;
    /** Modal size */
    size?: ModalSize;
    /** Show close button */
    showCloseButton?: boolean;
    /** Close on backdrop click */
    closeOnBackdrop?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
}

/**
 * Size styles mapping
 */
const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

/**
 * Modal Component
 * An accessible modal dialog with backdrop
 * 
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <div className="flex gap-3 mt-4">
 *     <Button onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
 *   </div>
 * </Modal>
 * ```
 */
export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
}: ModalProps) {
    /**
     * Handle escape key press
     */
    const handleEscape = useCallback(
        (event: KeyboardEvent) => {
            if (closeOnEscape && event.key === 'Escape') {
                onClose();
            }
        },
        [closeOnEscape, onClose]
    );

    /**
     * Lock body scroll when modal is open
     */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal container */}
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Modal panel */}
                <div
                    className={`
            relative w-full ${sizeStyles[size]}
            bg-white rounded-xl shadow-xl
            transform transition-all animate-fade-in
          `}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    aria-describedby={description ? 'modal-description' : undefined}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div>
                                {title && (
                                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p id="modal-description" className="text-sm text-gray-500 mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showCloseButton && (
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                                    onClick={onClose}
                                    aria-label="Close modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4">{children}</div>
                </div>
            </div>
        </div>
    );
}

/**
 * Confirmation modal variant
 */
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    // Import Button here to avoid circular dependency
    const { Button } = require('./Button');

    const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </Button>
                <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}

export type { ModalProps, ModalSize };
