const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  logger.info('Sentry initialized successfully');
} else {
  logger.warn('Sentry DSN not provided. Sentry tracking is disabled.');
}

module.exports = {
  Sentry,
  requestHandler: (req, res, next) => {
    if (sentryDsn && Sentry.Handlers && Sentry.Handlers.requestHandler) {
      return Sentry.Handlers.requestHandler()(req, res, next);
    }
    next();
  },
  errorHandler: (err, req, res, next) => {
    if (sentryDsn) {
      if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
        return Sentry.Handlers.errorHandler()(err, req, res, next);
      }
      Sentry.captureException(err);
    }
    next(err);
  }
};
