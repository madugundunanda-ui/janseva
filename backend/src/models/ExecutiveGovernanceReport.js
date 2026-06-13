const mongoose = require('mongoose');

const executiveGovernanceReportSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  reportType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly'],
    required: true,
  },
  summaryContent: [{
    type: String
  }],
  generatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

executiveGovernanceReportSchema.index({ reportType: 1, tenantId: 1, generatedAt: -1 });

module.exports = mongoose.model('ExecutiveGovernanceReport', executiveGovernanceReportSchema);
