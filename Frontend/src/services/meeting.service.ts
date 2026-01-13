/**
 * @fileoverview Meeting service for meeting management operations.
 * Handles all meeting-related API calls.
 */

import apiClient, { unwrapResponse } from '@/lib/api-client';
import type {
    Meeting,
    CreateMeetingRequest,
    UpdateMeetingRequest,
    ApiResponse,
} from '@/types';

/**
 * Meeting Service
 * Provides methods for meeting CRUD operations
 */
export const meetingService = {
    /**
     * List meetings with optional date range filter
     * @param start - Optional start date filter (ISO string)
     * @param end - Optional end date filter (ISO string)
     * @returns List of meetings sorted by start time
     */
    async listMeetings(start?: string, end?: string): Promise<Meeting[]> {
        let url = '/meetings';
        const params = new URLSearchParams();

        if (start) params.append('start', start);
        if (end) params.append('end', end);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await apiClient.get<ApiResponse<Meeting[]>>(url);
        return unwrapResponse(response);
    },

    /**
     * Get a single meeting by ID
     * @param id - Meeting ID
     * @returns Meeting details with attendees
     */
    async getMeeting(id: string): Promise<Meeting> {
        const response = await apiClient.get<ApiResponse<Meeting>>(`/meetings/${id}`);
        return unwrapResponse(response);
    },

    /**
     * Create a new meeting (admin only)
     * @param data - Meeting creation data
     * @returns Created meeting
     */
    async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
        const response = await apiClient.post<ApiResponse<Meeting>>('/meetings', data);
        return unwrapResponse(response);
    },

    /**
     * Update an existing meeting (admin only)
     * @param id - Meeting ID
     * @param data - Updated meeting data
     * @returns Updated meeting
     */
    async updateMeeting(id: string, data: UpdateMeetingRequest): Promise<Meeting> {
        const response = await apiClient.put<ApiResponse<Meeting>>(`/meetings/${id}`, data);
        return unwrapResponse(response);
    },

    /**
     * Delete a meeting (admin only)
     * @param id - Meeting ID
     */
    async deleteMeeting(id: string): Promise<void> {
        await apiClient.delete(`/meetings/${id}`);
    },
};
