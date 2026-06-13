const mongoose = require('mongoose');

const voiceCommandLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceConversationSession',
      index: true
    },
    commandType: { type: String },
    commandRawText: { type: String },
    commandRecognizedText: { type: String },
    commandIntent: { type: String },
    confidenceScore: { type: Number },
    matchedAction: { type: String },
    actionExecuted: { type: Boolean, default: false },
    actionResult: { type: String },
    executionTimeMs: { type: Number },
    languageDetected: { type: String },
    speechDurationMs: { type: Number },
    audioQualityScore: { type: Number },
    errorDetails: { type: String },
    retryCount: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('VoiceCommandLog', voiceCommandLogSchema);
