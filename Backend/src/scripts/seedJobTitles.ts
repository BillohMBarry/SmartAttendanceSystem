import mongoose from 'mongoose';
import { mongodbUri } from '../config/config.js';
import JobTitle from '../models/jobTitle.model.js';

const JOB_TITLES = [
    { value: 'softwareEngineer', label: 'Software Engineer' },
    { value: 'marketer', label: 'Marketer' },
    { value: 'intern', label: 'Intern' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'developer', label: 'Developer' },
];

const seedJobTitles = async () => {
    try {
        if (!mongodbUri) {
            throw new Error('MONGODB_URI is not defined in config');
        }

        await mongoose.connect(mongodbUri);
        console.log('Connected to MongoDB');

        // Check if job titles already exist
        const count = await JobTitle.countDocuments();

        if (count === 0) {
            await JobTitle.insertMany(JOB_TITLES);
            console.log('Job titles seeded successfully');
        } else {
            console.log('Job titles already exist, checking for updates...');
            for (const title of JOB_TITLES) {
                await JobTitle.findOneAndUpdate(
                    { value: title.value },
                    { label: title.label },
                    { upsert: true, new: true }
                );
            }
            console.log('Job titles updated/verified');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding job titles:', error);
        process.exit(1);
    }
};

seedJobTitles();
