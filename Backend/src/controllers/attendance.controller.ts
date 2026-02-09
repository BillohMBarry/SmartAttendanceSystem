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
        const { lat, lng, accuracy, qrToken, comment, stationId } = req.body;
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
        if (ATTENDANCE_CONFIG.OFFICE_IP_RANGES.includes('*') || ATTENDANCE_CONFIG.OFFICE_IP_RANGES.includes(ip)) {
            ipVerified = true;
        }

        // CRITICAL: Enforce strict location check
        // User must be verified by GPS OR IP to check in.
        // We do not strictly require QR if GPS is good (depends on policy), but request was to prevent "checking in from home".
        // Use flag: must be at office (GPS) OR on office network (IP).
        if (!gpsVerified && !ipVerified) {
            logger.warn({ userId: user.id, distance, ip, accuracy: numAcc, gpsVerified, ipVerified }, 'Check-in blocked: Not at office');
            return errorResponse(res, 'Access Denied: You must be at the office to check in.', {
                reason: 'Location verification failed',
                details: {
                    distanceMeters: Math.round(distance),
                    accuracyMeters: numAcc,
                    allowedDistance: ATTENDANCE_CONFIG.MAX_DISTANCE_METERS,
                    allowedAccuracy: ATTENDANCE_CONFIG.MAX_ACCURACY_METERS,
                    ipAddress: ip,
                    isIpVerified: ipVerified,
                    isGpsVerified: gpsVerified
                }
            }, 403);
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
        const { lat, lng, accuracy, qrToken, comment, stationId } = req.body;
        const user = req.user;
        const ip = req.ip || req.socket.remoteAddress || '';

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        const dbUser = await User.findById(user.id)
        if (!dbUser || !dbUser.office) {
            return errorResponse(res, 'User or Office not found', null, 400);
        }

        // 1. GPS Verification
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
        if (ATTENDANCE_CONFIG.OFFICE_IP_RANGES.includes('*') || ATTENDANCE_CONFIG.OFFICE_IP_RANGES.includes(ip)) {
            ipVerified = true;
        }

        // CRITICAL: Strict enforcement
        if (!gpsVerified && !ipVerified) {
            logger.warn({ userId: user.id, distance, ip, accuracy: numAcc, gpsVerified, ipVerified }, 'Check-out blocked: Not at office');
            return errorResponse(res, 'Access Denied: You must be at the office to check out.', {
                reason: 'Location verification failed',
                details: {
                    distanceMeters: Math.round(distance),
                    accuracyMeters: numAcc,
                    allowedDistance: ATTENDANCE_CONFIG.MAX_DISTANCE_METERS,
                    allowedAccuracy: ATTENDANCE_CONFIG.MAX_ACCURACY_METERS,
                    ipAddress: ip,
                    isIpVerified: ipVerified,
                    isGpsVerified: gpsVerified
                }
            }, 403);
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
            ipAddress: ip,
            qrTokenId: qrToken,
            gpsVerified,
            qrVerified,
            ipVerified,
            timestamp: now,
            isEarlyLeave,
            userComment: comment
        });

        await attendance.save();

        return successResponse(res, 'Check-out processed', {
            isEarlyLeave,
            timestamp: now,
            gpsVerified,
            qrVerified,
            ipVerified
        });
    } catch (error) {
        return errorResponse(res, 'Check-out failed', error);
    }
};

export const getAttendanceStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        // Get today's date range (start and end of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find today's attendance records
        const todayRecords = await Attendance.find({
            userId: req.user.id,
            timestamp: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({ timestamp: -1 });

        // Determine current status
        const lastCheckIn = todayRecords.find(r => r.type === 'check-in');
        const lastCheckOut = todayRecords.find(r => r.type === 'check-out');

        let status = 'not-checked-in';
        if (lastCheckIn && !lastCheckOut) {
            status = 'checked-in';
        } else if (lastCheckIn && lastCheckOut) {
            // Compare timestamps to see which is more recent
            if (lastCheckIn.timestamp > lastCheckOut.timestamp) {
                status = 'checked-in';
            } else {
                status = 'checked-out';
            }
        }

        return successResponse(res, 'Attendance status retrieved', {
            status,
            lastCheckIn: lastCheckIn || null,
            lastCheckOut: lastCheckOut || null,
            todayRecords
        });
    } catch (error) {
        return errorResponse(res, 'Error fetching attendance status', error);
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
