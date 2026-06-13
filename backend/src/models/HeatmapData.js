const mongoose = require('mongoose');

const heatmapDataSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  mapType: {
    type: String,
    enum: ['Complaint Density', 'Emergency Density', 'Risk Density'],
    required: true,
  },
  points: [{
    lat: Number,
    lng: Number,
    weight: Number,
  }],
  calculationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

heatmapDataSchema.index({ mapType: 1, tenantId: 1, calculationDate: -1 });

module.exports = mongoose.model('HeatmapData', heatmapDataSchema);
