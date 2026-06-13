const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  snapshotType: {
    type: String,
    enum: ['Global', 'Admin', 'Citizen', 'Officer', 'Supervisor'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Null for Global or Admin-wide snapshots
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Stores the complex object returned by stats
    required: true,
  },
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

analyticsSnapshotSchema.index({ snapshotType: 1, userId: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
