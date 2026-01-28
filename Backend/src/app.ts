import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import adminRoutes from './routes/admin.routes.js';
import qrRoutes from './routes/qr.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import faceRoutes from './routes/face.routes.js';
import jobRoutes from './routes/job.routes.js';
import configRoutes from './routes/config.routes.js';
import qrScanRoutes from './routes/qr-scan.routes.js';
import { requestLogger, logger } from './middleware/logger.js';
import { handleMulterError } from './middleware/multerErrorHandler.js';
import { errorResponse } from './utils/response.js';
import type { Request, Response, NextFunction } from 'express';

const app = express();

// Security Middleware - Apply helmet first for security headers
app.use(helmet());

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// QR Scan Routes (public, at root level)
app.use('/', qrScanRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/jobs', jobRoutes); // Added jobRoutes
app.use('/api/config', configRoutes);

app.get('/', (req, res) => {
    res.send('Attendance System API is running.');
});

// Error handling middleware (must be after routes)
app.use(handleMulterError);

// Generic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    }, 'Unhandled error');
    return errorResponse(
        res,
        'Internal server error',
        process.env.NODE_ENV === 'development' ? { error: err.message, stack: err.stack } : {},
        500
    );
});

export default app;