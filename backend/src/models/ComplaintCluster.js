const mongoose = require('mongoose');

const complaintClusterSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default-municipality',
    index: true
  },
  clusterType: {
    type: String,
    required: true,
    enum: ['Complaint', 'RecurringIssue'],
    default: 'Complaint'
  },
  category: {
    type: String, // E.g., 'Water Supply', 'Sanitation'
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  complaintIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }],
  complaintCount: {
    type: Number,
    required: true,
    default: 0
  },
  severityProfile: {
    criticalCount: { type: Number, default: 0 },
    highCount: { type: Number, default: 0 },
    mediumCount: { type: Number, default: 0 },
    lowCount: { type: Number, default: 0 }
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
  address: {
    type: String
  },
  ward: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timeframeHours: {
    type: Number
  }
}, { timestamps: true });

// Ensure geospatial index is created for fast radius checks
complaintClusterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ComplaintCluster', complaintClusterSchema);
