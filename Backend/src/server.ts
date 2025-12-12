import app from './app.js';
import config from './config/config.js';
import { connectToDatabase } from './mongoDBConnection/mongodb.js';
import { logger } from './middleware/logger.js';



const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(config.port, () => {
            logger.info({ port: config.port }, `Server is running on http://localhost:${config.port}`);
        })
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }

}

startServer()