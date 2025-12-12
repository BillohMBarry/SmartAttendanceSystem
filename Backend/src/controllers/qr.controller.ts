import type { Request, Response } from 'express';
import { verifyQRToken } from '../utils/token.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const validateToken = (req: Request, res: Response) => {
    const { token } = req.body;
    const decoded = verifyQRToken(token);
    if (decoded) {
        return successResponse(res, 'Token is valid', { valid: true, data: decoded });
    } else {
        return errorResponse(res, 'Invalid or expired token', { valid: false }, 400);
    }
};
