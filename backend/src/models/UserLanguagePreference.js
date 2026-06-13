const mongoose = require('mongoose');

const userLanguagePreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    preferredLanguage: {
      type: String,
      required: true,
      default: 'en-IN',
      enum: ['en-IN', 'te-IN', 'ta-IN', 'kn-IN']
    },
    speechLanguage: {
      type: String,
      required: true,
      default: 'en-IN'
    },
    ttsLanguage: {
      type: String,
      required: true,
      default: 'en-IN'
    },
    accessibilityEnabled: { type: Boolean, default: false },
    largeTextMode: { type: Boolean, default: false },
    highContrastMode: { type: Boolean, default: false },
    screenReaderEnabled: { type: Boolean, default: false },
    voiceOnlyMode: { type: Boolean, default: false },
    consentVoice: { type: Boolean, default: false },
    consentLocation: { type: Boolean, default: false },
    consentTimestamp: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserLanguagePreference', userLanguagePreferenceSchema);
