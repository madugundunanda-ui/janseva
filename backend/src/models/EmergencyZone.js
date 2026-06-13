const mongoose = require('mongoose');

const emergencyZoneSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default-municipality',
    index: true
  },
  zoneName: {
    type: String,
    required: true
  },
  type: {
    type: String, // E.g., 'Flood', 'Electrical Hazard', 'Road Collapse'
    required: true,
    index: true
  },
  priorityLevel: {
    type: String,
    enum: ['High', 'Critical', 'Emergency'],
    default: 'Critical'
  },
  responseRecommendation: {
    type: String
  },
  complaintIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }],
  // We can store a bounding box, but for simplicity a central point + large radius works best with 2dsphere
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
    default: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ward: {
    type: String,
    index: true
  }
}, { timestamps: true });

emergencyZoneSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyZone', emergencyZoneSchema);
