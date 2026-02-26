import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/auth.types.js';
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

        let finalOffice = office;
        if (!finalOffice && (role === 'employee' || !role)) {
            const admin = await User.findOne({ role: 'admin' });
            if (admin && admin.office) {
                finalOffice = admin.office;
            }
        }

        const user = new User({
            name,
            email,
            passwordHash: hashedPassword,
            role: role || 'employee',
            office: finalOffice,
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

export const createQRToken = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        // Fetch admin user from database
        const dbUser = await User.findById(req.user.id);
        if (!dbUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        // Check if admin has an office assigned
        if (!dbUser.office || !(dbUser.office as any)._id) {
            return errorResponse(res, 'Admin does not have an office assigned', null, 400);
        }

        const officeId = String((dbUser.office as any)._id);

        // Calculate expiration time: token expires at 5 PM today
        const now = new Date();
        const today5PM = new Date(now);
        today5PM.setHours(17, 0, 0, 0); // 5:00 PM

        // If it's already past 5 PM, set expiration to 5 PM tomorrow
        const expiresAt = now > today5PM
            ? new Date(today5PM.getTime() + 24 * 60 * 60 * 1000) // Tomorrow at 5 PM
            : today5PM; // Today at 5 PM

        const expiresInMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / (60 * 1000));

        const token = generateQRToken(officeId, req.user.id, expiresInMinutes);

        return successResponse(res, 'QR Token generated successfully', {
            token,
            officeId,
            expiresAt: expiresAt.getTime()
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
