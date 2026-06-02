const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    officers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

departmentSchema.index({ name: 1, tenantId: 1 }, { unique: true });
departmentSchema.index({ code: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
