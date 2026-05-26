const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { User } = require('../models');
const logger = require('../utils/logger');

const protect = asyncHandler(async (req, res, next) => {
  if (process.env.BYPASS_AUTH === 'true') {
    let user = await User.findOne({ role: 'citizen' });
    if (!user) {
      user = await User.findOne({});
    }
    if (user) {
      req.user = user;
      return next();
    }
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
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

  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    logger.warn('Unauthorized attempt: user from token no longer exists', {
      userId: decoded.id,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    throw new AppError('Not authorized, user no longer exists', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
