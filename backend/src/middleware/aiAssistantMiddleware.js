/**
 * AI Assistant Middleware
 * Validation, error handling, and request processing
 */

const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const config = require('../config/aiAssistant.config');

/**
 * Validate voice input
 */
const validateVoiceInput = (req, res, next) => {
  const { sessionId, audioBase64 } = req.body;

  if (!sessionId) {
    return res.status(400).json(new AppError('Missing sessionId', 400));
  }

  if (!audioBase64) {
    return res.status(400).json(new AppError('Missing audio data', 400));
  }

  // Validate base64
  try {
    const buffer = Buffer.from(audioBase64, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json(new AppError('Empty audio data', 400));
    }
  } catch (error) {
    return res.status(400).json(new AppError('Invalid base64 encoding', 400));
  }

  // Check audio size
  if (Buffer.from(audioBase64, 'base64').length > config.fileUpload.maxSize) {
    return res.status(413).json(new AppError('Audio file too large', 413));
  }

  next();
};

/**
 * Validate intent classification
 */
const validateIntentClassification = (req, res, next) => {
  const { sessionId, text } = req.body;

  if (!sessionId) {
    return res.status(400).json(new AppError('Missing sessionId', 400));
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json(new AppError('Missing or empty text', 400));
  }

  if (text.length > 1000) {
    return res.status(400).json(new AppError('Text too long (max 1000 characters)', 400));
  }

  next();
};

/**
 * Validate language code
 */
const validateLanguage = (req, res, next) => {
  const language = req.body.language || req.query.language || 'en-IN';

  const voiceService = require('../services/voiceService');
  if (!voiceService.isValidLanguage(language)) {
    return res.status(400).json(new AppError(`Unsupported language: ${language}`, 400));
  }

  req.body.language = language;
  next();
};

/**
 * Validate workflow ID
 */
const validateWorkflowId = (req, res, next) => {
  const { workflowId } = req.params;

  if (!workflowId || isNaN(parseInt(workflowId))) {
    return res.status(400).json(new AppError('Invalid workflowId', 400));
  }

  next();
};

/**
 * Check session validity
 */
const checkSessionValidity = async (req, res, next) => {
  const { sessionId } = req.body || req.params;

  if (!sessionId) {
    return next();
  }

  try {
    const Pool = require('pg').Pool;
    const pool = require('../config/db');

    const query = `
      SELECT id, status, user_id, language, created_at, end_time
      FROM voice_conversation_sessions
      WHERE session_id = $1
    `;

    const result = await pool.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(new AppError('Session not found', 404));
    }

    const session = result.rows[0];

    // Check if session is expired
    if (session.status === 'completed' || session.end_time) {
      return res.status(410).json(new AppError('Session expired', 410));
    }

    // Check if session exceeds max duration
    const now = new Date();
    const sessionAge = now - new Date(session.created_at);
    if (sessionAge > config.session.maxDuration) {
      return res.status(410).json(new AppError('Session expired', 410));
    }

    // Attach session info to request
    req.session = session;
    next();
  } catch (error) {
    logger.error(`Session validation error: ${error.message}`);
    return res.status(500).json(new AppError('Failed to validate session', 500));
  }
};

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = (req, res, next) => {
  if (!config.rateLimit.enabled) {
    return next();
  }

  const rateLimit = require('express-rate-limit');
  
  // General rate limiter
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for certain paths
      return req.path === '/health';
    }
  });

  // Session-specific rate limiter
  const sessionLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.sessionMaxRequests,
    keyGenerator: (req) => req.body.sessionId || req.ip,
    message: 'Too many requests in this session'
  });

  // Apply limiters
  if (req.path.includes('/process-voice') || req.path.includes('/generate-speech')) {
    return sessionLimiter(req, res, () => limiter(req, res, next));
  }

  limiter(req, res, next);
};

/**
 * Error handling middleware
 */
const errorHandlingMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error
  logger.error(`Error: ${err.message}`, {
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    sessionId: req.body?.sessionId,
    userId: req.user?.id,
    error: err
  });

  // JSON parsing error
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(new AppError('Invalid JSON', 400));
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json(new AppError(err.message, 400));
  }

  // Database error
  if (err.name === 'PostgresError' || err.code === 'ECONNREFUSED') {
    return res.status(503).json(new AppError('Database unavailable', 503));
  }

  // Timeout error
  if (err.name === 'TimeoutError') {
    return res.status(504).json(new AppError('Request timeout', 504));
  }

  // Default error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
};

/**
 * CORS middleware setup
 */
const setupCors = (app) => {
  if (!config.security.corsEnabled) {
    return;
  }

  const cors = require('cors');
  const corsOptions = {
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    maxAge: 3600
  };

  app.use(cors(corsOptions));
  
  logger.info(`CORS enabled for origin: ${config.security.corsOrigin}`);
};

/**
 * Request logging middleware
 */
const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      sessionId: req.body?.sessionId || req.query?.sessionId
    });
  });

  next();
};

/**
 * API key validation middleware
 */
const validateApiKey = (req, res, next) => {
  if (!config.security.apiKeyRequired) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== config.security.apiKey) {
    return res.status(401).json(new AppError('Invalid API key', 401));
  }

  next();
};

/**
 * Setup all middleware
 */
const setupMiddleware = (app) => {
  // Body parsing
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // CORS
  setupCors(app);

  // Request logging
  app.use(requestLoggingMiddleware);

  // Rate limiting
  app.use(rateLimitMiddleware);

  // API key validation
  app.use(validateApiKey);

  logger.info('All middleware configured');
};

module.exports = {
  validateVoiceInput,
  validateIntentClassification,
  validateLanguage,
  validateWorkflowId,
  checkSessionValidity,
  rateLimitMiddleware,
  errorHandlingMiddleware,
  setupCors,
  requestLoggingMiddleware,
  validateApiKey,
  setupMiddleware
};
