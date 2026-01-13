/**
 * @fileoverview Sidebar navigation component with role-based menu items.
 * Provides main navigation for the dashboard.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
    Home,
    LogIn,
    LogOut,
    History,
    Calendar,
    User,
    Users,
    QrCode,
    FileText,
    Settings,
    Camera,
} from 'lucide-react';

/**
 * Navigation item type
 */
interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

/**
 * Navigation items configuration
 */
const navigationItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <Home className="h-5 w-5" /> },
    { label: 'Check In', href: '/check-in', icon: <LogIn className="h-5 w-5" /> },
    { label: 'Check Out', href: '/check-out', icon: <LogOut className="h-5 w-5" /> },
    { label: 'History', href: '/history', icon: <History className="h-5 w-5" /> },
    { label: 'Meetings', href: '/meetings', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Face Setup', href: '/face-registration', icon: <Camera className="h-5 w-5" /> },
    { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
];

/**
 * Admin navigation items
 */
const adminNavigationItems: NavItem[] = [
    { label: 'Admin Home', href: '/admin', icon: <Settings className="h-5 w-5" />, adminOnly: true },
    { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" />, adminOnly: true },
    { label: 'QR Tokens', href: '/admin/qr-tokens', icon: <QrCode className="h-5 w-5" />, adminOnly: true },
    { label: 'Reports', href: '/admin/reports', icon: <FileText className="h-5 w-5" />, adminOnly: true },
    { label: 'Manage Meetings', href: '/admin/meetings', icon: <Calendar className="h-5 w-5" />, adminOnly: true },
];

/**
 * Sidebar props
 */
interface SidebarProps {
    /** Whether sidebar is open on mobile */
    isOpen?: boolean;
    /** Close sidebar function for mobile */
    onClose?: () => void;
}

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    /**
     * Check if a nav item is active
     */
    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    /**
     * Render a navigation item
     */
    const renderNavItem = (item: NavItem) => {
        const active = isActive(item.href);

        return (
            <Link
                key={item.href}
                href={item.href}
                className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          transition-colors duration-150
          ${active
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
        `}
                onClick={onClose}
            >
                <span className={active ? 'text-primary-600' : 'text-gray-400'}>
                    {item.icon}
                </span>
                {item.label}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:fixed lg:top-16 lg:bottom-0 lg:h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <nav className="h-full overflow-y-auto p-4 pt-20 lg:pt-4">
                    {/* Main navigation */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Main Menu
                        </p>
                        {navigationItems.map(renderNavItem)}
                    </div>

                    {/* Admin navigation (only for admin users) */}
                    {isAdmin && (
                        <div className="mt-8 space-y-1">
                            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Administration
                            </p>
                            {adminNavigationItems.map(renderNavItem)}
                        </div>
                    )}
                </nav>
            </aside>
        </>
    );
}
