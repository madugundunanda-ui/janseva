const mongoose = require('mongoose');

const civicImpactScoreSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default-municipality',
    index: true
  },
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCluster'
  },
  citizensBenefited: {
    type: Number,
    required: true,
    default: 0
  },
  areaScoreImprovement: {
    type: Number,
    required: true,
    default: 0
  },
  impactNarrative: {
    type: String
  },
  ward: {
    type: String
  }
}, { timestamps: true });

civicImpactScoreSchema.index({ tenantId: 1, userId: 1 });

module.exports = mongoose.model('CivicImpactScore', civicImpactScoreSchema);
