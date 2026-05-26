const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user);

  sendSuccess(res, 200, 'Dashboard statistics fetched successfully', {
    stats,
  });
});

module.exports = { getStats };
