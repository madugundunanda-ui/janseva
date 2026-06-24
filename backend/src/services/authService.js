const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const { resolveDepartmentId } = require('./dashboardService');

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

// Store active session in Redis
const createSession = async (userId, token) => {
  try {
    // We add the token to a list of active sessions for the user.
    // In a full implementation, we'd use redis SADD or similar, but with our cacheService abstraction
    // we can manage a simple array of tokens or validate individual tokens.
    // Let's store the token itself as a valid session.
    const sessionKey = `session:${userId}:${token}`;
    await cacheService.setCache(sessionKey, { active: true }, 7 * 24 * 60 * 60); // 7 days TTL
    
    // Also store to a user-centric index so we can invalidate all
    const userIndexKey = `sessions:user:${userId}`;
    let userSessions = await cacheService.getCache(userIndexKey) || [];
    userSessions.push(token);
    await cacheService.setCache(userIndexKey, userSessions, 7 * 24 * 60 * 60);
  } catch (err) {
    logger.error('Failed to create Redis session', err);
  }
};

const revokeSession = async (userId, token) => {
  try {
    const sessionKey = `session:${userId}:${token}`;
    await cacheService.invalidateCache(sessionKey);
  } catch (err) {
    logger.error('Failed to revoke Redis session', err);
  }
};

const revokeAllSessions = async (userId) => {
  try {
    const userIndexKey = `sessions:user:${userId}`;
    const userSessions = await cacheService.getCache(userIndexKey) || [];
    for (const token of userSessions) {
      await cacheService.invalidateCache(`session:${userId}:${token}`);
    }
    await cacheService.invalidateCache(userIndexKey);
    logger.info(`Revoked all sessions for user ${userId}`);
  } catch (err) {
    logger.error('Failed to revoke all Redis sessions', err);
  }
};

const registerUser = async (payload) => {
  const { name, email, password } = payload;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const normalizedRole = typeof payload.role === 'string' ? payload.role.toLowerCase().trim() : 'citizen';

  const existingUser = await userRepository.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError('User with this email already exists', 409);

  // Resolve department name → ObjectId for officer/supervisor roles
  let resolvedDepartment = payload.department || null;
  if (['officer', 'supervisor'].includes(normalizedRole) && resolvedDepartment) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(resolvedDepartment)) {
      // It's a string name – resolve it to an ObjectId via resolveDepartmentId
      const deptId = await resolveDepartmentId(resolvedDepartment);
      if (!deptId) {
        throw new AppError(`Department '${resolvedDepartment}' not found. Please provide a valid department name or ID.`, 400);
      }
      resolvedDepartment = deptId;
    }
  }

  const user = await userRepository.create({ ...payload, role: normalizedRole, department: resolvedDepartment });
  const token = generateToken(user);
  
  await createSession(user._id.toString(), token);

  return { token, user: sanitizeUser(user) };
};

const loginUser = async ({ email, password, role }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase().trim() : undefined;

  console.time('AUTH_DB_LOOKUP');
  const user = await userRepository.findOne({ email: normalizedEmail }, { select: '+password' });
  console.timeEnd('AUTH_DB_LOOKUP');

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

  console.time('JWT_GENERATION');
  const token = generateToken(user);
  console.timeEnd('JWT_GENERATION');
  await createSession(user._id.toString(), token);
  
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
  aadhaar: user.aadhaar,
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
  revokeSession,
  revokeAllSessions
};
