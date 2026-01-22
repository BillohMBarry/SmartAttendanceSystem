import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/Users.js';
import { JWT_SECRET } from '../config/config.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../types/auth.types.ts';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });


        if (!user) {
            return errorResponse(res, 'Incorrect email', null, 401);
        }

        // Handle plain text vs hashed for initial setup compatibility if needed, 
        // but strictly prefer bcrypt.
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return errorResponse(res, 'Incorrect password', null, 401);
        }

        const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        return successResponse(res, 'Login successful', {
            token,
            user: { id: user._id, name: user.name, role: user.role, office: user.office }
        });
    } catch (error) {
        return errorResponse(res, 'Server error', error);
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, office, jobTitle } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, passwordHash: hashedPassword, role, office, jobTitle });
        await user.save();
        return successResponse(res, 'User created', { userId: user._id }, 201);
    } catch (error) {
        return errorResponse(res, 'Error creating user', error);
    }
};

export const employeeSignup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, jobTitle } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 'Email already registered', null, 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            passwordHash: hashedPassword,
            role: 'employee',
            jobTitle,
            isActive: true,
        });
        await user.save();

        return successResponse(res, 'Account created successfully', { userId: user._id }, 201);
    } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate key')) {
            return errorResponse(res, 'Email already registered', null, 400);
        }
        return errorResponse(res, 'Error creating account', error);
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, jobTitle } = req.body;

        if (!req.user) {
            return errorResponse(res, 'Unauthorized', null, 401);
        }

        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, jobTitle },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        return successResponse(res, 'Profile updated successfully', updatedUser);
    } catch (error) {
        return errorResponse(res, 'Error updating profile', error);
    }
};
