import mongoose from 'mongoose';
import { mongodbUri } from '../config/config.ts';
import { logger } from '../middleware/logger.ts';

export const connectToDatabase = async () => {
    try {
        const MongoDBIntialized = await mongoose.connect(mongodbUri);
        logger.info({ host: MongoDBIntialized.connection.host }, `Connected to MongoDB at ${MongoDBIntialized.connection.host}`);
    } catch (error) {
        logger.error({ error }, 'Error connecting to MongoDB');
        process.exit(1);
    }
}