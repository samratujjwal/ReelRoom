import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';
export async function connectDatabase() {
    try {
        if (mongoose.connection.readyState === 1) {
            return true;
        }
        logger.info('Connecting to Successfully MongoDB Atlas ');
        // Race condition with timeout to ensure server starts without hanging if Atlas IP Whitelist is pending
        const connectPromise = mongoose.connect(config.mongoUri, {
            serverSelectionTimeoutMS: 3000
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB Atlas connection timed out (Check Network Access / IP Whitelist on Atlas)')), 3000));
        await Promise.race([connectPromise, timeoutPromise]);
        logger.info(' Successfully connected to MongoDB Atlas database');
        return true;
    }
    catch (err) {
        logger.warn(` MongoDB Atlas Connection failed: ${err.message}`);
        return false;
    }
}
