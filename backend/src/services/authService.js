const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');
const failedLoginAttempts = new Map();

const registerFailedAttempt = (email) => {
  const key = String(email || 'unknown').toLowerCase();
  const now = Date.now();
  const entry = failedLoginAttempts.get(key) || { count: 0, firstAt: now };
  entry.count += 1;
  failedLoginAttempts.set(key, entry);

  if (entry.count >= 5 && (now - entry.firstAt) <= 15 * 60 * 1000) {
    logger.warn('Repeated failed login attempts detected', {
      email: key,
      attemptCount: entry.count,
      windowMinutes: 15,
    });
  }
};

const clearFailedAttempts = (email) => {
  failedLoginAttempts.delete(String(email || '').toLowerCase());
};

const registerUser = async (payload) => {
  const { name, email, password } = payload;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const normalizedRole = typeof payload.role === 'string' ? payload.role.toLowerCase().trim() : 'citizen';

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError('User with this email already exists', 409);

  const user = await User.create({ ...payload, role: normalizedRole });
  const token = generateToken(user);

  return { token, user: sanitizeUser(user) };
};

const loginUser = async ({ email, password, role }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase().trim() : undefined;

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    registerFailedAttempt(normalizedEmail);
    logger.warn(`Failed login: ${normalizedEmail}`, {
      email: normalizedEmail,
      role: normalizedRole || 'unknown',
      reason: 'user_not_found',
    });
    throw new AppError('Invalid email or password', 401);
  }

  let isMatch = false;

  if (user.password) {
    isMatch = await bcrypt.compare(password, user.password);
  }

  if (!isMatch) {
    registerFailedAttempt(normalizedEmail);
    logger.warn(`Failed login: ${normalizedEmail}`, {
      email: normalizedEmail,
      role: normalizedRole || user.role,
      reason: 'password_mismatch',
    });
    throw new AppError('Invalid email or password', 401);
  }

  if (normalizedRole && user.role.toLowerCase() !== normalizedRole) {
    registerFailedAttempt(normalizedEmail);
    logger.warn(`Failed login: ${normalizedEmail}`, {
      email: normalizedEmail,
      role: normalizedRole,
      reason: 'role_mismatch',
    });
    throw new AppError('Invalid role', 401);
  }

  const token = generateToken(user);
  clearFailedAttempts(normalizedEmail);
  return { token, user: sanitizeUser(user) };
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  department: user.department,
  createdAt: user.createdAt,
  firstName: user.firstName,
  lastName: user.lastName,
  currentAddress: user.currentAddress,
  permanentAddress: user.permanentAddress,
  aadhaarNumber: user.aadhaarNumber,
  occupation: user.occupation,
  age: user.age,
  gender: user.gender,
  ward: user.ward,
  district: user.district,
  profilePhotoUrl: user.profilePhotoUrl,
  trustScore: user.trustScore,
  trustLevel: user.trustLevel,
  tenantId: user.tenantId,
});

module.exports = {
  registerUser,
  loginUser,
};
