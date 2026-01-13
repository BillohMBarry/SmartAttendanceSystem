import { RekognitionClient } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

dotenv.config();

// AWS Configuration
export const AWS_CONFIG = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    rekognition: {
        collectionId: process.env.AWS_REKOGNITION_COLLECTION_ID || 'attendance-faces',
        similarityThreshold: parseFloat(process.env.AWS_REKOGNITION_SIMILARITY_THRESHOLD || '90'),
        maxFaces: parseInt(process.env.AWS_REKOGNITION_MAX_FACES || '1'),
    }
};

// Validate AWS configuration
export const validateAWSConfig = (): boolean => {
    if (!AWS_CONFIG.credentials.accessKeyId || !AWS_CONFIG.credentials.secretAccessKey) {
        console.warn('AWS credentials not configured. Face recognition features will be disabled.');
        return false;
    }
    return true;
};

// Create Rekognition Client
export const createRekognitionClient = (): RekognitionClient => {
    return new RekognitionClient({
        region: AWS_CONFIG.region,
        credentials: AWS_CONFIG.credentials,
    });
};
