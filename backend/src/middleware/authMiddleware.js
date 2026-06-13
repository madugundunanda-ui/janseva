const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');
const redisConfig = require('../config/redis');
const { roleBasedLimiter } = require('./rateLimiter');

const protect = asyncHandler(async (req, res, next) => {
  if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'test') {
    let user = await userRepository.findOne({ role: 'citizen' });
    if (!user) {
      user = await userRepository.findOne({});
    }
    if (user) {
      req.user = user;
      return next();
    }
  }

  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    logger.warn('Unauthorized attempt: token missing', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    throw new AppError('Not authorized, token missing', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('JWT verification failed', {
      errorName: error.name,
      message: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    throw error;
  }

  const user = await userRepository.findOne({ _id: decoded.id }, { select: '-password' });

  if (!user) {
    logger.warn('Unauthorized attempt: user from token no longer exists');
    throw new AppError('Not authorized, user no longer exists', 401);
  }

  // Validate Redis Session
  const sessionKey = `session:${user._id.toString()}:${token}`;
  const session = await cacheService.getCache(sessionKey);
  
  if (!session && redisConfig.getIsRedisAvailable()) {
    logger.warn(`Unauthorized attempt: Token revoked for user ${user._id}`);
    throw new AppError('Session expired or revoked', 401);
  }

  req.user = user;
  
  // Enforce role-based rate limits securely after authentication
  return roleBasedLimiter(req, res, next);
});

const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next();
  }

  if (!process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findOne({ _id: decoded.id }, { select: '-password' });
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Treat invalid/expired token as unauthenticated/guest request
  }
  next();
});

module.exports = { protect, optionalProtect };

