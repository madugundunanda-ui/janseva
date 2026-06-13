const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { EventAuditLog, DeadLetterQueue } = require('../models');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.MAX_RETRIES = 3;
  }

  /**
   * Publishes an event to the internal bus, standardizing the schema
   * @param {string} eventType 
   * @param {Object} payload 
   * @param {string} source 
   */
  async publish(eventType, payload, source = 'janseva-monolith', version = '1.0') {
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (!eventType || typeof eventType !== 'string') throw new Error('Invalid eventType');
    if (!eventId || typeof eventId !== 'string') throw new Error('Invalid eventId');
    if (!timestamp || typeof timestamp !== 'string') throw new Error('Invalid timestamp');
    if (!version || typeof version !== 'string') throw new Error('Invalid version');
    if (!source || typeof source !== 'string') throw new Error('Invalid source');
    if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
    
    // Standardize Schema
    const standardizedEvent = {
      eventId,
      eventType,
      timestamp,
      version,
      source,
      payload
    };

    try {
      // 1. Audit Log: Event Published
      await EventAuditLog.create({
        eventId,
        eventType,
        status: 'Pending',
        consumer: 'EventBus',
        payloadSnapshot: standardizedEvent
      });

      logger.info(`[EventBus] Published Event: ${eventType} [${eventId}]`);

      // 2. Emit internally
      // Listeners are synchronous, so we emit immediately. But we recommend async listeners.
      this.emit(eventType, standardizedEvent);

    } catch (err) {
      logger.error(`[EventBus] Failed to publish event ${eventType}: ${err.message}`);
    }
  }

  /**
   * Subscribes a consumer with built-in retry and DLQ logic
   * @param {string} eventType 
   * @param {string} consumerName 
   * @param {Function} handler async function processing the event
   */
  subscribe(eventType, consumerName, handler) {
    this.on(eventType, async (eventData) => {
      let attempts = 0;
      let success = false;
      let lastError = null;
      const startTime = Date.now();

      while (attempts < this.MAX_RETRIES && !success) {
        attempts++;
        try {
          await handler(eventData);
          success = true;
          
          // Audit Log: Success
          await EventAuditLog.create({
            eventId: eventData.eventId,
            eventType: eventData.eventType,
            status: 'Consumed',
            consumer: consumerName,
            processingTimeMs: Date.now() - startTime
          });

          logger.info(`[EventBus] Consumer [${consumerName}] successfully processed ${eventType} [${eventData.eventId}]`);
        } catch (err) {
          lastError = err;
          logger.warn(`[EventBus] Consumer [${consumerName}] failed to process ${eventType} [${eventData.eventId}]. Attempt ${attempts}/${this.MAX_RETRIES}. Error: ${err.message}`);
          
          if (attempts < this.MAX_RETRIES) {
            // Exponential backoff
            await new Promise(res => setTimeout(res, Math.pow(2, attempts) * 1000));
          }
        }
      }

      if (!success) {
        logger.error(`[EventBus] Consumer [${consumerName}] exhausted retries for ${eventType} [${eventData.eventId}]. Sending to DLQ.`);
        
        // 1. DLQ
        await DeadLetterQueue.create({
          eventId: eventData.eventId,
          eventType: eventData.eventType,
          consumer: consumerName,
          payload: eventData,
          errorReason: lastError ? lastError.stack : 'Unknown failure',
          retryCount: attempts
        });

        // 2. Audit Log: Terminal Failure
        await EventAuditLog.create({
          eventId: eventData.eventId,
          eventType: eventData.eventType,
          status: 'Failed',
          consumer: consumerName,
          processingTimeMs: Date.now() - startTime,
          failureReason: lastError ? lastError.message : 'Unknown failure'
        });
      }
    });
    
    logger.info(`[EventBus] Consumer [${consumerName}] subscribed to ${eventType}`);
  }
}

// Singleton
const eventBus = new EventBus();

module.exports = eventBus;
