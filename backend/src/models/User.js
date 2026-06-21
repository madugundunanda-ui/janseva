const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function validateRoleBasedEmail(value) {
          if (!value) return false;

          const role = this.role;
          if (role === 'admin') {
            return /^[a-zA-Z0-9._%+-]+@janseva\.gov\.in$/.test(value);
          }
          if (role === 'officer') {
            return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.janseva\.gov\.in$/.test(value);
          }
          if (role === 'supervisor') {
            return /^[a-zA-Z0-9._%+-]+@works\.janseva\.gov\.in$/.test(value);
          }
          return /^\S+@\S+\.\S+$/.test(value);
        },
        message: function roleBasedEmailMessage(props) {
          const role = this.role;
          if (role === 'admin') {
            return 'Invalid admin email format. Required format: <name>@janseva.gov.in';
          }
          if (role === 'officer') {
            return 'Invalid officer email format. Required format: <name>@<department>.janseva.gov.in';
          }
          if (role === 'supervisor') {
            return 'Invalid supervisor email format. Required format: <name>@works.janseva.gov.in';
          }
          return `Please provide a valid email address: ${props.value}`;
        },
      },
    },
    aadhaar: {
      last4Digits: { type: String, trim: true },
      verificationStatus: { type: Boolean, default: false },
      verificationDate: { type: Date }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'supervisor', 'admin'],
      default: 'citizen',
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    currentAddress: {
      type: String,
      trim: true,
    },
    permanentAddress: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      trim: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function requireDepartmentForStaff() {
        return ['officer', 'supervisor'].includes(this.role);
      },
      default: null,
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    geoPoint: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    trustScore: {
      type: Number,
      default: 100,
    },
    restricted: {
      type: Boolean,
      default: false,
    },
    trustLevel: {
      type: String,
      enum: ['Trusted', 'Normal', 'Warning', 'Restricted'],
      default: 'Trusted',
    },
    tenantId: {
      type: String,
      default: 'default-municipality',
      index: true,
    },
    preferences: {
      voiceLanguage: { type: String, default: 'en-IN' },
      uiLanguage: { type: String, default: 'en' },
    },
    citizenAnalytics: {
      complaintsFiled: { type: Number, default: 0 },
      complaintsResolved: { type: Number, default: 0 },
      citizensImpacted: { type: Number, default: 0 },
      civicParticipationScore: { type: Number, default: 0 }
    },
    performanceMetrics: {
      averageResolutionTime: { type: Number, default: 0 },
      citizenFeedbackScore: { type: Number, default: 0 },
      complaintsResolved: { type: Number, default: 0 },
      slaCompliance: { type: Number, default: 0 }
    },
    aiAssignmentProfile: {
      currentWorkload: { type: Number, default: 0 },
      specialization: [{ type: String }],
      preferredAreas: [{ type: String }]
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

userSchema.index({ role: 1, department: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ ward: 1 });
userSchema.index({ district: 1 });
userSchema.index({ 'preferences.uiLanguage': 1 });
userSchema.index({ geoPoint: '2dsphere' });

// Auto-populate geoPoint from latitude/longitude on save
userSchema.pre('save', function setGeoPoint(next) {
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

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
