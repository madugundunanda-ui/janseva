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

  // 2. AI Service reachability
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${aiUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    checks.aiService = {
      status: response.ok ? 'healthy' : 'degraded',
      statusCode: response.status,
      url: aiUrl,
    };
    if (!response.ok) healthy = false;
  } catch (err) {
    checks.aiService = { status: 'unreachable', error: err.message };
    // AI service being unreachable doesn't make the app unhealthy — just degraded
  }

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
