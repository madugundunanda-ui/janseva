const mongoose = require('mongoose');

const eventAuditLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Consumed', 'Failed'],
    required: true,
    default: 'Pending'
  },
  consumer: {
    type: String,
    required: true
  },
  processingTimeMs: {
    type: Number
  },
  failureReason: {
    type: String
  },
  payloadSnapshot: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

eventAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

module.exports = mongoose.model('EventAuditLog', eventAuditLogSchema);
