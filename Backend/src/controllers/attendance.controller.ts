import type { Response } from 'express';
import type { AuthRequest } from '../types/auth.types.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/Users.js';
import { getDistanceFromLatLonInMeters } from '../utils/geo.js';
import { verifyQRToken } from '../utils/token.js';
import { evaluateMFA } from '../utils/mfa.js';
import { detectSpoofing } from '../utils/flags.js';
import { ATTENDANCE_CONFIG } from '../config/attendance.config.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../middleware/logger.js';
import { rekognitionService } from '../services/rekognition.service.js';

export const checkIn = async (req: AuthRequest, res: Response) => {
    try {
        const { lat, lng, accuracy, qrToken, comment } = req.body;
        const file = req.file;
        const user = req.user;
        const ip = req.ip || req.socket.remoteAddress || '';
        const deviceInfo = req.deviceInfo;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        // Time Check - Flag as Late if after 10:00 AM
        const now = new Date();
        const hour = now.getHours();

        // Strict 10:00 AM cutoff for "Late"
        // 10:01 is late.
        // Assuming checkin is only possible if user is not blocked? User wanted "remove block".
        // Keep weekend block? "attendance there only able to check in ... from 8 to 5 pm monday to friday" 
        // User REVISED: "if sarah checkin at 12 the system shouldn't block the checkin but flag it as late."
        // Meaning: Do NOT block anymore based on time.

        const isLate = (hour >= 10 && now.getMinutes() > 0) || hour > 10;

        const dbUser = await User.findById(user.id)
        // .populate('office');
        if (!dbUser || !dbUser.office) {
            return errorResponse(res, 'User or Office not found', null, 400);
        }

        // 1. GPS Verification
        // Ensure lat/lng are numbers
        const numLat = Number(lat);
        const numLng = Number(lng);
        const numAcc = Number(accuracy);

        let gpsVerified = false;
        let distance = 0;

        if (!isNaN(numLat) && !isNaN(numLng) && !isNaN(numAcc)) {
            distance = getDistanceFromLatLonInMeters(numLat, numLng, dbUser.office.lat, dbUser.office.lng);
            gpsVerified = distance <= ATTENDANCE_CONFIG.MAX_DISTANCE_METERS && numAcc <= ATTENDANCE_CONFIG.MAX_ACCURACY_METERS;
        }

        // 2. QR Verification
        let qrVerified = false;
        let qrData = null;
        if (qrToken) {
            qrData = verifyQRToken(qrToken);
            // Check if token office matches user office
            if (qrData && String(qrData.officeId) === String((dbUser.office as any)._id)) {
                qrVerified = true;
            }
        }

        // 3. IP Verification
        let ipVerified = false;
        if (ATTENDANCE_CONFIG.OFFICE_IP_RANGES.includes(ip)) {
            ipVerified = true;
        }

        // 4. Face Verification (Enhanced with AWS Rekognition)
        let photoVerified = false;
        let faceVerified = false;
        let faceVerificationDetails: any = null;

        // Check if user has registered their face
        if (dbUser.faceRegistered && dbUser.faceId) {
            // User has registered face - verification is REQUIRED
            if (!file) {
                return errorResponse(
                    res,
                    'Face verification required. Please take a selfie to check in.',
                    null,
                    400
                );
            }

            // Verify face using AWS Rekognition
            if (rekognitionService.isAvailable()) {
                const verificationResult = await rekognitionService.verifyFace(
                    file.path,
                    user.id.toString()
                );

                faceVerificationDetails = {
                    matched: verificationResult.matched,
                    similarity: verificationResult.similarity,
                    confidence: verificationResult.confidence,
                };

                if (!verificationResult.success) {
                    logger.error({ userId: user.id, error: verificationResult.error }, 'Face verification failed');
                    return errorResponse(
                        res,
                        'Face verification failed. Please try again.',
                        { error: verificationResult.error },
                        400
                    );
                }

                if (!verificationResult.matched) {
                    logger.warn({ userId: user.id, similarity: verificationResult.similarity }, 'Face mismatch');
                    return errorResponse(
                        res,
                        'Face does not match registered face. Access denied.',
                        {
                            similarity: verificationResult.similarity,
                            threshold: 90,
                        },
                        403
                    );
                }

                // Face matched successfully
                faceVerified = true;
                photoVerified = true;
                logger.info({ userId: user.id, similarity: verificationResult.similarity }, 'Face verified successfully');
            } else {
                // Rekognition not available but user has registered face
                logger.warn('Rekognition not available. Falling back to photo presence check.');
                photoVerified = !!file;
            }
        } else {
            // User has NOT registered face yet
            // Just check if photo is present (backward compatibility)
            photoVerified = !!file;

            if (file) {
                logger.info(`User ${user.id} has not registered face. Photo uploaded but not verified.`);
            }
        }

        // MFA
        const factors = { gpsVerified, qrVerified, ipVerified, photoVerified, faceVerified };
        const verified = evaluateMFA(factors);

        // Spoofing
        const spoofCheck = detectSpoofing({ distanceMeters: distance, gpsAccuracy: numAcc });

        // Save
        const attendance = new Attendance({
            userId: user.id,
            type: 'check-in',
            method: 'GPS',
            location: { lat: numLat, lng: numLng, accuracyMeters: numAcc },
            ipAddress: ip,
            deviceInfo,
            photoUrl: file ? file.path : undefined,
            qrTokenId: qrToken,
            gpsVerified, qrVerified, ipVerified, photoVerified,
            verified,
            isSuspicious: spoofCheck.isSuspicious,
            suspiciousReasons: spoofCheck.reasons,
            isLate,
            userComment: comment
        });

        await attendance.save();

        return successResponse(res, 'Check-in processed', {
            verified,
            factors,
            suspicious: spoofCheck.isSuspicious,
            reasons: spoofCheck.reasons,
            attendanceId: attendance._id,
            isLate,
            faceVerification: faceVerificationDetails,
        });

    } catch (error) {
        logger.error({ error, userId: req.user?.id }, 'Check-in failed');
        return errorResponse(res, 'Check-in failed', error);
    }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
    try {
        const { lat, lng, accuracy, comment } = req.body;
        const user = req.user;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        // Time Check - Flag as Early if before 17:00 (5:00 PM)
        const now = new Date();
        const hour = now.getHours();
        const isEarlyLeave = hour < 17;

        const attendance = new Attendance({
            userId: user.id,
            type: 'check-out',
            method: 'GPS',
            location: {
                lat: Number(lat),
                lng: Number(lng),
                accuracyMeters: Number(accuracy)
            },
            timestamp: now,
            isEarlyLeave,
            userComment: comment
        });

        await attendance.save();

        return successResponse(res, 'Check-out processed', {
            isEarlyLeave,
            timestamp: now
        });
    } catch (error) {
        return errorResponse(res, 'Check-out failed', error);
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }
        const history = await Attendance.find({ userId: req.user.id }).sort({ timestamp: -1 });
        return successResponse(res, 'Attendance history retrieved', history);
    } catch (error) {
        return errorResponse(res, 'Error fetching history', error);
    }
};
