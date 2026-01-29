/**
 * @fileoverview Next.js middleware for route protection.
 * Handles authentication and role-based access control.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const publicRoutes = ['/login', '/signup'];

/**
 * Admin-only routes that require admin role
 */
const adminRoutes = ['/admin'];

/**
 * Cookie name for auth token
 */
const TOKEN_COOKIE = 'attendance_auth_token';

/**
 * Decode JWT token to extract payload (without verification)
 * Note: Verification is done server-side, this is just for routing decisions
 */
function decodeToken(token: string): { id: string; role: string; exp: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Middleware function to protect routes
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get auth token from cookies
    const token = request.cookies.get(TOKEN_COOKIE)?.value;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // Check if current route is admin-only
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

    // If no token and trying to access protected route, redirect to login
    if (!token && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If has token but on login page, redirect to dashboard
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Check for admin routes
    if (token && isAdminRoute) {
        const payload = decodeToken(token);

        // If not admin, redirect to dashboard
        if (!payload || payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            // Token expired, redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete(TOKEN_COOKIE);
            return response;
        }
    }

    // Continue with the request
    return NextResponse.next();
}

/**
 * Configure which routes should be processed by middleware
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    ],
};
