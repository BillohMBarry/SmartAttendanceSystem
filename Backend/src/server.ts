import app from './app.js';
import listenNgrok from './config/ngrok.config.js';
import config from './config/config.js';
import { connectToDatabase } from './mongoDBConnection/mongodb.js';
import { logger } from './middleware/logger.js';
import { rekognitionService } from './services/rekognition.service.js';



const startServer = async () => {
    try {
        await connectToDatabase();

        // Initialize AWS Rekognition collection
        // Initialize ngrok only in development or if explicitly disabled in production
        if (config.nodeEnv !== 'production') {
            const ngrokUrl = await listenNgrok(config.port);
            config.publicUrl = ngrokUrl || '';
        }

        // Initialize AWS Rekognition collection
        try {
            await rekognitionService.initializeCollection();
            logger.info('AWS Rekognition collection initialized');
        } catch (error) {
            logger.warn({ error }, 'Failed to initialize AWS Rekognition collection. Face recognition features may be unavailable.');
        }

        app.listen(config.port, () => {
            logger.info({ port: config.port }, `Server is running on http://localhost:${config.port}`);
        })
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }

}

startServer()