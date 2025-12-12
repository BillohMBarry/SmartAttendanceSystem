import { Router } from 'express';
import * as meetingController from '../controllers/meeting.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { createMeetingSchema, updateMeetingSchema } from '../utils/validation.js';

const router = Router();

router.use(authenticateToken); // All meeting routes require login

// Admin only routes for managing meetings
router.post('/', requireAdmin, validate(createMeetingSchema), meetingController.createMeeting);
router.put('/:id', requireAdmin, validate(updateMeetingSchema), meetingController.updateMeeting);
router.delete('/:id', requireAdmin, meetingController.deleteMeeting);

// Employees can view meetings
router.get('/', meetingController.listMeetings);
router.get('/:id', meetingController.getMeeting);

export default router;
