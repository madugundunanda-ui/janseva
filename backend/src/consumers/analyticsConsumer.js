const eventBus = require('../services/eventBus');
const analyticsCronManager = require('../services/analyticsCronManager');
const departmentPerformanceEngine = require('../services/departmentPerformanceEngine');
const officerPerformanceEngine = require('../services/officerPerformanceEngine');
const logger = require('../utils/logger');

const initAnalyticsConsumer = () => {
  const handleAnalyticsUpdate = async (eventData) => {
    const { eventType, payload } = eventData;
    
    // Fire and forget recalculations
    // We queue recalculations or run them asynchronously
    logger.info(`[AnalyticsConsumer] Processing ${eventType}`);
    
    switch (eventType) {
      case 'ComplaintCreated':
      case 'ComplaintResolved':
        if (payload.departmentId) {
          await departmentPerformanceEngine.recalculateDepartmentPerformance(payload.departmentId);
        }
        break;
      case 'ComplaintAssigned':
      case 'ComplaintVerified':
        if (payload.officerId) {
          await officerPerformanceEngine.recalculateOfficerPerformance(payload.officerId);
        }
        break;
      case 'FeedbackSubmitted':
        if (payload.officerId) {
          await officerPerformanceEngine.recalculateOfficerPerformance(payload.officerId);
        }
        if (payload.departmentId) {
          await departmentPerformanceEngine.recalculateDepartmentPerformance(payload.departmentId);
        }
        break;
      case 'EmergencyDetected':
        // Perhaps trigger a high-priority metrics update
        break;
    }
  };

  eventBus.subscribe('ComplaintCreated', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('ComplaintAssigned', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('ComplaintResolved', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('ComplaintVerified', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('EmergencyDetected', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('FeedbackSubmitted', 'AnalyticsConsumer', handleAnalyticsUpdate);
  eventBus.subscribe('UserRegistered', 'AnalyticsConsumer', handleAnalyticsUpdate);

  logger.info('[AnalyticsConsumer] Initialized and subscribed to EventBus');
};

module.exports = { initAnalyticsConsumer };
