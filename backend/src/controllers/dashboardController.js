const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');
const analyticsController = require('./analyticsController');
const { AnalyticsSnapshot } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  let snapshotType = 'Global';
  if (req.user && req.user.role === 'admin') snapshotType = 'Admin';
  
  const snapshot = await AnalyticsSnapshot.findOne({ tenantId, snapshotType }).sort({ calculationDate: -1 });

  // If no snapshot exists yet, fallback to realtime once (or just return empty stats if preferred)
  let stats = snapshot ? snapshot.data : null;
  if (!stats) {
    stats = await dashboardService.getDashboardStats(req.user);
  }

  sendSuccess(res, 200, 'Dashboard statistics fetched successfully', {
    stats,
  });
});

module.exports = { getStats };
