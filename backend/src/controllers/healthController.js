const mongoose = require('mongoose');
const os = require('os');
const { getIsRedisAvailable } = require('../config/redis');
const aiService = require('../services/aiService'); // We will check gemini status
const { EventAuditLog } = require('../models');

const getHealthStatus = async (req, res) => {
  try {
    // MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Redis
    const redisStatus = getIsRedisAvailable() ? 'connected' : 'disconnected (using memory fallback)';

    // AI Provider / Gemini
    let aiStatus = 'healthy';
    try {
      // Very basic health check for Gemini API
      if (process.env.GEMINI_API_KEY) {
        aiStatus = 'healthy'; // Assuming healthy if configured, we could optionally do a ping
      } else {
        aiStatus = 'unconfigured';
      }
    } catch (e) {
      aiStatus = 'degraded';
    }

    // Notifications Status (Checking recent failures in EventBus DLQ or Audit Log)
    let notificationStatus = 'healthy';
    try {
      const recentFails = await EventAuditLog.countDocuments({
        eventType: 'NotificationFailed',
        createdAt: { $gte: new Date(Date.now() - 5 * 60000) } // last 5 mins
      });
      if (recentFails > 10) notificationStatus = 'degraded';
      if (recentFails > 50) notificationStatus = 'failing';
    } catch (e) {
      notificationStatus = 'unknown';
    }

    // System Metrics
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    const memoryStatus = memoryUsagePercent > 90 ? 'critical' : memoryUsagePercent > 75 ? 'warning' : 'healthy';

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuStatus = loadAvg[0] > cpus.length ? 'high_load' : 'healthy';

    const overallStatus = (mongoStatus === 'connected' && memoryStatus !== 'critical') ? 'healthy' : 'degraded';

    const response = {
      status: overallStatus,
      mongodb: mongoStatus,
      redis: redisStatus,
      ai: aiStatus,
      notifications: notificationStatus,
      cache: redisStatus.includes('connected') ? 'redis' : 'memory',
      memory: memoryStatus,
      metrics: {
        uptime: process.uptime(),
        memoryUsagePercent: memoryUsagePercent.toFixed(2) + '%',
        cpuLoad: loadAvg[0].toFixed(2)
      }
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
};

module.exports = { getHealthStatus };
