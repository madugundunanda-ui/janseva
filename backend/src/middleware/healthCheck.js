/**
 * Health Check Endpoint
 *
 * Provides shallow (/healthz) and deep (/health) health checks.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Shallow health check — for load balancer probes.
 * Always returns 200 if the process is running.
 */
const healthz = (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};

/**
 * Deep health check — verifies DB connectivity, AI service, and system resources.
 */
const healthDeep = async (req, res) => {
  const checks = {};
  let healthy = true;

  // 1. MongoDB connection
  try {
    const dbState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      readyState: dbState,
    };
    if (dbState !== 1) healthy = false;
  } catch (err) {
    checks.database = { status: 'unhealthy', error: err.message };
    healthy = false;
  }

  // 2. AI Service status
  const provider = (process.env.VISION_PROVIDER || 'gemini').toLowerCase();
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  checks.aiService = {
    status: (provider === 'gemini' && !hasApiKey) ? 'degraded' : 'healthy',
    provider,
    apiKeyConfigured: hasApiKey
  };

  // 3. System resources
  const memUsage = process.memoryUsage();
  checks.system = {
    uptime: Math.round(process.uptime()),
    memoryMB: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = healthy ? 200 : 503;

  res.status(statusCode).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
};

module.exports = { healthz, healthDeep };
