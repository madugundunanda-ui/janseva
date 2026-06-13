const mongoose = require('mongoose');

const officerPerformanceSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  officerName: {
    type: String,
    required: true,
  },
  departmentName: {
    type: String,
  },
  metrics: {
    complaintsResolved: { type: Number, default: 0 },
    citizenFeedbackScore: { type: Number, default: 0 },
    resolutionVerificationSuccessPercentage: { type: Number, default: 0 },
    slaCompliancePercentage: { type: Number, default: 0 },
    emergencyHandlingCount: { type: Number, default: 0 },
  },
  performanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

officerPerformanceSchema.index({ officerId: 1, tenantId: 1, calculationDate: -1 });
officerPerformanceSchema.index({ performanceScore: -1, tenantId: 1 });

module.exports = mongoose.model('OfficerPerformance', officerPerformanceSchema);
