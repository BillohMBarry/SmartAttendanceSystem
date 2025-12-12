import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/Users.js';
import { Attendance } from '../models/Attendance.js';
import { generateQRToken } from '../utils/token.js';
import { successResponse, errorResponse } from '../utils/response.js';
// @ts-ignore
import { Parser } from 'json2csv';

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        return successResponse(res, 'Users retrieved successfully', users);
    } catch (e) {
        return errorResponse(res, 'Failed to retrieve users', e);
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, office, jobTitle } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return errorResponse(res, 'Name, email, and password are required', null, 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 'User with this email already exists', null, 409);
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            passwordHash: hashedPassword,
            role: role || 'employee',
            office,
            jobTitle
        });

        await user.save();

        // Return user without password hash
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            office: user.office,
            jobTitle: user.jobTitle
        };

        return successResponse(res, 'User created successfully', userResponse, 201);
    } catch (e) {
        return errorResponse(res, 'Failed to create user', e);
    }
};

export const createQRToken = async (req: Request, res: Response) => {
    try {
        const { officeId, expiresInMinutes } = req.body;
        const token = generateQRToken(officeId, 'admin', expiresInMinutes || 60);
        return successResponse(res, 'QR Token generated successfully', {
            token,
            officeId,
            expiresAt: Date.now() + (expiresInMinutes || 60) * 60000
        });
    } catch (e) {
        return errorResponse(res, 'Failed to generate QR token', e);
    }
};

export const listQRTokens = async (req: Request, res: Response) => {
    return successResponse(res, 'Stateless tokens used. Listing not available.');
};

export const dailyReport = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) {
            return errorResponse(res, 'Date query parameter is required', null, 400);
        }
        const start = new Date(date as string);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const records = await Attendance.find({
            timestamp: { $gte: start, $lt: end }
        }).populate('userId', 'name email');

        // Calculate summary stats
        const summary = {
            totalCheckIns: records.filter(r => r.type === 'check-in').length,
            lateCheckIns: records.filter(r => r.isLate).length,
            earlyCheckOuts: records.filter(r => r.isEarlyLeave).length,
            totalRecords: records.length
        };

        return successResponse(res, 'Daily report retrieved successfully', { summary, records });
    } catch (e) {
        return errorResponse(res, 'Failed to generate daily report', e);
    }
};

export const exportCSV = async (req: Request, res: Response) => {
    try {
        const records = await Attendance.find().populate('userId', 'name');
        const fields = [
            'userId.name',
            'timestamp',
            'type',
            'verified',
            'isSuspicious',
            'isLate',
            'isEarlyLeave',
            'userComment'
        ];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(records);

        res.header('Content-Type', 'text/csv');
        res.attachment('attendance.csv');
        return res.send(csv);
    } catch (e) {
        return errorResponse(res, 'Failed to export CSV', e);
    }
};
