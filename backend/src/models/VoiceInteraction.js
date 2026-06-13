const mongoose = require('mongoose');

const voiceInteractionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  language: {
    type: String,
    enum: ['en-IN', 'te-IN', 'ta-IN', 'kn-IN'],
    required: true
  },
  intent: {
    type: String,
    enum: ['RAISE_COMPLAINT', 'TRACK_COMPLAINT', 'VIEW_UPDATES', 'EMERGENCY_HELP', 'MY_COMPLAINTS', 'HELPDESK', 'UNKNOWN'],
    required: true
  },
  transcribedText: {
    type: String,
    required: true
  },
  systemResponse: {
    type: String,
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  latencyMs: {
    type: Number,
    required: true
  },
  workflowName: {
    type: String,
    enum: ['IDLE', 'LANGUAGE_SELECTION', 'MAIN_MENU', 'RAISE_COMPLAINT_IMAGE', 'RAISE_COMPLAINT_DESCRIPTION', 'RAISE_COMPLAINT_CONFIRMATION', 'TRACK_COMPLAINT', 'VIEW_UPDATES', 'EMERGENCY_HELP', 'HELPDESK', 'COMPLETED'],
    default: 'MAIN_MENU'
  },
  completionRate: {
    type: Number,
    default: 0
  },
  abandonmentReason: {
    type: String
  },
  deviceType: {
    type: String
  },
  browser: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VoiceInteraction', voiceInteractionSchema);
