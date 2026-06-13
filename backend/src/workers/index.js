const { initAiWorker } = require('./aiWorker');
// Other workers will be imported here
const logger = require('../utils/logger');

const initWorkers = () => {
  try {
    initAiWorker();
    logger.info('[Workers] Initialized BullMQ workers');
  } catch (err) {
    logger.error('[Workers] Failed to initialize workers', err);
  }
};

module.exports = initWorkers;
