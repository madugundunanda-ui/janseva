const mongoose = require('mongoose');

const notificationInsightSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalSent: {
    type: Number,
    default: 0
  },
  totalDelivered: {
    type: Number,
    default: 0
  },
  totalFailed: {
    type: Number,
    default: 0
  },
  totalRead: {
    type: Number,
    default: 0
  },
  mostOpenedNotificationCode: {
    type: String
  },
  mostIgnoredNotificationCode: {
    type: String
  },
  deliverySuccessPercentage: {
    type: Number,
    default: 0
  },
  readRatePercentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationInsight', notificationInsightSchema);
