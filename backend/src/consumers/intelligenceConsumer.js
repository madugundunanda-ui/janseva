const eventBus = require('../services/eventBus');
const civicIntelligenceService = require('../services/civicIntelligenceService');
const logger = require('../utils/logger');

const initIntelligenceConsumer = () => {
  const handleIntelligenceUpdate = async (eventData) => {
    const { eventType, payload } = eventData;
    logger.info(`[IntelligenceConsumer] Processing ${eventType}`);

    if (eventType === 'ComplaintCreated') {
      if (payload.complaintId) {
        // Find hotspots asynchronously
        await civicIntelligenceService.detectDuplicateOrCluster(payload.complaintId);
      }
    } else if (eventType === 'EmergencyDetected') {
      // Risk engine logic could go here
    }
  };

  eventBus.subscribe('ComplaintCreated', 'IntelligenceConsumer', handleIntelligenceUpdate);
  eventBus.subscribe('EmergencyDetected', 'IntelligenceConsumer', handleIntelligenceUpdate);

  logger.info('[IntelligenceConsumer] Initialized and subscribed to EventBus');
};

module.exports = { initIntelligenceConsumer };
