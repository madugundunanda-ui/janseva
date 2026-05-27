const mongoose = require('mongoose');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    // Connection Pool Tuning
    maxPoolSize: isProduction ? 25 : 10,
    minPoolSize: isProduction ? 5 : 2,

    // Timeouts
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,

    // Read Preference (for replica sets)
    ...(isProduction && { readPreference: 'secondaryPreferred' }),

    // Heartbeat
    heartbeatFrequencyMS: 10000,
  };

  // Retry logic with exponential backoff
  const maxRetries = isProduction ? 10 : 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const connection = await mongoose.connect(mongoUri, options);
      logger.info(`MongoDB connected: ${connection.connection.host}`, {
        database: connection.connection.name,
        readyState: connection.connection.readyState,
        maxPoolSize: options.maxPoolSize,
      });

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { message: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting reconnection...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      return;
    } catch (error) {
      retries++;
      const delay = Math.min(1000 * Math.pow(2, retries), 30000); // Max 30s backoff

      logger.error(`MongoDB connection attempt ${retries}/${maxRetries} failed`, {
        message: error.message,
        retryInMs: delay,
      });

      if (retries >= maxRetries) {
        logger.error('MongoDB connection failed after all retries. Exiting.', {
          stack: error.stack,
        });
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
