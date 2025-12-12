import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/uploads.js';
import { parseDevice } from '../middleware/device.js';
import { validate } from '../middleware/validate.js';
import { checkInSchema, checkOutSchema } from '../utils/validation.js';

const router = Router();

router.post('/check-in', authenticateToken, upload.single('photo'), parseDevice, validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', authenticateToken, validate(checkOutSchema), attendanceController.checkOut);
router.get('/me/history', authenticateToken, attendanceController.getHistory);

export default router;
