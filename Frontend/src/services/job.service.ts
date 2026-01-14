import apiClient from '@/lib/api-client';

export interface JobTitle {
    value: string;
    label: string;
}

export const jobService = {
    /**
     * Get all available job titles from the backend
     */
    getJobTitles: async (): Promise<JobTitle[]> => {
        try {
            const response = await apiClient.get<{ data: JobTitle[] }>('/jobs');
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch job titles:', error);
            // Fallback to empty array or throw based on requirements
            return [];
        }
    },
};
