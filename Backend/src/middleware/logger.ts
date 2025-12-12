import pino from 'pino';
import type { Request, Response } from 'express';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Create base pino logger with conditional transport
const loggerOptions: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        env: process.env.NODE_ENV || 'development',
    },
};

// Add pretty transport only in development
if (isDevelopment) {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
        }
    };
}

// Create base pino logger
export const logger = pino(loggerOptions);

// HTTP request logger middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
    const start = Date.now();

    // Attach logger to request
    (req as any).log = logger;

    // Hook into response finish to log
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userId = (req as any).user?.id || 'guest';

        const logData = {
            request: {
                method: req.method,
                url: req.originalUrl,
                query: req.query,
                params: req.params,
                userId,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
            response: {
                statusCode: res.statusCode,
            },
            duration: `${duration}ms`,
        };

        // Log at appropriate level based on status code
        if (res.statusCode >= 500) {
            logger.error(logData, `${req.method} ${req.originalUrl} - ${res.statusCode}`);
        } else if (res.statusCode >= 400) {
            logger.warn(logData, `${req.method} ${req.originalUrl} - ${res.statusCode}`);
        } else {
            logger.info(logData, `${req.method} ${req.originalUrl} - ${res.statusCode}`);
        }
    });

    next();
};
