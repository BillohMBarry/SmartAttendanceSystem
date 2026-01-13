import { z } from 'zod';

// Helper validators
const coordinateValidator = z.number()
    .refine(val => !isNaN(val), 'Must be a valid number')
    .refine(val => isFinite(val), 'Must be a finite number');

const latitudeValidator = coordinateValidator
    .refine(val => val >= -90 && val <= 90, 'Latitude must be between -90 and 90');

const longitudeValidator = coordinateValidator
    .refine(val => val >= -180 && val <= 180, 'Longitude must be between -180 and 180');

const accuracyValidator = coordinateValidator
    .refine(val => val >= 0, 'Accuracy must be a positive number')
    .refine(val => val <= 10000, 'Accuracy seems unreasonably high (max 10000m)');

// Password strength validator
const passwordValidator = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .refine(
        (password) => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter'
    )
    .refine(
        (password) => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter'
    )
    .refine(
        (password) => /[0-9]/.test(password),
        'Password must contain at least one number'
    );

// Auth Validation Schemas
export const loginSchema = z.object({
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email address')
        .toLowerCase()
        .transform(val => val.trim()),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .transform(val => val.trim()),
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .transform(val => val.trim()),
    password: passwordValidator,
    role: z.enum(['admin', 'employee'], {
        message: 'Role must be either "admin" or "employee"'
    }).optional(),
    office: z.string().optional(), // MongoDB ObjectId as string
    jobTitle: z.string()
        .max(100, 'Job title must not exceed 100 characters')
        .optional(),
});

export const updateProfileSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .transform(val => val.trim())
        .optional(),
    jobTitle: z.string()
        .max(100, 'Job title must not exceed 100 characters')
        .optional(),
});

// Attendance Validation Schemas
export const checkInSchema = z.object({
    lat: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(latitudeValidator),
    lng: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(longitudeValidator),
    accuracy: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(accuracyValidator),
    qrToken: z.string().optional(),
    comment: z.string()
        .max(500, 'Comment must not exceed 500 characters')
        .optional(),
});

export const checkOutSchema = z.object({
    lat: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(latitudeValidator),
    lng: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(longitudeValidator),
    accuracy: z.union([z.string(), z.number()])
        .transform(val => Number(val))
        .pipe(accuracyValidator),
    comment: z.string()
        .max(500, 'Comment must not exceed 500 characters')
        .optional(),
});

// Meeting Validation Schemas
export const createMeetingSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must not exceed 200 characters')
        .transform(val => val.trim()),
    description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
    startTime: z.coerce.date({
        message: 'Invalid start time format'
    }),
    endTime: z.coerce.date({
        message: 'Invalid end time format'
    }),
    attendees: z.array(z.string())
        .max(100, 'Cannot have more than 100 attendees')
        .optional(),
    location: z.string()
        .max(200, 'Location must not exceed 200 characters')
        .optional(),
    type: z.enum(['weekly', 'one-time'], {
        message: 'Type must be either "weekly" or "one-time"'
    }).optional(),
}).refine(data => {
    return data.endTime > data.startTime;
}, {
    message: 'End time must be after start time',
    path: ['endTime'],
})

export const updateMeetingSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must not exceed 200 characters')
        .transform(val => val.trim())
        .optional(),
    description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
    startTime: z.coerce.date({
        message: 'Invalid start time format'
    }).optional(),
    endTime: z.coerce.date({
        message: 'Invalid end time format'
    }).optional(),
    attendees: z.array(z.string())
        .max(100, 'Cannot have more than 100 attendees')
        .optional(),
    location: z.string()
        .max(200, 'Location must not exceed 200 characters')
        .optional(),
    type: z.enum(['weekly', 'one-time'], {
        message: 'Type must be either "weekly" or "one-time"'
    }).optional(),
}).refine(data => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
    }
    return true;
}, {
    message: 'End time must be after start time',
    path: ['endTime'],
});

// Admin Validation Schemas
export const createQRTokenSchema = z.object({
    officeId: z.string()
        .min(1, 'Office ID is required'),
    expiresInMinutes: z.number()
        .int('Expiration time must be an integer')
        .min(1, 'Expiration time must be at least 1 minute')
        .max(1440, 'Expiration time cannot exceed 24 hours (1440 minutes)')
        .optional()
        .default(60), // Default to 60 minutes
});

export const dailyReportQuerySchema = z.object({
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .refine(val => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date'),
    startDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
        .optional(),
    endDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
        .optional(),
});

// QR Validation Schema
export const validateQRTokenSchema = z.object({
    token: z.string()
        .min(1, 'Token is required')
        .min(10, 'Token appears to be invalid (too short)')
        .max(500, 'Token appears to be invalid (too long)'),
});

// Face Recognition Validation Schemas
export const registerFaceSchema = z.object({
    // File validation is handled by multer middleware
    // This schema is for any additional fields if needed in the future
});

export const verifyFaceSchema = z.object({
    // File validation is handled by multer middleware
    // This schema is for any additional fields if needed in the future
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CreateQRTokenInput = z.infer<typeof createQRTokenSchema>;
export type DailyReportQueryInput = z.infer<typeof dailyReportQuerySchema>;
export type ValidateQRTokenInput = z.infer<typeof validateQRTokenSchema>;
export type RegisterFaceInput = z.infer<typeof registerFaceSchema>;
export type VerifyFaceInput = z.infer<typeof verifyFaceSchema>;
