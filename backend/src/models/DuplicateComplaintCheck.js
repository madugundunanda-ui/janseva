const mongoose = require('mongoose');

const duplicateComplaintCheckSchema = new mongoose.Schema(
  {
    newComplaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
      index: true
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiAssistantWorkflow',
      default: null,
      index: true
    },
    similarComplaintIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    }],
    imageSimilarityScores: [{ type: Number }],
    descriptionSimilarityScores: [{ type: Number }],
    locationProximityScores: [{ type: Number }],
    duplicateDetected: { type: Boolean, default: false },
    userAction: {
      type: String,
      enum: ['create_new', 'join_existing', 'pending'],
      default: 'pending'
    },
    selectedComplaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    checkDetails: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DuplicateComplaintCheck', duplicateComplaintCheckSchema);
