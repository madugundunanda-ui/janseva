const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceType: {
    type: String,
    enum: ['Complaint', 'Announcement', 'System', 'General'],
    default: 'General'
  },
  channel: {
    type: String,
    enum: ['IN_APP', 'EMAIL', 'SMS'],
    default: 'IN_APP'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
