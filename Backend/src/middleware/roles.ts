import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/auth.types.ts';
import { errorResponse } from '../utils/response.js';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return errorResponse(res, 'Access denied. Admins only.', null, 403);
    }
    next();
};
