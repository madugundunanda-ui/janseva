const crypto = require('crypto');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const method = req.method;
  const originalUrl = req.originalUrl;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

  // Generate unique request ID and propagate it
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const responseTime = Number(durationNs / 1000000n);
    const message = `${method} ${originalUrl} ${res.statusCode} ${responseTime}ms`;
    const payload = {
      requestId,
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: responseTime,
      ip,
      contentLength: res.getHeader('content-length') || 0,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 500) {
      logger.error(message, payload);
    } else if (res.statusCode >= 400) {
      logger.warn(message, payload);
    } else {
      logger.info(message, payload);
    }

    // Slow request warning (> 2 seconds)
    if (responseTime > 2000) {
      logger.warn(`SLOW REQUEST: ${method} ${originalUrl} took ${responseTime}ms`, {
        requestId,
        responseTimeMs: responseTime,
        threshold: 2000,
      });
    }
  });

  next();
};

module.exports = requestLogger;
