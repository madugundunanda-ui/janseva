const mongoose = require('mongoose');

const aiAssistantWorkflowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    workflowType: {
      type: String,
      required: true,
      enum: ['RAISE_COMPLAINT', 'TRACK_COMPLAINT', 'GOVERNMENT_UPDATES', 'EMERGENCY_HELP']
    },
    status: {
      type: String,
      default: 'initiated',
      enum: ['initiated', 'in_progress', 'completed', 'abandoned', 'error'],
      index: true
    },
    language: {
      type: String,
      required: true,
      default: 'en-IN'
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceConversationSession',
      default: null
    },
    
    // Raise Complaint specific fields
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
      index: true
    },
    imagePath: { type: String },
    imageAnalysisPending: { type: Boolean, default: false },
    detectedDepartment: { type: String },
    detectedCategory: { type: String },
    detectedSeverity: { type: String },
    departmentConfidence: { type: Number },
    categoryConfidence: { type: Number },
    severityConfidence: { type: Number },
    aiSuggestions: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Track Complaint specific fields
    complaintNumberProvided: { type: String },
    complaintNumberVoiceInput: { type: Boolean, default: false },
    
    // Government Updates specific fields
    filterState: { type: String },
    filterDistrict: { type: String },
    filterDepartment: { type: String },
    
    // Emergency Help specific fields
    emergencyType: { type: String },
    
    workflowMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    completedSteps: { type: mongoose.Schema.Types.Mixed, default: [] },
    currentStep: { type: String },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

aiAssistantWorkflowSchema.index({ workflowType: 1, status: 1 });

module.exports = mongoose.model('AiAssistantWorkflow', aiAssistantWorkflowSchema);
