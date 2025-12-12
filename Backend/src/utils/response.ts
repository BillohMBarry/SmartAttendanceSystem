import type { Response } from 'express';

export interface SuccessResponse<T> {
    success: true;
    message: string;
    data?: T;
}

export interface ErrorResponse {
    success: false;
    message: string;
    error?: any;
}

/**
 * Send a success response
 * @param res Express Response object
 * @param message Human readable message
 * @param data Data to send back
 * @param statusCode HTTP status code (default 200)
 */
export const successResponse = <T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
): Response<SuccessResponse<T>> => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send an error response
 * @param res Express Response object
 * @param message Human readable error message
 * @param error Raw error object or details
 * @param statusCode HTTP status code (default 500)
 */
export const errorResponse = (
    res: Response,
    message: string,
    error?: any,
    statusCode: number = 500
): Response<ErrorResponse> => {
    // If we are in production, we might want to mask the raw error, 
    // but for now we'll send it if provided, or the error message if it's an Error object
    const errorDetails = error instanceof Error ? error.message : error;

    return res.status(statusCode).json({
        success: false,
        message,
        error: errorDetails
    });
};
