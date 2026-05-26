const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
    },
    severityScore: {
      type: Number,
      default: 0,
    },
    severityReason: [
      {
        type: String,
      }
    ],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected', 'closed'],
      default: 'submitted',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen is required'],
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedByAI: {
      type: Boolean,
      default: false,
    },
    assignedSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    escalationNote: {
      type: String,
      trim: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      required: [true, 'Complaint image is required'],
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    aiIssue: {
      type: String,
      trim: true,
    },
    voiceTranscription: {
      type: String,
      trim: true,
    },
    location: {
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      ward: {
        type: String,
        trim: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null,
    },
    feedbackGiven: {
      type: Boolean,
      default: false,
    },
    affectedCitizens: {
      type: Number,
      default: 1,
    },
    joinedCitizens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    communityVotes: {
      confirm: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
      worse: { type: Number, default: 0 }
    },
    validators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    validatorDetails: [
      {
        citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        voteType: { type: String, enum: ['confirm', 'reject', 'worse'] },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    supportingImages: [
      {
        url: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    comments: [
      {
        text: { type: String, required: true },
        citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        citizenName: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    spamAnalysis: {
      spamScore: { type: Number, default: 0 },
      trustScore: { type: Number, default: 100 },
      risk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      reasons: [{ type: String }],
      isSpam: { type: Boolean, default: false },
      status: { type: String, enum: ['active', 'held', 'approved_anyway', 'rejected_spam'], default: 'active' }
    },
    beforeImage: {
      type: String,
    },
    afterImage: {
      type: String,
    },
    verification: {
      status: {
        type: String,
        default: '',
      },
      confidence: {
        type: Number,
        default: 0,
      },
      differenceScore: {
        type: Number,
        default: 0,
      },
      result: {
        type: String,
        default: '',
      },
      reasons: [
        {
          type: String,
        }
      ]
    },
  },
  {
    timestamps: true,
  },
);

complaintSchema.index({ status: 1, department: 1, priority: 1 });
complaintSchema.index({ citizen: 1, createdAt: -1 });
complaintSchema.index({ assignedOfficer: 1, assignedSupervisor: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
