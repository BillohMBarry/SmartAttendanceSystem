/**
 * @fileoverview Authentication utilities for JWT token management.
 * Provides secure token storage using cookies and utility functions
 * for authentication state management.
 */

import Cookies from 'js-cookie';
import type { TokenPayload, UserRole } from '@/types';

// Cookie configuration
const TOKEN_KEY = 'attendance_auth_token';
const COOKIE_OPTIONS = {
    expires: 1, // 1 day
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const,
};

/**
 * Store JWT token in secure cookie
 * @param token - JWT token string
 */
export function setToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
}

/**
 * Retrieve JWT token from cookie
 * @returns Token string or undefined if not found
 */
export function getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
}

/**
 * Remove JWT token from storage (logout)
 */
export function removeToken(): void {
    Cookies.remove(TOKEN_KEY);
}

/**
 * Decode JWT token payload without verification
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        // JWT structure: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decode base64url payload
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
}

/**
 * Check if user is currently authenticated
 * @returns True if valid token exists and is not expired
 */
export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) {
        return false;
    }

    const payload = decodeToken(token);
    if (!payload) {
        return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
}

/**
 * Get the current user's role from token
 * @returns User role or null if not authenticated
 */
export function getUserRole(): UserRole | null {
    const token = getToken();
    if (!token) {
        return null;
    }

    const payload = decodeToken(token);
    return payload?.role || null;
}

/**
 * Get the current user's ID from token
 * @returns User ID or null if not authenticated
 */
export function getUserId(): string | null {
    const token = getToken();
    if (!token) {
        return null;
    }

    const payload = decodeToken(token);
    return payload?.id || null;
}

/**
 * Check if the current user is an admin
 * @returns True if user has admin role
 */
export function isAdmin(): boolean {
    return getUserRole() === 'admin';
}

/**
 * Get time remaining until token expiration
 * @returns Seconds until expiration or 0 if expired/invalid
 */
export function getTokenExpirationTime(): number {
    const token = getToken();
    if (!token) {
        return 0;
    }

    const payload = decodeToken(token);
    if (!payload) {
        return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - now;
    return remaining > 0 ? remaining : 0;
}
