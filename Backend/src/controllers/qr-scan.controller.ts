import type { Request, Response } from 'express';
import { verifyQRToken } from '../utils/token.js';
import { logger } from '../middleware/logger.js';
import config from '../config/config.js';

/**
 * Handle QR code scan - Unified handler for all QR scans
 * This is a public GET endpoint that users hit when they scan a QR code
 * Redirects to the frontend attendance router with the token
 * The frontend will determine whether to show check-in or check-out based on user's current attendance status
 */
export const handleQRScan = (req: Request, res: Response) => {
    try {
        const { qr_token } = req.query;

        if (!qr_token || typeof qr_token !== 'string') {
            logger.warn('QR scan attempted without token');
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invalid QR Code</title>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 2rem;
                            border-radius: 1rem;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 400px;
                        }
                        h1 { color: #e53e3e; margin: 0 0 1rem 0; }
                        p { color: #4a5568; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Invalid QR Code</h1>
                        <p>The QR code you scanned is invalid or missing a token. Please contact your administrator.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Verify token validity
        const decoded = verifyQRToken(qr_token);
        if (!decoded) {
            logger.warn({ token: qr_token.substring(0, 20) }, 'Invalid or expired QR token scanned');
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Expired QR Code</title>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 2rem;
                            border-radius: 1rem;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 400px;
                        }
                        h1 { color: #e53e3e; margin: 0 0 1rem 0; }
                        p { color: #4a5568; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>⏰ Expired QR Code</h1>
                        <p>This QR code has expired. Please ask your administrator to generate a new one.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Token is valid - redirect to frontend attendance router with the token
        // The attendance router will check authentication and attendance status
        const frontendUrl = config.frontendUrl;
        const redirectUrl = `${frontendUrl}/attendance-router?qr_token=${encodeURIComponent(qr_token)}`;

        logger.info({ officeId: decoded.officeId }, 'Valid QR token scanned, redirecting to attendance router');

        // Return an HTML page that redirects
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redirecting to Attendance</title>
                <meta http-equiv="refresh" content="0;url=${redirectUrl}">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 400px;
                    }
                    h1 { color: #48bb78; margin: 0 0 1rem 0; }
                    p { color: #4a5568; line-height: 1.6; }
                    .spinner {
                        border: 3px solid #e2e8f0;
                        border-top: 3px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 1rem auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Valid QR Code</h1>
                    <div class="spinner"></div>
                    <p>Redirecting you to attendance...</p>
                    <p><a href="${redirectUrl}" style="color: #667eea;">Click here if you are not redirected automatically</a></p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        logger.error({ error }, 'Error handling QR scan');
        return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 400px;
                    }
                    h1 { color: #e53e3e; margin: 0 0 1rem 0; }
                    p { color: #4a5568; line-height: 1.6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⚠️ Error</h1>
                    <p>Something went wrong. Please try again or contact your administrator.</p>
                </div>
            </body>
            </html>
        `);
    }
};

/**
 * Legacy handlers for backward compatibility
 * These redirect to the unified handler
 */
export const handleCheckInScan = handleQRScan;
export const handleCheckOutScan = handleQRScan;
