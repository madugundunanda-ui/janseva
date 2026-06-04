const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

// Validate environment variables before anything else
const validateEnv = require('./config/env');
validateEnv();

const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');
const { sendSuccess } = require('./utils/apiResponse');
const sentry = require('./config/sentry');

connectDB();

const app = express();
app.use(sentry.requestHandler);
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", process.env.AI_SERVICE_URL || 'http://localhost:8000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// ─── HTTPS Redirect (Production) ────────────────────────────────
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// ─── CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: isProduction
    ? allowedOrigins
    : true,
  credentials: true,
}));

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── NoSQL Injection Sanitization ───────────────────────────────
app.use(mongoSanitize());

// ─── Rate Limiting ──────────────────────────────────────────────
// Global rate limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api', globalLimiter);

// Auth rate limiter: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api/auth', authLimiter);

// Login slow-down: progressive delay after 5 attempts
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: (hits) => (hits - 5) * 500,
  maxDelayMs: 5000,
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api/auth/login', loginSlowDown);

// Upload rate limiter: 10 requests per minute per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload rate limit exceeded. Please wait before uploading again.' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api/complaints/upload', uploadLimiter);
app.use('/api/ai/analyze', uploadLimiter);

// AI endpoint rate limiter: 30 requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI service rate limit exceeded. Please try again shortly.' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api/ai', aiLimiter);

// ─── Logging ────────────────────────────────────────────────────
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ───────────────────────────────────────────────
const { healthz, healthDeep, redisQueueHealth } = require('./middleware/healthCheck');
app.get('/healthz', healthz);
app.get('/health', healthDeep);
app.get('/health/queue', redisQueueHealth);
app.get('/', (req, res) => {
  sendSuccess(res, 200, 'Citizen Grievance Backend Running', {
    service: 'Citizen Service Request & Municipal Grievance Resolution System',
    status: 'running',
  });
});

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handling ─────────────────────────────────────────────
app.use(sentry.errorHandler);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
