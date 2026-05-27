const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    complaintsCount: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    geoPoint: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  },
  {
    timestamps: true,
  }
);

hotspotSchema.index({ geoPoint: '2dsphere' });

// Auto-populate geoPoint from latitude/longitude on save
hotspotSchema.pre('save', function setGeoPoint(next) {
  if (this.latitude != null && this.longitude != null && isFinite(this.latitude) && isFinite(this.longitude)) {
    this.geoPoint = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  } else {
    this.geoPoint = undefined;
  }
  next();
});

module.exports = mongoose.model('Hotspot', hotspotSchema);
