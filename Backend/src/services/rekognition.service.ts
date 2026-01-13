import {
    CreateCollectionCommand,
    IndexFacesCommand,
    SearchFacesByImageCommand,
    DeleteFacesCommand,
    ListCollectionsCommand,
    DescribeCollectionCommand,
} from '@aws-sdk/client-rekognition';
import { createRekognitionClient, AWS_CONFIG, validateAWSConfig } from '../config/aws.config.js';
import { logger } from '../middleware/logger.js';
import fs from 'fs';
import path from 'path';

export interface FaceRegistrationResult {
    success: boolean;
    faceId?: string | undefined;
    confidence?: number | undefined;
    error?: string | undefined;
}

export interface FaceVerificationResult {
    success: boolean;
    matched: boolean;
    confidence?: number | undefined;
    faceId?: string | undefined;
    similarity?: number | undefined;
    error?: string | undefined;
}

class RekognitionService {
    private client;
    private collectionId: string;
    private isConfigured: boolean;

    constructor() {
        this.isConfigured = validateAWSConfig();
        this.client = this.isConfigured ? createRekognitionClient() : null;
        this.collectionId = AWS_CONFIG.rekognition.collectionId;
    }

    /**
     * Initialize the Rekognition collection if it doesn't exist
     */
    async initializeCollection(): Promise<void> {
        if (!this.isConfigured || !this.client) {
            logger.warn('AWS Rekognition not configured. Skipping collection initialization.');
            return;
        }

        try {
            // Check if collection exists
            const listCommand = new ListCollectionsCommand({});
            const listResponse = await this.client.send(listCommand);

            const collectionExists = listResponse.CollectionIds?.includes(this.collectionId);

            if (!collectionExists) {
                // Create collection
                const createCommand = new CreateCollectionCommand({
                    CollectionId: this.collectionId,
                });
                await this.client.send(createCommand);
                logger.info(`Created Rekognition collection: ${this.collectionId}`);
            } else {
                logger.info(`Rekognition collection already exists: ${this.collectionId}`);
            }

            // Describe collection to get details
            const describeCommand = new DescribeCollectionCommand({
                CollectionId: this.collectionId,
            });
            const describeResponse = await this.client.send(describeCommand);
            logger.info({ collectionDetails: describeResponse }, 'Collection details');
        } catch (error) {
            logger.error({ error }, 'Error initializing Rekognition collection');
            throw error;
        }
    }

    /**
     * Register a face from an image file
     * @param imagePath - Path to the image file
     * @param userId - Unique identifier for the user
     */
    async registerFace(imagePath: string, userId: string): Promise<FaceRegistrationResult> {
        if (!this.isConfigured || !this.client) {
            return {
                success: false,
                error: 'AWS Rekognition not configured',
            };
        }

        try {
            // Read image file
            const imageBuffer = await this.readImageFile(imagePath);

            // Index face in collection
            const command = new IndexFacesCommand({
                CollectionId: this.collectionId,
                Image: {
                    Bytes: imageBuffer,
                },
                ExternalImageId: userId,
                MaxFaces: 1,
                QualityFilter: 'AUTO',
                DetectionAttributes: ['ALL'],
            });

            const response = await this.client.send(command);

            if (!response.FaceRecords || response.FaceRecords.length === 0) {
                return {
                    success: false,
                    error: 'No face detected in the image',
                };
            }

            const faceRecord = response.FaceRecords[0];
            if (!faceRecord) {
                return {
                    success: false,
                    error: 'Failed to extract face record',
                };
            }
            const faceId = faceRecord.Face?.FaceId;
            const confidence = faceRecord.Face?.Confidence;

            if (!faceId) {
                return {
                    success: false,
                    error: 'Failed to extract face ID',
                };
            }

            logger.info({ userId, faceId, confidence }, 'Face registered successfully');

            return {
                success: true,
                faceId,
                confidence: confidence || undefined,
            };
        } catch (error: any) {
            logger.error('Error registering face:', error);
            return {
                success: false,
                error: error.message || 'Failed to register face',
            };
        }
    }

    /**
     * Verify a face from an image against registered faces
     * @param imagePath - Path to the image file to verify
     * @param expectedUserId - Expected user ID to match against
     */
    async verifyFace(imagePath: string, expectedUserId: string): Promise<FaceVerificationResult> {
        if (!this.isConfigured || !this.client) {
            return {
                success: false,
                matched: false,
                error: 'AWS Rekognition not configured',
            };
        }

        try {
            // Read image file
            const imageBuffer = await this.readImageFile(imagePath);

            // Search for matching faces
            const command = new SearchFacesByImageCommand({
                CollectionId: this.collectionId,
                Image: {
                    Bytes: imageBuffer,
                },
                MaxFaces: AWS_CONFIG.rekognition.maxFaces,
                FaceMatchThreshold: AWS_CONFIG.rekognition.similarityThreshold,
            });

            const response = await this.client.send(command);

            if (!response.FaceMatches || response.FaceMatches.length === 0) {
                logger.warn(`No matching face found for user ${expectedUserId}`);
                return {
                    success: true,
                    matched: false,
                    error: 'No matching face found',
                };
            }

            // Check if any match corresponds to the expected user
            const match = response.FaceMatches.find(
                (faceMatch) => faceMatch.Face?.ExternalImageId === expectedUserId
            );

            if (match) {
                const similarity = match.Similarity || 0;
                const faceId = match.Face?.FaceId;

                logger.info({ expectedUserId, similarity, faceId }, 'Face verified successfully');

                return {
                    success: true,
                    matched: true,
                    confidence: match.Face?.Confidence || undefined,
                    faceId: faceId || undefined,
                    similarity,
                };
            } else {
                // Face matched but to a different user
                const topMatch = response.FaceMatches[0];
                if (topMatch) {
                    logger.warn({ expectedUserId, gotUserId: topMatch.Face?.ExternalImageId }, 'Face matched to different user');
                }

                return {
                    success: true,
                    matched: false,
                    error: 'Face does not match the expected user',
                };
            }
        } catch (error: any) {
            logger.error('Error verifying face:', error);
            return {
                success: false,
                matched: false,
                error: error.message || 'Failed to verify face',
            };
        }
    }

    /**
     * Delete a registered face
     * @param faceId - Face ID to delete
     */
    async deleteFace(faceId: string): Promise<boolean> {
        if (!this.isConfigured || !this.client) {
            logger.warn('AWS Rekognition not configured. Cannot delete face.');
            return false;
        }

        try {
            const command = new DeleteFacesCommand({
                CollectionId: this.collectionId,
                FaceIds: [faceId],
            });

            await this.client.send(command);
            logger.info(`Face deleted successfully: ${faceId}`);
            return true;
        } catch (error) {
            logger.error({ error }, 'Error deleting face');
            return false;
        }
    }

    /**
     * Read image file and return as buffer
     * @param imagePath - Path to the image file
     */
    private async readImageFile(imagePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // Check if it's a URL (Cloudinary) or local path
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                // For Cloudinary URLs, we need to fetch the image
                fetch(imagePath)
                    .then(response => response.arrayBuffer())
                    .then(buffer => resolve(Buffer.from(buffer)))
                    .catch(reject);
            } else {
                // Local file
                fs.readFile(imagePath, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            }
        });
    }

    /**
     * Check if Rekognition is configured and available
     */
    isAvailable(): boolean {
        return this.isConfigured;
    }
}

// Export singleton instance
export const rekognitionService = new RekognitionService();
