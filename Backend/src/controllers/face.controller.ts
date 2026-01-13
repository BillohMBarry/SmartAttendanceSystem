import type { Response } from 'express';
import type { AuthRequest } from '../types/auth.types.js';
import { User } from '../models/Users.js';
import { rekognitionService } from '../services/rekognition.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../middleware/logger.js';

/**
 * Register a user's face for facial recognition
 * This should be called during account setup when user uploads their selfie
 */
export const registerFace = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const file = req.file;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        if (!file) {
            return errorResponse(res, 'Face image is required', null, 400);
        }

        // Check if Rekognition is available
        if (!rekognitionService.isAvailable()) {
            logger.warn('AWS Rekognition not configured. Face registration skipped.');
            return errorResponse(
                res,
                'Face recognition service is not available',
                null,
                503
            );
        }

        // Find user in database
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        // If user already has a face registered, delete the old one
        if (dbUser.faceId) {
            logger.info(`Deleting existing face for user ${user.id}`);
            await rekognitionService.deleteFace(dbUser.faceId);
        }

        // Register the new face
        const result = await rekognitionService.registerFace(
            file.path,
            user.id.toString()
        );

        if (!result.success) {
            return errorResponse(
                res,
                'Failed to register face',
                { error: result.error },
                400
            );
        }

        // Update user record with face data
        dbUser.faceId = result.faceId || null;
        dbUser.faceImageUrl = file.path;
        dbUser.faceRegistered = true;
        dbUser.faceRegisteredAt = new Date();
        await dbUser.save();

        logger.info({ userId: user.id, faceId: result.faceId, confidence: result.confidence }, 'Face registered successfully');

        return successResponse(res, 'Face registered successfully', {
            faceId: result.faceId,
            confidence: result.confidence,
            imageUrl: file.path,
        });
    } catch (error) {
        logger.error({ error }, 'Error in registerFace');
        return errorResponse(res, 'Failed to register face', error);
    }
};

/**
 * Verify a user's face during check-in
 * This is called when user takes a selfie during attendance check-in
 */
export const verifyFace = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const file = req.file;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        if (!file) {
            return errorResponse(res, 'Face image is required for verification', null, 400);
        }

        // Check if Rekognition is available
        if (!rekognitionService.isAvailable()) {
            logger.warn('AWS Rekognition not configured. Face verification skipped.');
            return successResponse(res, 'Face verification skipped (service unavailable)', {
                verified: false,
                skipped: true,
            });
        }

        // Find user in database
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        // Check if user has registered face
        if (!dbUser.faceRegistered || !dbUser.faceId) {
            return errorResponse(
                res,
                'User has not registered their face. Please register first.',
                null,
                400
            );
        }

        // Verify the face
        const result = await rekognitionService.verifyFace(
            file.path,
            user.id.toString()
        );

        if (!result.success) {
            return errorResponse(
                res,
                'Failed to verify face',
                { error: result.error },
                400
            );
        }

        logger.info({ userId: user.id, matched: result.matched, similarity: result.similarity }, 'Face verification result');

        return successResponse(res, 'Face verification completed', {
            matched: result.matched,
            similarity: result.similarity,
            confidence: result.confidence,
        });
    } catch (error) {
        logger.error({ error }, 'Error in verifyFace');
        return errorResponse(res, 'Failed to verify face', error);
    }
};

/**
 * Get face registration status for the current user
 */
export const getFaceStatus = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        const dbUser = await User.findById(user.id).select(
            'faceRegistered faceRegisteredAt faceImageUrl'
        );

        if (!dbUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        return successResponse(res, 'Face status retrieved', {
            faceRegistered: dbUser.faceRegistered || false,
            faceRegisteredAt: dbUser.faceRegisteredAt,
            faceImageUrl: dbUser.faceImageUrl,
            rekognitionAvailable: rekognitionService.isAvailable(),
        });
    } catch (error) {
        logger.error({ error }, 'Error in getFaceStatus');
        return errorResponse(res, 'Failed to get face status', error);
    }
};

/**
 * Delete user's registered face
 */
export const deleteFace = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return errorResponse(res, 'User not authenticated', null, 401);
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return errorResponse(res, 'User not found', null, 404);
        }

        if (!dbUser.faceId) {
            return errorResponse(res, 'No face registered for this user', null, 400);
        }

        // Delete from Rekognition
        if (rekognitionService.isAvailable()) {
            await rekognitionService.deleteFace(dbUser.faceId);
        }

        // Update user record
        dbUser.faceId = null;
        dbUser.faceImageUrl = null;
        dbUser.faceRegistered = false;
        dbUser.faceRegisteredAt = null;
        await dbUser.save();

        logger.info(`Face deleted successfully for user ${user.id}`);

        return successResponse(res, 'Face deleted successfully');
    } catch (error) {
        logger.error({ error }, 'Error in deleteFace');
        return errorResponse(res, 'Failed to delete face', error);
    }
};
