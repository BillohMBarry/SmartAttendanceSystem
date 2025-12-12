import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
    type: 'check-in' | 'check-out';
    method: 'GPS' | 'QR' | 'Face' | 'IP' | 'MANUAL';
    location: {
        lat: number;
        lng: number;
        accuracyMeters: number;
    };
    ipAddress: string;
    userAgent: string;
    deviceInfo: any;
    photoUrl: string;
    qrTokenId: string;
    gpsVerified: boolean;
    qrVerified: boolean;
    ipVerified: boolean;
    photoVerified: boolean;
    verified: boolean;
    isSuspicious: boolean;
    suspiciousReasons: string[];
    isLate: boolean;
    isEarlyLeave: boolean;
    userComment: string;
    meta: any;
}

const AttendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['check-in', 'check-out'], required: true },
    method: { type: String, enum: ['GPS', 'QR', 'Face', 'IP', 'MANUAL'], default: 'GPS' },
    location: {
        lat: Number,
        lng: Number,
        accuracyMeters: Number
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceInfo: { type: mongoose.Schema.Types.Mixed },
    photoUrl: { type: String },
    qrTokenId: { type: String },

    // MFA Fields
    gpsVerified: { type: Boolean, default: false },
    qrVerified: { type: Boolean, default: false },
    ipVerified: { type: Boolean, default: false },
    photoVerified: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },

    // Status Flags
    isLate: { type: Boolean, default: false },
    isEarlyLeave: { type: Boolean, default: false },
    userComment: { type: String },

    // Spoofing
    isSuspicious: { type: Boolean, default: false },
    suspiciousReasons: [{ type: String }],

    meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);