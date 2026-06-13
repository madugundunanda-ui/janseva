const mongoose = require('mongoose');

const slaMetricSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['Global', 'Department', 'Officer', 'Complaint'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Null for Global
  },
  metrics: {
    totalActive: { type: Number, default: 0 },
    breached: { type: Number, default: 0 },
    atRisk: { type: Number, default: 0 },
    compliancePercentage: { type: Number, default: 0 },
  },
  riskPrediction: {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    riskPercentage: { type: Number },
    warningMessage: { type: String },
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

slaMetricSchema.index({ entityType: 1, entityId: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('SlaMetric', slaMetricSchema);
