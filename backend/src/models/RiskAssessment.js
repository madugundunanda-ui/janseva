const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  areaName: {
    type: String,
    required: true,
  },
  riskType: {
    type: String,
    required: true, // e.g. "sanitation hotspot", "flood-prone area", "electrical hazard cluster"
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  riskCategory: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
  },
  trendDescription: {
    type: String,
    // e.g. "Road Complaints +42% Past 30 Days"
  },
  recommendedAction: {
    type: String,
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

riskAssessmentSchema.index({ areaName: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
