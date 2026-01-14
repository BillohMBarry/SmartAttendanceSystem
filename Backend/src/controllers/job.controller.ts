import type { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

/**
 * Job titles data source
 * In a future iteration, this could come from a database.
 */
import JobTitle from '../models/jobTitle.model.js';

/**
 * Get all available job titles
 */
export const getJobTitles = async (req: Request, res: Response) => {
    try {
        const jobTitles = await JobTitle.find({}, { _id: 0, value: 1, label: 1 }).sort({ label: 1 });
        return successResponse(res, 'Job titles retrieved successfully', jobTitles);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve job titles',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
