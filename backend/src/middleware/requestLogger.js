const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const method = req.method;
  const originalUrl = req.originalUrl;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const responseTime = Number(durationNs / 1000000n);
    const message = `${method} ${originalUrl} ${res.statusCode} ${responseTime}ms`;
    const payload = { method, url: originalUrl, statusCode: res.statusCode, responseTimeMs: responseTime, ip };

    if (res.statusCode >= 500) logger.error(message, payload);
    else if (res.statusCode >= 400) logger.warn(message, payload);
    else logger.info(message, payload);
  });

  next();
};

module.exports = requestLogger;
