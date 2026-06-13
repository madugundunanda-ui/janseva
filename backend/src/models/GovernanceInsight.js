const mongoose = require('mongoose');

const governanceInsightSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  insightType: {
    type: String,
    enum: ['Trend', 'Anomaly', 'Improvement', 'Critical'],
    required: true,
  },
  description: {
    type: String,
    required: true, // e.g. "Road complaints increased 42% in Tirupati this month."
  },
  actionableRecommendation: {
    type: String,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  district: {
    type: String,
  },
  ward: {
    type: String,
  },
  trendPercentage: {
    type: Number,
  },
  reasoning: [{
    type: String,
  }],
  areaName: {
    type: String,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  confidenceScore: {
    type: Number,
    default: 100, // How confident is the AI/Engine in this insight?
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

governanceInsightSchema.index({ tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('GovernanceInsight', governanceInsightSchema);
