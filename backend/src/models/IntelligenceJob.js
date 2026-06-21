const mongoose = require('mongoose');

const intelligenceJobSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  articlesProcessed: {
    type: Number,
    default: 0
  },
  errors: [{
    type: String
  }]
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model('IntelligenceJob', intelligenceJobSchema);
