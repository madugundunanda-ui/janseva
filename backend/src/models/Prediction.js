const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  predictionType: {
    type: String,
    enum: ['Complaint Volume', 'Department Workload', 'SLA Breach', 'Emergency Risk'],
    required: true,
  },
  targetEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Null for global
  },
  targetName: {
    type: String,
  },
  forecastValue: {
    type: Number,
    required: true,
  },
  forecastUnit: {
    type: String, // e.g. "complaints", "% increase", "% risk"
  },
  forecastPeriod: {
    type: String, // e.g. "Next 7 Days"
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
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

predictionSchema.index({ predictionType: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
