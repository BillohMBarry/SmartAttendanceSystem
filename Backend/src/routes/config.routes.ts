import { Router } from 'express';
import config from '../config/config.js';

const router = Router();

router.get('/', (req, res) => {
    res.json({
        publicUrl: config.publicUrl || null
    });
});

export default router;
