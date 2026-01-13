/**
 * @fileoverview Header component with user menu and navigation.
 * Displays at the top of the dashboard layout.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';

/**
 * Header props
 */
interface HeaderProps {
    /** Toggle sidebar function for mobile */
    onMenuClick?: () => void;
    /** Whether sidebar is open on mobile */
    isSidebarOpen?: boolean;
}

/**
 * Header Component
 * Top navigation bar with logo, user menu, and mobile menu toggle
 */
export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                {/* Left side - Menu toggle and logo */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={onMenuClick}
                        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isSidebarOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="hidden sm:block text-lg font-semibold text-gray-900">
                            Attendance
                        </span>
                    </Link>
                </div>

                {/* Right side - User menu */}
                <div className="relative">
                    <button
                        type="button"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-expanded={isUserMenuOpen}
                        aria-haspopup="true"
                    >
                        {/* User avatar */}
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-600" />
                        </div>

                        {/* User name (hidden on mobile) */}
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                            {user?.name || 'User'}
                        </span>

                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* Dropdown menu */}
                    {isUserMenuOpen && (
                        <>
                            {/* Backdrop to close menu */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsUserMenuOpen(false)}
                            />

                            {/* Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                {/* User info */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full capitalize">
                                        {user?.role}
                                    </span>
                                </div>

                                {/* Menu items */}
                                <div className="py-1">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Profile Settings
                                    </Link>

                                    <button
                                        type="button"
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            logout();
                                        }}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
