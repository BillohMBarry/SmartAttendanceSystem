/**
 * @fileoverview TypeScript type definitions for the Attendance System.
 * These types mirror the backend data models for type-safe API interactions.
 */

// =============================================================================
// User Types
// =============================================================================

/**
 * Office location configuration for geo-fencing
 */
export interface Office {
    _id?: string;
    name: string;
    location: string;
    lat: number;
    lng: number;
    radiusMeters: number;
    employees?: string[];
}

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'employee';

/**
 * User profile data
 */
export interface User {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: UserRole;
    jobTitle?: string;
    photoUrl?: string;
    office?: Office;
    isActive: boolean;
    // Face recognition fields
    faceId?: string;
    faceImageUrl?: string;
    faceRegistered: boolean;
    faceRegisteredAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Login response from the API
 */
export interface LoginResponse {
    token: string;
    user: Pick<User, '_id' | 'name' | 'role' | 'office'>;
}

/**
 * Register user request payload
 */
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    jobTitle?: string;
    office?: Office;
}

/**
 * Update profile request payload
 */
export interface UpdateProfileRequest {
    name?: string;
    jobTitle?: string;
}

/**
 * Decoded JWT token payload
 */
export interface TokenPayload {
    id: string;
    role: UserRole;
    email: string;
    exp: number;
    iat: number;
}

// =============================================================================
// Attendance Types
// =============================================================================

/**
 * Attendance record type
 */
export type AttendanceType = 'check-in' | 'check-out';

/**
 * Verification method used for attendance
 */
export type AttendanceMethod = 'GPS' | 'QR' | 'Face' | 'IP' | 'MANUAL';

/**
 * Location data for attendance records
 */
export interface Location {
    lat: number;
    lng: number;
    accuracyMeters: number;
}

/**
 * Verification factors for MFA attendance check
 */
export interface VerificationFactors {
    gpsVerified: boolean;
    qrVerified: boolean;
    ipVerified: boolean;
    photoVerified: boolean;
    faceVerified?: boolean;
}

/**
 * Attendance record from the database
 */
export interface Attendance {
    _id: string;
    userId: string | User;
    timestamp: string;
    type: AttendanceType;
    method: AttendanceMethod;
    location?: Location;
    ipAddress?: string;
    deviceInfo?: Record<string, unknown>;
    photoUrl?: string;
    qrTokenId?: string;
    // Verification flags
    gpsVerified: boolean;
    qrVerified: boolean;
    ipVerified: boolean;
    photoVerified: boolean;
    verified: boolean;
    // Status flags
    isLate: boolean;
    isEarlyLeave: boolean;
    userComment?: string;
    // Spoofing detection
    isSuspicious: boolean;
    suspiciousReasons?: string[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Check-in request payload
 */
export interface CheckInRequest {
    lat: number;
    lng: number;
    accuracy: number;
    qrToken?: string;
    comment?: string;
    photo?: File;
}

/**
 * Check-in response from the API
 */
export interface CheckInResponse {
    verified: boolean;
    factors: VerificationFactors;
    suspicious: boolean;
    reasons: string[];
    attendanceId: string;
    isLate: boolean;
    faceVerification?: {
        matched: boolean;
        similarity: number;
        confidence: number;
    };
}

/**
 * Check-out request payload
 */
export interface CheckOutRequest {
    lat: number;
    lng: number;
    accuracy: number;
    comment?: string;
}

/**
 * Check-out response from the API
 */
export interface CheckOutResponse {
    isEarlyLeave: boolean;
    timestamp: string;
}

// =============================================================================
// Face Recognition Types
// =============================================================================

/**
 * Face registration response
 */
export interface FaceRegistrationResponse {
    faceId: string;
    confidence: number;
    imageUrl: string;
}

/**
 * Face verification response
 */
export interface FaceVerificationResponse {
    matched: boolean;
    similarity: number;
    confidence: number;
}

/**
 * Face status response
 */
export interface FaceStatus {
    faceRegistered: boolean;
    faceRegisteredAt?: string;
    faceImageUrl?: string;
    rekognitionAvailable: boolean;
}

// =============================================================================
// Meeting Types
// =============================================================================

/**
 * Meeting type
 */
export type MeetingType = 'weekly' | 'one-time';

/**
 * Meeting data
 */
export interface Meeting {
    _id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    createdBy: string | Pick<User, '_id' | 'name'>;
    attendees: Array<Pick<User, '_id' | 'name' | 'email' | 'jobTitle'>>;
    location?: string;
    type: MeetingType;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Create meeting request payload
 */
export interface CreateMeetingRequest {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location?: string;
    type?: MeetingType;
}

/**
 * Update meeting request payload
 */
export interface UpdateMeetingRequest extends Partial<CreateMeetingRequest> { }

// =============================================================================
// Admin Types
// =============================================================================

/**
 * QR token data
 */
export interface QRToken {
    token: string;
    officeId: string;
    expiresAt: number;
}

/**
 * Generate QR token request
 * No fields required - office ID comes from authenticated admin's user record
 * Expiration time is automatically calculated to expire at 5 PM (office closing time)
 */
export interface GenerateQRTokenRequest {
    // Empty - all data comes from authenticated user
}

/**
 * Daily report summary
 */
export interface DailyReportSummary {
    totalCheckIns: number;
    lateCheckIns: number;
    earlyCheckOuts: number;
    totalRecords: number;
}

/**
 * Daily report response
 */
export interface DailyReport {
    summary: DailyReportSummary;
    records: Attendance[];
}

// =============================================================================
// QR Token Types
// =============================================================================

/**
 * Validate QR token request payload
 */
export interface ValidateQRTokenRequest {
    token: string;
}

/**
 * Decoded QR token data
 */
export interface DecodedQRTokenData {
    officeId: string;
    generatedBy: string;
    iat: number;
    exp: number;
}

/**
 * Validate QR token response
 */
export interface ValidateQRTokenResponse {
    valid: boolean;
    data?: DecodedQRTokenData;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
}

/**
 * Standard API error response
 */
export interface ApiError {
    success: false;
    message: string;
    error?: unknown;
}
