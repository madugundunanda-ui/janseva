const eventBus = require('../services/eventBus');
const notificationQueue = require('../services/notificationQueue');
const logger = require('../utils/logger');

const initNotificationConsumer = () => {
  const handleNotification = async (eventData) => {
    // Standard event payload shape
    const { eventType, payload } = eventData;
    const { complaintId, userId, category, department, priority } = payload;
    
    let templateName = eventType; // Default mapped 1:1, e.g. ComplaintCreated
    
    // Convert generic EDA event to Notification Service payload
    notificationQueue.add({
      eventName: templateName,
      recipientId: userId || payload.citizenId || payload.officerId || 'system',
      metadata: {
        complaintId,
        category,
        department,
        priority,
        ...payload
      }
    });
  };

  eventBus.subscribe('ComplaintCreated', 'NotificationConsumer', handleNotification);
  eventBus.subscribe('ComplaintAssigned', 'NotificationConsumer', handleNotification);
  eventBus.subscribe('ComplaintResolved', 'NotificationConsumer', handleNotification);
  eventBus.subscribe('EmergencyDetected', 'NotificationConsumer', handleNotification);
  eventBus.subscribe('UserRegistered', 'NotificationConsumer', handleNotification);
  eventBus.subscribe('GovernmentUpdatePublished', 'NotificationConsumer', handleNotification);
  
  logger.info('[NotificationConsumer] Initialized and subscribed to EventBus');
};

module.exports = { initNotificationConsumer };
