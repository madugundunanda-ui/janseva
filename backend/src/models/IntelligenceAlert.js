const mongoose = require('mongoose');

const intelligenceAlertSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default-municipality',
    index: true
  },
  alertType: {
    type: String, // 'Emergency', 'Hotspot', 'Trend', 'Recurring'
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  ward: {
    type: String,
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId // Can link to a Hotspot, EmergencyZone, or Cluster
  },
  isAcknowledged: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('IntelligenceAlert', intelligenceAlertSchema);
