import { Router } from 'express';
import * as qrController from '../controllers/qr.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateQRTokenSchema } from '../utils/validation.js';

const router = Router();

router.post('/validate', authenticateToken, validate(validateQRTokenSchema), qrController.validateToken);

export default router;
