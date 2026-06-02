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
      required: [true, 'Department is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Water Supply', 'Roads & Transport', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Disaster Alerts', 'Public Welfare', 'Smart City', 'Emergency Notice'],
      default: 'Public Welfare',
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Critical', 'Emergency'],
      default: 'Normal',
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
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    tenantId: {
      type: String,
      default: 'default-municipality',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Announcement', announcementSchema);
