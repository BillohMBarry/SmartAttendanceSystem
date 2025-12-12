import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/auth.types.js';
import { UAParser } from 'ua-parser-js';

export const parseDevice = (req: AuthRequest, res: Response, next: NextFunction) => {
    const ua = req.headers['user-agent'];
    // Handle case where ua-parser-js might need updated usage or types
    // @ts-ignore
    const parser = new UAParser(ua);
    const result = parser.getResult();

    req.deviceInfo = result;
    next();
};
