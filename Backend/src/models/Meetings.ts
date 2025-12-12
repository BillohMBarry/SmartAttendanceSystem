import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    createdBy: mongoose.Types.ObjectId;
    attendees: mongoose.Types.ObjectId[];
    location: string;
    type: 'weekly' | 'one-time';
}

const MeetingSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    location: { type: String }, // e.g., 'Conference Room A' or 'Online'
    type: { type: String, enum: ['weekly', 'one-time'], default: 'one-time' }
}, { timestamps: true });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
