import mongoose from "mongoose";

const officeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radiusMeters: { type: Number, default: 80 },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    jobTitle: { type: String }, // User's job role
    photoUrl: { type: String },
    office: { type: officeSchema, required: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);