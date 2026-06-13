const mongoose = require('mongoose');

const deadLetterQueueSchema = new mongoose.Schema({
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
  consumer: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  errorReason: {
    type: String,
    required: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PendingReview', 'Resolved', 'Ignored'],
    default: 'PendingReview'
  }
}, { timestamps: true });

// Custom collection name as requested
module.exports = mongoose.model('DeadLetterQueue', deadLetterQueueSchema, 'janseva-dlq');
