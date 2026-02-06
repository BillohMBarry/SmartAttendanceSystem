/**
 * @fileoverview Authentication Context Provider.
 * Manages global authentication state and provides login/logout functionality.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setToken, removeToken, decodeToken, isAuthenticated as checkAuth } from '@/lib/auth';
import { authService } from '@/services/auth.service';
import type { User, LoginRequest, TokenPayload } from '@/types';

/**
 * Auth context state interface
 */
interface AuthContextState {
    /** Current authenticated user */
    user: User | null;
    /** Whether auth state is being loaded */
    isLoading: boolean;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Login function */
    login: (credentials: LoginRequest) => Promise<void>;
    /** Logout function */
    logout: () => void;
    /** Update user data */
    updateUser: (userData: Partial<User>) => void;
}

// Create the context with undefined default
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps the application to provide auth state to all components
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /**
     * Initialize auth state from stored token
     */
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = getToken();

                if (token && checkAuth()) {
                    // Decode token to get user info
                    const payload = decodeToken(token);

                    if (payload) {
                        // Set basic user info from token
                        setUser({
                            _id: payload.id,
                            name: '', // Will be updated from API if needed
                            email: payload.email,
                            role: payload.role,
                            isActive: true,
                            faceRegistered: false,
                        });
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                removeToken();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Login user with credentials
     */
    const login = useCallback(async (credentials: LoginRequest) => {
        setIsLoading(true);

        try {
            const response = await authService.login(credentials);

            // Store token
            setToken(response.token);

            // Set user from response
            setUser({
                _id: response.user._id || '',
                name: response.user.name,
                email: credentials.email,
                role: response.user.role,
                office: response.user.office,
                isActive: true,
                faceRegistered: false,
            });

            // Note: Redirect is now handled by the login page to support redirect URLs
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout user and clear state
     */
    const logout = useCallback(() => {
        removeToken();
        setUser(null);
        router.push('/login');
    }, [router]);

    /**
     * Update user data (e.g., after profile update)
     */
    const updateUser = useCallback((userData: Partial<User>) => {
        setUser((prev) => prev ? { ...prev, ...userData } : null);
    }, []);

    // Context value
    const value: AuthContextState = {
        user,
        isLoading,
        isAuthenticated: !!user && checkAuth(),
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextState {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export { AuthContext };
