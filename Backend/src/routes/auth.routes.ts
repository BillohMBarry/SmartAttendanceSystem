import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, updateProfileSchema } from '../utils/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply rate limiting to login endpoint to prevent brute-force attacks
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/register', authenticateToken, requireAdmin, validate(registerSchema), authController.register);
router.put('/profile', authenticateToken, validate(updateProfileSchema), authController.updateProfile);

export default router;
