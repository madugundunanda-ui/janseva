const mongoose = require('mongoose');

const updateSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['rss', 'scrape', 'api'],
    required: true,
    default: 'rss'
  },
  trustScore: {
    type: Number,
    required: true,
    default: 80,
    min: 0,
    max: 100
  },
  active: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['healthy', 'failed', 'degraded'],
    default: 'healthy'
  },
  failCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UpdateSource', updateSourceSchema);
