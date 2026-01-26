import ngrok from '@ngrok/ngrok';
import dotenv from 'dotenv';
import { logger } from '../middleware/logger.js';
dotenv.config();

let currentListener: any = null;

// Graceful shutdown handler
process.on('SIGINT', async () => {
    if (currentListener) {
        await currentListener.close();
        logger.info('Ngrok tunnel closed gracefully');
    }
    process.exit(0);
});

const listenNgrok = async (port: number) => {
    const authToken = process.env.NGROK_AUTH_TOKEN;
    if (!authToken) {
        throw new Error('NGROK_AUTH_TOKEN environment variable is required to start ngrok');
    }

    try {
        // Close any existing listener first
        if (currentListener) {
            await currentListener.close();
            logger.info('Closed previous ngrok tunnel');
        }

        // Create a tunnel using the new @ngrok/ngrok API
        const listener = await ngrok.connect({
            addr: port,
            authtoken: authToken,
        });

        currentListener = listener;
        const url = listener.url();
        logger.info({ url }, `Ngrok tunnel started at: ${url}`);
        return url;
    } catch (error: any) {
        if (error.errorCode === 'ERR_NGROK_334') {
            logger.error('Ngrok tunnel already exists. Please stop all running node processes and try again.');
            process.exit(1);
        }
        throw error;
    }
}

export default listenNgrok;