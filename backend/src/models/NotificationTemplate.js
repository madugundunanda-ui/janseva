const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  translations: {
    type: Map,
    of: {
      title: String,
      message: String
    },
    required: true
  },
  defaultChannels: [{
    type: String,
    enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']
  }],
  requiredChannels: [{
    type: String,
    enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
