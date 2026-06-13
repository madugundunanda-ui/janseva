const { Notification, NotificationTemplate, NotificationPreference, NotificationAuditLog, User, UserLanguagePreference } = require('../models');
const logger = require('../utils/logger');
const eventBus = require('./eventBus');
const notificationQueue = require('./notificationQueue');

// We need a reference to the global socket.io instance
let ioInstance = null;

const setSocketIoInstance = (io) => {
  ioInstance = io;
};

// Extremely simple templating replacing {{key}} with value
const renderTemplate = (templateStr, data) => {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

const sendNotification = async ({ eventName, recipientId, data, referenceId, referenceType, priorityOverride }) => {
  try {
    // 1. Find template
    const template = await NotificationTemplate.findOne({ code: eventName });
    if (!template) {
      logger.warn(`[NotificationService] No template found for event: ${eventName}`);
      return;
    }

    // 2. Determine User Language
    let lang = 'en';
    const langPref = await UserLanguagePreference.findOne({ userId: recipientId });
    if (langPref && langPref.uiLanguage) {
      lang = langPref.uiLanguage;
    }

    let translation = template.translations.get(lang);
    
    // Sub-second Translation Fallback (NO AI AT RUNTIME)
    if (!translation) {
      logger.info(`[NotificationService] Missing template translation for ${lang}, falling back to English...`);
      translation = template.translations.get('en');
    }

    if (!translation) {
      logger.error(`[NotificationService] Completely missing translation for event: ${eventName}`);
      return;
    }

    const compiledTitle = renderTemplate(translation.title, data);
    const compiledMessage = renderTemplate(translation.message, data);
    const priority = priorityOverride || template.priority;

    // 3. Check Preferences
    let sendInApp = template.defaultChannels.includes('IN_APP');
    
    // Critical priority ignores user preferences
    if (priority !== 'Critical') {
      const userPref = await NotificationPreference.findOne({ userId: recipientId });
      if (userPref && userPref.inAppEnabled === false) {
        sendInApp = false;
      }
    } else {
      sendInApp = true; // Force delivery for critical
    }

    if (!sendInApp) {
      logger.info(`[NotificationService] User ${recipientId} opted out of IN_APP for event ${eventName}`);
      return;
    }

    // 4. Save Notification to Database
    const notification = await Notification.create({
      recipientId,
      title: compiledTitle,
      message: compiledMessage,
      priority,
      referenceId,
      referenceType,
      channel: 'IN_APP'
    });

    let deliveryStatus = 'Pending';
    let errorMsg = '';

    // 5. Send via Socket.IO
    if (ioInstance) {
      try {
        const payload = {
          id: notification._id,
          title: compiledTitle,
          message: compiledMessage,
          priority,
          referenceId,
          referenceType,
          timestamp: notification.createdAt,
          read: false
        };
        
        ioInstance.to(`user_${recipientId.toString()}`).emit('notification', payload);
        deliveryStatus = 'Delivered';
        logger.info(`[NotificationService] Delivered via WebSocket to user_${recipientId}`);
      } catch (wsErr) {
        logger.error(`[NotificationService] WebSocket Delivery Failed: ${wsErr.message}`);
        deliveryStatus = 'Failed';
        errorMsg = wsErr.message;
      }
    } else {
      deliveryStatus = 'Failed';
      errorMsg = 'Socket.IO not initialized';
      logger.warn('[NotificationService] Socket.IO instance not provided, cannot deliver live.');
    }

    // 6. Audit Logging
    await NotificationAuditLog.create({
      recipientId,
      notificationCode: eventName,
      channel: 'IN_APP',
      status: deliveryStatus,
      errorMessage: errorMsg,
      payload: data
    });

  } catch (err) {
    logger.error(`[NotificationService] Core failure: ${err.message}`);
  }
};

// Bind NotificationQueue to our send logic
notificationQueue.process(sendNotification);

// Bind EventBus listeners to the Queue
const bindListeners = () => {
  eventBus.on('ComplaintCreated', (payload) => {
    notificationQueue.add({
      eventName: 'COMPLAINT_CREATED',
      recipientId: payload.citizenId,
      data: { id: payload.complaintId },
      referenceId: payload.complaintId,
      referenceType: 'Complaint',
      priorityOverride: 'Medium'
    });
  });

  eventBus.on('ComplaintStatusUpdated', (payload) => {
    notificationQueue.add({
      eventName: 'COMPLAINT_STATUS_UPDATE',
      recipientId: payload.citizenId,
      data: { id: payload.complaintId, status: payload.status },
      referenceId: payload.complaintId,
      referenceType: 'Complaint',
      priorityOverride: 'High'
    });
  });

  eventBus.on('EmergencyAlert', (payload) => {
    notificationQueue.add({
      eventName: 'EMERGENCY_ALERT',
      recipientId: payload.recipientId,
      data: payload.data,
      referenceId: payload.referenceId,
      referenceType: 'Emergency',
      priorityOverride: 'Critical' // Bypasses queue
    });
  });
  
  eventBus.on('GovernanceInsightGenerated', async (insight) => {
    // Fetch all admins and supervisors for this tenant
    const { User } = require('../models');
    const notifyUsers = await User.find({ 
      role: { $in: ['admin', 'supervisor'] },
      tenantId: insight.tenantId,
      activeStatus: true 
    }).select('_id');

    notifyUsers.forEach(user => {
      notificationQueue.add({
        eventName: 'GOVERNANCE_INSIGHT',
        recipientId: user._id,
        data: { title: insight.title, description: insight.description, severity: insight.severity },
        referenceId: insight._id,
        referenceType: 'GovernanceInsight',
        priorityOverride: insight.severity === 'Critical' ? 'Critical' : 'High'
      });
    });
  });

  // Example: General announcement to many users. 
  // In reality, you might fetch a list of users or use a topic-based push strategy.
};

// Initialize listeners on startup
bindListeners();

module.exports = {
  setSocketIoInstance,
  sendNotification,
  renderTemplate
};
