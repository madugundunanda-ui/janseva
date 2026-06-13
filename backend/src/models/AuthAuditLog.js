const mongoose = require('mongoose');

const authAuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // In case of failed login for non-existent user
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'password reset',
        'role change',
        'failed login',
        'token refresh',
        'account lock'
      ],
      required: true,
    },
    changedFields: {
      type: Object, // e.g. { role: { old: 'citizen', new: 'officer' } }
    },
    ipAddress: {
      type: String,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    reason: {
      type: String, // e.g., 'password_mismatch', 'user_not_found'
    },
    tenantId: {
      type: String,
      default: 'default-municipality',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

authAuditLogSchema.index({ user: 1, action: 1 });
authAuditLogSchema.index({ email: 1 });
authAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuthAuditLog', authAuditLogSchema);
