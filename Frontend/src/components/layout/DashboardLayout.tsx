/**
 * @fileoverview Dashboard layout component combining header and sidebar.
 * Provides the main layout structure for authenticated pages.
 */

'use client';

import React, { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * DashboardLayout props
 */
interface DashboardLayoutProps {
    children: ReactNode;
}

/**
 * Dashboard Layout Component
 * Main layout wrapper with header, sidebar, and content area
 * 
 * @example
 * ```tsx
 * <DashboardLayout>
 *   <h1>Page Content</h1>
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    /**
     * Toggle sidebar visibility on mobile
     */
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    /**
     * Close sidebar (for mobile)
     */
    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

            {/* Main content area */}
            <div className="flex">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] lg:ml-64">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
