const mongoose = require('mongoose');

const voiceConversationSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    language: {
      type: String,
      required: true,
      default: 'en-IN'
    },
    intent: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'paused', 'completed', 'abandoned'],
      index: true
    },
    deviceType: { type: String },
    platform: { type: String },
    browserInfo: { type: String },
    ipAddress: { type: String },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
    totalTurns: { type: Number, default: 0 },
    voiceInputCount: { type: Number, default: 0 },
    textInputCount: { type: Number, default: 0 },
    voiceOutputCount: { type: Number, default: 0 },
    aiInteractions: { type: Number, default: 0 },
    sessionMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    contextData: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('VoiceConversationSession', voiceConversationSessionSchema);
