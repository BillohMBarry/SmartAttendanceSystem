import dotenv from 'dotenv';
dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    publicUrl?: string; // Dynamic URL for Ngrok or other tunnel
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    publicUrl: '',
}
export const mongodbUri: string = process.env.Mongodb_Connection_String || 'mongodb://localhost:27017/attendance-system';
// JWT Secret - Required for security
const jwtSecretFromEnv = process.env.JWT_SECRET;
if (!jwtSecretFromEnv) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required. Please set it in your .env file.');
}
export const JWT_SECRET: string = jwtSecretFromEnv;

export default config;