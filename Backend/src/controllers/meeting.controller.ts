import type { Response } from 'express';
// import type { AuthRequest } from '../middleware/auth.ts';
import type { AuthRequest } from '../types/auth.types.js';
import { Meeting } from '../models/Meetings.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Create a meeting (Admin only)
export const createMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, startTime, endTime, attendees, location, type } = req.body;

        if (!req.user) {
            return errorResponse(res, 'Unauthorized', null, 401);
        }

        const meeting = new Meeting({
            title,
            description,
            startTime,
            endTime,
            location,
            type,
            attendees,
            createdBy: req.user.id
        });

        await meeting.save();
        return successResponse(res, 'Meeting created successfully', meeting, 201);
    } catch (error) {
        return errorResponse(res, 'Failed to create meeting', error);
    }
};

// List meetings (visible to all auth users, filter could be applied)
export const listMeetings = async (req: AuthRequest, res: Response) => {
    try {
        // Option: Filter meetings where user is attendee or all meetings?
        // Requirement implies "weekly meeting plan", suggesting a schedule view.
        // We'll return all future meetings for now.
        const { start, end } = req.query;

        let query: any = {};
        if (start && end) {
            query.startTime = { $gte: new Date(start as string), $lte: new Date(end as string) };
        }

        const meetings = await Meeting.find(query)
            .populate('attendees', 'name email jobTitle')
            .populate('createdBy', 'name')
            .sort({ startTime: 1 });

        return successResponse(res, 'Meetings retrieved', meetings);
    } catch (error) {
        return errorResponse(res, 'Failed to retrieve meetings', error);
    }
};

export const getMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('attendees', 'name email')
            .populate('createdBy', 'name');

        if (!meeting) return errorResponse(res, 'Meeting not found', null, 404);
        return successResponse(res, 'Meeting details', meeting);
    } catch (error) {
        return errorResponse(res, 'Error fetching meeting', error);
    }
};

export const updateMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const updated = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return errorResponse(res, 'Meeting not found', null, 404);
        return successResponse(res, 'Meeting updated', updated);
    } catch (error) {
        return errorResponse(res, 'Failed to update meeting', error);
    }
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const deleted = await Meeting.findByIdAndDelete(req.params.id);
        if (!deleted) return errorResponse(res, 'Meeting not found', null, 404);
        return successResponse(res, 'Meeting deleted', null);
    } catch (error) {
        return errorResponse(res, 'Failed to delete meeting', error);
    }
};
