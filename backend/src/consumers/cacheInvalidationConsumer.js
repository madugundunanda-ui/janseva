const eventBus = require('../services/eventBus');
const { invalidateByPattern } = require('../services/cacheService');
const logger = require('../utils/logger');

const initCacheInvalidator = () => {
  // Complaint Updated -> Invalidate analytics, hotspots, transparency
  eventBus.subscribe('ComplaintUpdated', 'CacheInvalidator', async (eventData) => {
    try {
      await invalidateByPattern('analytics:*');
      await invalidateByPattern('hotspots:*');
      await invalidateByPattern('transparency:*');
      logger.info('[CacheInvalidator] Invalidated analytics, hotspots, and transparency caches on ComplaintUpdated');
    } catch (err) {
      logger.error('Failed to invalidate caches on ComplaintUpdated', err);
    }
  });

  // Complaint Resolved -> Invalidate civic score, department metrics
  eventBus.subscribe('ComplaintResolved', 'CacheInvalidator', async (eventData) => {
    try {
      await invalidateByPattern('analytics:*');
      await invalidateByPattern('civic_score:*');
      await invalidateByPattern('dept_metrics:*');
      await invalidateByPattern('transparency:*');
      logger.info('[CacheInvalidator] Invalidated analytics, civic score, dept metrics, and transparency caches on ComplaintResolved');
    } catch (err) {
      logger.error('Failed to invalidate caches on ComplaintResolved', err);
    }
  });

  // New Government Update -> Invalidate government news cache
  eventBus.subscribe('NewGovernmentUpdate', 'CacheInvalidator', async (eventData) => {
    try {
      await invalidateByPattern('gov_updates:*');
      logger.info('[CacheInvalidator] Invalidated gov_updates caches on NewGovernmentUpdate');
    } catch (err) {
      logger.error('Failed to invalidate caches on NewGovernmentUpdate', err);
    }
  });

  logger.info('[CacheInvalidator] Initialized and subscribed to EventBus');
};

module.exports = { initCacheInvalidator };
