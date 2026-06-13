const { initNotificationConsumer } = require('./notificationConsumer');
const { initAnalyticsConsumer } = require('./analyticsConsumer');
const { initIntelligenceConsumer } = require('./intelligenceConsumer');
const { initTransparencyConsumer } = require('./transparencyConsumer');
const { initAiConsumer } = require('./aiConsumer');
const { initCacheInvalidator } = require('./cacheInvalidationConsumer');
const logger = require('../utils/logger');

const initConsumers = () => {
  logger.info('[Consumers] Initializing Event-Driven consumers...');
  initNotificationConsumer();
  initAnalyticsConsumer();
  initIntelligenceConsumer();
  initTransparencyConsumer();
  initAiConsumer();
  initCacheInvalidator();
};

module.exports = initConsumers;
