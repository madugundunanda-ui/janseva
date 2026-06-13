const mongoose = require('mongoose');

const recurringIssueSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default-municipality',
    index: true
  },
  issueType: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true
  },
  occurrences: {
    type: Number,
    required: true,
    default: 1
  },
  timeframeDays: {
    type: Number,
    required: true,
    default: 45
  },
  rootCauseCandidate: {
    type: String
  },
  recommendedInspection: {
    type: String
  },
  departmentAlerted: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radiusMeters: {
    type: Number,
    required: true,
    default: 500
  },
  ward: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

recurringIssueSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RecurringIssue', recurringIssueSchema);
