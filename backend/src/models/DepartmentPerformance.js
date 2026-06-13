const mongoose = require('mongoose');

const departmentPerformanceSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  departmentName: {
    type: String,
    required: true,
  },
  metrics: {
    totalComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    averageResolutionTimeHours: { type: Number, default: 0 },
    citizenFeedbackScore: { type: Number, default: 0 },
    slaCompliancePercentage: { type: Number, default: 0 },
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

departmentPerformanceSchema.index({ departmentId: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('DepartmentPerformance', departmentPerformanceSchema);
