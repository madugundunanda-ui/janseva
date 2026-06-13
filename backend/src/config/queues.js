const { Queue } = require('bullmq');
const redisConfig = require('./redis');
const logger = require('../utils/logger');

// Store all initialized queues
const queues = {};

/**
 * Get a bullmq Queue instance, falling back to memory mock if redis is unavailable.
 */
const getQueue = (queueName) => {
  if (queues[queueName]) return queues[queueName];

  if (redisConfig.getIsRedisAvailable() && redisConfig.getClient()) {
    try {
      const queue = new Queue(queueName, {
        connection: redisConfig.getClient()
      });
      queues[queueName] = queue;
      logger.info(`[Queues] Initialized BullMQ queue: ${queueName}`);
      return queue;
    } catch (err) {
      logger.error(`[Queues] Failed to initialize BullMQ queue ${queueName}`, err);
    }
  }

  // Fallback memory queue
  logger.warn(`[Queues] Using memory fallback queue for: ${queueName}`);
  const fallbackQueue = {
    add: async (name, data, opts) => {
      logger.info(`[Memory Queue] Enqueued job ${name} on ${queueName}`);
      // If we implement memory workers, we'd emit an event here.
      return { id: `mem-${Date.now()}`, name, data };
    },
    getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }),
  };
  queues[queueName] = fallbackQueue;
  return fallbackQueue;
};

// Define Core Queues
const aiAnalysisQueue = getQueue('ai-analysis-queue');
const notificationQueue = getQueue('notification-queue');
const analyticsQueue = getQueue('analytics-queue');
const intelligenceQueue = getQueue('intelligence-queue');

module.exports = {
  getQueue,
  aiAnalysisQueue,
  notificationQueue,
  analyticsQueue,
  intelligenceQueue,
  getAllQueues: () => queues
};
