import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import {
    registerFace,
    verifyFace,
    getFaceStatus,
    deleteFace,
} from '../controllers/face.controller.js';

const router = express.Router();

/**
 * @route   POST /api/face/register
 * @desc    Register user's face for facial recognition
 * @access  Private (authenticated users)
 */
router.post('/register', authenticateToken, upload.single('face'), registerFace);

/**
 * @route   POST /api/face/verify
 * @desc    Verify user's face (for testing purposes)
 * @access  Private (authenticated users)
 */
router.post('/verify', authenticateToken, upload.single('face'), verifyFace);

/**
 * @route   GET /api/face/status
 * @desc    Get face registration status for current user
 * @access  Private (authenticated users)
 */
router.get('/status', authenticateToken, getFaceStatus);

/**
 * @route   DELETE /api/face
 * @desc    Delete user's registered face
 * @access  Private (authenticated users)
 */
router.delete('/', authenticateToken, deleteFace);

export default router;
