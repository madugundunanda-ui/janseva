const mongoose = require('mongoose');

const voiceConversationTurnSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceConversationSession',
      required: true,
      index: true
    },
    turnNumber: {
      type: Number,
      required: true
    },
    userInputType: {
      type: String,
      enum: ['voice', 'text', 'button']
    },
    userInputRaw: { type: String },
    userInputProcessed: { type: String },
    userInputLanguage: { type: String },
    speechConfidence: { type: Number },
    detectedIntent: { type: String },
    intentConfidence: { type: Number },
    assistantResponse: { type: String },
    responseLanguage: { type: String },
    responseType: {
      type: String,
      enum: ['text', 'voice', 'combined', 'action']
    },
    ttsGenerated: { type: Boolean, default: false },
    ttsDurationMs: { type: Number },
    userAction: { type: String },
    aiServiceUsed: { type: String },
    aiProcessingTimeMs: { type: Number },
    userSatisfaction: { type: Number, min: -1, max: 5 },
    errorOccurred: { type: Boolean, default: false },
    errorMessage: { type: String },
    turnMetadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('VoiceConversationTurn', voiceConversationTurnSchema);
