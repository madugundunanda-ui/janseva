const eventBus = require('../services/eventBus');
const { aiAnalysisQueue } = require('../config/queues');
const logger = require('../utils/logger');

const initAiConsumer = () => {
  const handleAiInference = async (eventData) => {
    const { payload } = eventData;
    const { complaintId, file } = payload;
    
    if (!complaintId || !file) {
      logger.warn('[AiConsumer] Missing complaintId or file in ComplaintCreated payload, skipping AI inference');
      return;
    }

    try {
      // Enqueue job to BullMQ
      await aiAnalysisQueue.add('analyze-image', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      logger.info(`[AiConsumer] Enqueued AI analysis job for complaint ${complaintId}`);
    } catch (err) {
      logger.error(`[AiConsumer] Failed to enqueue AI analysis job: ${err.message}`);
    }
  };

  eventBus.subscribe('ComplaintCreated', 'AiConsumer', handleAiInference);
  logger.info('[AiConsumer] Initialized and subscribed to EventBus');
};

module.exports = { initAiConsumer };
