import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/Users.js';
import { mongodbUri } from '../config/config.js';
import { logger } from '../middleware/logger.js';

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongodbUri);
        logger.info('Connected to MongoDB for seeding');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            logger.info('Admin user already exists');
            process.exit(0);
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash('password123', 10);

        const adminUser = new User({
            name: 'System Admin',
            email: 'admin@example.com',
            passwordHash: hashedPassword,
            role: 'admin',
            jobTitle: 'System Administrator',
            office: {
                name: 'Headquarters',
                location: 'Main Office',
                lat: 8.48379,
                lng: -13.25474,
                radiusMeters: 100
            },
            isActive: true
        });

        await adminUser.save();
        logger.info('Admin user created successfully');
        logger.info('Email: admin@example.com');
        logger.info('Password: password123');

        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error seeding admin user');
        process.exit(1);
    }
};

seedAdmin();
