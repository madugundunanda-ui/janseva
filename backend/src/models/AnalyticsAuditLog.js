const mongoose = require('mongoose');

const analyticsAuditLogSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  engineName: {
    type: String,
    required: true, // e.g. "CivicScoreEngine", "SlaIntelligence"
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    required: true,
  },
  durationMs: {
    type: Number,
    required: true,
  },
  recordsProcessed: {
    type: Number,
    default: 0,
  },
  errorMessage: {
    type: String,
  },
  executionTime: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('AnalyticsAuditLog', analyticsAuditLogSchema);
