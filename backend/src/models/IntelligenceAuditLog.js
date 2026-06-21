const mongoose = require('mongoose');

const intelligenceAuditLogSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntelligenceJob',
    required: true,
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UpdateSource',
    required: true,
    index: true
  },
  sourceName: {
    type: String,
    required: true
  },
  articlesFetched: {
    type: Number,
    default: 0
  },
  articlesProcessed: {
    type: Number,
    default: 0
  },
  duplicatesSkipped: {
    type: Number,
    default: 0
  },
  errors: [{
    type: String
  }],
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model('IntelligenceAuditLog', intelligenceAuditLogSchema);
