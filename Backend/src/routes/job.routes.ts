import { Router } from 'express';
import { getJobTitles } from '../controllers/job.controller.js';

const router = Router();

router.get('/', getJobTitles);

export default router;
