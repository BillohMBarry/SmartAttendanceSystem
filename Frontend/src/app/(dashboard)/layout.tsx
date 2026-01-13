/**
 * @fileoverview Dashboard layout component.
 * Wraps all dashboard pages with the main layout structure.
 */

import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * Dashboard Layout
 * Applies the DashboardLayout component to all child routes
 */
export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
