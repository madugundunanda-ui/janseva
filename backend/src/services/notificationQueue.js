const EventEmitter = require('events');
const logger = require('../utils/logger');

class NotificationQueue extends EventEmitter {
  constructor(concurrency = 5) {
    super();
    this.queue = [];
    this.activeCount = 0;
    this.concurrency = concurrency;
    this.handler = null;
  }

  // Register the processing function
  process(handler) {
    this.handler = handler;
  }

  // Add a task to the queue
  add(task) {
    if (!this.handler) {
      logger.error('[NotificationQueue] Cannot add task, no handler registered.');
      return;
    }

    if (task.priorityOverride === 'Critical') {
      logger.info(`[NotificationQueue] Bypassing queue for Critical event: ${task.eventName}`);
      // Execute immediately (fire and forget for queue purposes, though we catch errors)
      this.handler(task).catch(err => {
        logger.error(`[NotificationQueue] Critical task execution failed: ${err.message}`);
      });
      return;
    }

    this.queue.push(task);
    this._next();
  }

  async _next() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeCount++;
    const task = this.queue.shift();

    try {
      await this.handler(task);
    } catch (err) {
      logger.error(`[NotificationQueue] Task execution failed: ${err.message}`);
    } finally {
      this.activeCount--;
      this._next(); // Try to process next task
    }
  }
}

const notificationQueue = new NotificationQueue(10); // 10 concurrent notification processing limit

module.exports = notificationQueue;
