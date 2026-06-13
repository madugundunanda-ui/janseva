const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  inAppEnabled: {
    type: Boolean,
    default: true
  },
  emailEnabled: {
    type: Boolean,
    default: false
  },
  smsEnabled: {
    type: Boolean,
    default: false
  },
  whatsappEnabled: {
    type: Boolean,
    default: false
  },
  emergencyOverride: {
    type: Boolean,
    default: true // Cannot be disabled by user
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
