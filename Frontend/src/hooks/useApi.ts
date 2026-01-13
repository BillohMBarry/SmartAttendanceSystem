/**
 * @fileoverview Generic async data fetching hook with loading, error, and retry support.
 * Provides a reusable pattern for API calls with proper state management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * State for async data fetching
 */
interface UseApiState<T> {
    /** Fetched data */
    data: T | null;
    /** Whether request is in progress */
    isLoading: boolean;
    /** Error message if request failed */
    error: string | null;
}

/**
 * Return type for useApi hook
 */
interface UseApiResult<T> extends UseApiState<T> {
    /** Manually trigger a refetch */
    refetch: () => Promise<void>;
    /** Reset state to initial values */
    reset: () => void;
}

/**
 * Options for useApi hook
 */
interface UseApiOptions {
    /** Skip initial fetch on mount */
    skip?: boolean;
    /** Dependencies that trigger refetch when changed */
    deps?: unknown[];
}

/**
 * Generic hook for async data fetching
 * @param fetcher - Async function that returns data
 * @param options - Hook options
 * @returns State and control functions
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useApi(
 *   () => adminService.listUsers(),
 *   { skip: !isAdmin }
 * );
 * ```
 */
export function useApi<T>(
    fetcher: () => Promise<T>,
    options: UseApiOptions = {}
): UseApiResult<T> {
    const { skip = false, deps = [] } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        isLoading: !skip,
        error: null,
    });

    /**
     * Execute the fetch function
     */
    const execute = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await fetcher();
            setState({ data: result, isLoading: false, error: null });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        }
    }, [fetcher]);

    /**
     * Refetch data manually
     */
    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    /**
     * Reset state to initial values
     */
    const reset = useCallback(() => {
        setState({ data: null, isLoading: false, error: null });
    }, []);

    // Initial fetch on mount (unless skipped)
    useEffect(() => {
        if (!skip) {
            execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip, ...deps]);

    return {
        ...state,
        refetch,
        reset,
    };
}

/**
 * Hook for mutation operations (POST, PUT, DELETE)
 * Similar to useApi but for operations that modify data
 */
interface UseMutationResult<T, TArgs extends unknown[]> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    mutate: (...args: TArgs) => Promise<T | null>;
    reset: () => void;
}

export function useMutation<T, TArgs extends unknown[]>(
    mutationFn: (...args: TArgs) => Promise<T>
): UseMutationResult<T, TArgs> {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        isLoading: false,
        error: null,
    });

    const mutate = useCallback(
        async (...args: TArgs): Promise<T | null> => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const result = await mutationFn(...args);
                setState({ data: result, isLoading: false, error: null });
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred';
                setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
                return null;
            }
        },
        [mutationFn]
    );

    const reset = useCallback(() => {
        setState({ data: null, isLoading: false, error: null });
    }, []);

    return {
        ...state,
        mutate,
        reset,
    };
}
