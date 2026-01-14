import mongoose, { Schema, Document } from 'mongoose';

export interface IJobTitle extends Document {
    value: string;
    label: string;
    createdAt: Date;
    updatedAt: Date;
}

const JobTitleSchema: Schema = new Schema({
    value: { type: String, required: true, unique: true },
    label: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IJobTitle>('JobTitle', JobTitleSchema);
