import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to handle Multer errors
 * This should be placed after routes that use multer
 */
export const handleMulterError = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
        // Handle Multer-specific errors
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return errorResponse(
                    res,
                    'File too large',
                    {
                        message: 'File size exceeds the maximum allowed size of 5MB',
                        maxSize: '5MB'
                    },
                    400
                );

            case 'LIMIT_FILE_COUNT':
                return errorResponse(
                    res,
                    'Too many files',
                    {
                        message: 'Only one file is allowed per upload',
                        maxFiles: 1
                    },
                    400
                );

            case 'LIMIT_UNEXPECTED_FILE':
                return errorResponse(
                    res,
                    'Unexpected file field',
                    {
                        message: 'Unexpected file field in the request',
                        field: err.field
                    },
                    400
                );

            default:
                return errorResponse(
                    res,
                    'File upload error',
                    {
                        message: err.message,
                        code: err.code
                    },
                    400
                );
        }
    } else if (err) {
        // Handle custom file filter errors
        if (err.message.includes('Only image files')) {
            return errorResponse(
                res,
                'Invalid file type',
                {
                    message: err.message,
                    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                },
                400
            );
        }

        // Pass other errors to the next error handler
        next(err);
    } else {
        next();
    }
};
