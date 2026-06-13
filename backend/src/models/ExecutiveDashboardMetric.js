const mongoose = require('mongoose');

const executiveDashboardMetricSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  stateCivicHealthScore: {
    type: Number,
    default: 0
  },
  governanceEffectivenessScore: {
    type: Number,
    default: 0
  },
  governanceCategory: {
    type: String,
    enum: ['Excellent', 'Good', 'Needs Improvement', 'Critical'],
    default: 'Needs Improvement'
  },
  emergencyRiskIndex: {
    type: Number,
    default: 0
  },
  slaComplianceIndex: {
    type: Number,
    default: 0
  },
  citizenSatisfactionIndex: {
    type: Number,
    default: 0
  },
  aiAccuracyIndex: {
    type: Number,
    default: 0
  },
  topDistricts: [{
    name: String,
    score: Number
  }],
  worstDistricts: [{
    name: String,
    score: Number
  }],
  topDepartments: [{
    name: String,
    score: Number
  }],
  underperformingDepartments: [{
    name: String,
    score: Number
  }],
  topOfficers: [{
    name: String,
    score: Number
  }],
  criticalRiskAreas: [{
    name: String,
    score: Number
  }],
  emergencyHotspots: [{
    name: String,
    score: Number
  }],
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

executiveDashboardMetricSchema.index({ tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('ExecutiveDashboardMetric', executiveDashboardMetricSchema);
