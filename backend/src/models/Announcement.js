const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Water Supply', 'Roads & Transport', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Disaster Alerts', 'Public Welfare', 'Smart City', 'Emergency Notice'],
      default: 'Public Welfare',
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'critical', 'emergency'],
      default: 'normal',
    },
    shortSummary: {
      type: String,
      default: ''
    },
    mediumSummary: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    officialLink: {
      type: String,
      trim: true,
      default: '',
    },
    sourceUrl: {
      type: String,
      default: ''
    },
    sourceName: {
      type: String,
      default: ''
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    state: {
      type: String,
      enum: ['ALL', 'AP', 'TS', 'TN', 'KA'],
      default: 'ALL',
      index: true,
    },
    district: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    tenantId: {
      type: String,
      default: 'default-municipality',
      index: true,
    },
    trustScore: {
      type: Number,
      default: 0
    },
    confidence: {
      type: Number,
      default: 0
    },
    sourceCount: {
      type: Number,
      default: 1
    },
    verified: {
      type: Boolean,
      default: false
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical', 'Emergency'],
      default: 'Medium'
    },
    translations: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastSynced: {
      type: Date,
      default: Date.now
    },
    fingerprint: {
      type: String,
      index: true,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Announcement', announcementSchema);
