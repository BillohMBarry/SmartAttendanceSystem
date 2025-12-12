import type { Request } from 'express';
import type UAParser from 'ua-parser-js';

/**
 * JWT Payload interface for decoded tokens
 */
export interface JWTPayload {
    id: string;
    role: 'admin' | 'employee';
    email: string;
    iat?: number;
    exp?: number;
}

/**
 * Extended Request interface with authenticated user information
 */
export interface AuthRequest extends Request {
    user?: JWTPayload;
    deviceInfo?: UAParser.IResult;
}
