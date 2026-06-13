const mongoose = require('mongoose');

const aiPredictionAuditSchema = new mongoose.Schema(
  {
    imageHash: { type: String, index: true },
    predictedDepartment: { type: String },
    predictedCategory: { type: String },
    confidence: { type: Number },
    emergencyFlag: { type: Boolean, default: false },
    explanationReasons: [{ type: String }],
    finalDepartmentChosen: { type: String },
    finalCategoryChosen: { type: String },
    
    // Additional helpful metrics
    processingTimeMs: { type: Number },
    aiModelVersion: { type: String, default: 'gemini-2.5-flash' },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AiPredictionAudit', aiPredictionAuditSchema);
