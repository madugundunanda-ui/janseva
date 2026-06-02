const mongoose = require('mongoose');

const aiAuditLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      index: true,
    },
    provider: {
      type: String,
      required: [true, 'AI Provider is required'],
      default: 'Gemini',
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence score is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
    },
    reasons: [
      {
        type: String,
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

module.exports = mongoose.model('AiAuditLog', aiAuditLogSchema);
