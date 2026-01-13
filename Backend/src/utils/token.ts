import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

interface QRTokenPayload {
    officeId: string;
    expiresAt: number;
    createdBy: string;
}

export const generateQRToken = (officeId: string, createdBy: string, expiresInMinutes: number = 60): string => {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    const payload: QRTokenPayload = { officeId, expiresAt, createdBy };
    return jwt.sign(payload, JWT_SECRET);
};

export const verifyQRToken = (token: string): any => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.expiresAt && decoded.expiresAt < Date.now()) return null;
        return decoded;
    } catch (e) {
        return null;
    }
};
