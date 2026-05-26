const multer = require('multer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found - ${req.originalUrl}`, 404));
};

const handleCastError = (error) => ({
  statusCode: 400,
  message: `Invalid ${error.path}: ${error.value}`,
});

const handleDuplicateKeyError = (error) => ({
  statusCode: 409,
  message: `${Object.keys(error.keyValue || {}).join(', ')} already exists`,
});

const handleValidationError = (error) => ({
  statusCode: 400,
  message: Object.values(error.errors)
    .map((item) => item.message)
    .join(', '),
});

const handleJwtError = (error) => ({
  statusCode: 401,
  message: error.name === 'TokenExpiredError' ? 'Token expired, please log in again' : 'Invalid token, please log in again',
});

const handleMulterError = (error) => ({
  statusCode: 400,
  message: error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded image must be 5MB or smaller' : error.message,
});

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'CastError') {
    ({ statusCode, message } = handleCastError(error));
  }

  if (error.code === 11000) {
    ({ statusCode, message } = handleDuplicateKeyError(error));
  }

  if (error.name === 'ValidationError') {
    ({ statusCode, message } = handleValidationError(error));
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    logger.warn('JWT error encountered', {
      errorName: error.name,
      message: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
    });
    ({ statusCode, message } = handleJwtError(error));
  }

  if (error instanceof multer.MulterError) {
    ({ statusCode, message } = handleMulterError(error));
  }

  logger.error(error.stack || error.message, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };
