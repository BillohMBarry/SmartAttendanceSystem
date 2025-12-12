import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, createQRTokenSchema, dailyReportQuerySchema } from '../utils/validation.js';

const router = Router();

// Apply admin guard to all routes
router.use(authenticateToken, requireAdmin);

router.get('/users', adminController.listUsers);
router.post('/users', validate(registerSchema), adminController.createUser);
router.post('/qr-token', validate(createQRTokenSchema), adminController.createQRToken); // Singular consistent with controller
router.get('/qr-tokens', adminController.listQRTokens);
router.get('/attendance/daily', validate(dailyReportQuerySchema, 'query'), adminController.dailyReport);
router.get('/export-csv', adminController.exportCSV);

export default router;
