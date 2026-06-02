const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema(
  {
    imageHash: {
      type: String,
      required: [true, 'Image hash is required'],
      unique: true,
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Analysis results are required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  }
);

module.exports = mongoose.model('AiCache', aiCacheSchema);
