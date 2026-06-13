const mongoose = require('mongoose');

const notificationAuditLogSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  notificationCode: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
    required: true
  },
  status: {
    type: String,
    enum: ['Delivered', 'Failed', 'Pending'],
    required: true
  },
  errorMessage: {
    type: String
  },
  payload: {
    type: mongoose.Schema.Types.Mixed // The actual data sent
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationAuditLog', notificationAuditLogSchema);
