/**
 * @fileoverview Root layout component for the Next.js application.
 * Sets up global providers, fonts, and metadata.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Inter font configuration
 */
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

/**
 * Application metadata
 */
export const metadata: Metadata = {
    title: 'Smart Attendance System',
    description: 'A comprehensive attendance management system with GPS verification, face recognition, and multi-factor authentication.',
    keywords: ['attendance', 'management', 'GPS', 'face recognition', 'employee'],
    authors: [{ name: 'Attendance System Team' }],
};

/**
 * Root Layout Component
 * Wraps all pages with global providers and styles
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className={`${inter.className} min-h-screen`}>
                {/* Auth context provider */}
                <AuthProvider>
                    {/* Toast notification provider */}
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
