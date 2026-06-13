const mongoose = require('mongoose');

const civicHealthScoreSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: ['Ward', 'City', 'District', 'State'],
    required: true,
  },
  areaName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Excellent', 'Good', 'Needs Improvement', 'Critical'],
  },
  metrics: {
    complaintVolume: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    averageResolutionTimeHours: { type: Number, default: 0 },
    citizenSatisfactionScore: { type: Number, default: 0 },
    slaCompliancePercentage: { type: Number, default: 0 },
    emergencyIncidents: { type: Number, default: 0 },
  },
  previousScore: {
    type: Number,
  },
  trendPercentage: {
    type: Number,
  },
  reasoning: [{
    type: String,
  }],
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

civicHealthScoreSchema.index({ level: 1, areaName: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('CivicHealthScore', civicHealthScoreSchema);
