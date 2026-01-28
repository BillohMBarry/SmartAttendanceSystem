import { Router } from 'express';
import * as qrScanController from '../controllers/qr-scan.controller.js';

const router = Router();

/**
 * Public routes for QR code scanning
 * These are GET routes that users hit when they scan a QR code from their phone
 * No authentication required - token validation happens in the controller
 */
router.get('/check-in', qrScanController.handleCheckInScan);
router.get('/check-out', qrScanController.handleCheckOutScan);

export default router;
