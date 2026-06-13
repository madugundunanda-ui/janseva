const mongoose = require('mongoose');

const voiceInteractionAnalyticSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceConversationSession',
      index: true
    },
    metricType: { type: String },
    metricValue: { type: Number },
    metricUnit: { type: String },
    deviceType: { type: String },
    browserType: { type: String },
    success: { type: Boolean },
    durationMs: { type: Number },
    errorType: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

voiceInteractionAnalyticSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VoiceInteractionAnalytic', voiceInteractionAnalyticSchema);
