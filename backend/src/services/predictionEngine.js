const { Complaint, Prediction, Department } = require('../models');
const logger = require('../utils/logger');

class PredictionEngine {
  static async computePredictions(tenantId = 'default-municipality') {
    logger.info(`[PredictionEngine] Starting forecasting for tenant ${tenantId}`);
    try {
      const now = new Date();
      const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Volume Forecast
      const complaintsLast7 = await Complaint.countDocuments({ tenantId, createdAt: { $gte: past7Days } });
      const complaintsPrev7 = await Complaint.countDocuments({ tenantId, createdAt: { $gte: past14Days, $lt: past7Days } });
      
      const changeRate = complaintsPrev7 ? (complaintsLast7 - complaintsPrev7) / complaintsPrev7 : 0;
      const forecastedVolume = Math.round(complaintsLast7 * (1 + changeRate));
      
      const volumePrediction = new Prediction({
        tenantId,
        predictionType: 'Complaint Volume',
        forecastValue: forecastedVolume,
        forecastUnit: 'complaints',
        forecastPeriod: 'Next 7 Days',
        confidenceScore: 85,
        reasoning: [
          `Volume changed by ${(changeRate * 100).toFixed(1)}% over the last 7 days.`,
          `Previous 7 days had ${complaintsPrev7} complaints, latest 7 had ${complaintsLast7}.`,
          `Applying historical linear trend.`
        ]
      });

      // Department Workload Forecast (Sample: highest load dept)
      const topDept = await Complaint.aggregate([
        { $match: { tenantId, createdAt: { $gte: past7Days }, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);

      const deptPrediction = [];
      if (topDept.length > 0) {
        const deptId = topDept[0]._id;
        const deptCountLast7 = topDept[0].count;
        const deptCountPrev7 = await Complaint.countDocuments({ tenantId, department: deptId, createdAt: { $gte: past14Days, $lt: past7Days } });
        
        const dChange = deptCountPrev7 ? (deptCountLast7 - deptCountPrev7) / deptCountPrev7 : 0;
        const dept = await Department.findById(deptId);

        if (dept) {
          deptPrediction.push(new Prediction({
            tenantId,
            predictionType: 'Department Workload',
            targetEntityId: deptId,
            targetName: dept.name,
            forecastValue: Math.round(deptCountLast7 * (1 + dChange)),
            forecastUnit: 'complaints',
            forecastPeriod: 'Next 7 Days',
            confidenceScore: 82,
            reasoning: [
              `Workload for ${dept.name} changed by ${(dChange * 100).toFixed(1)}% recently.`,
              `Applying historical momentum factor.`
            ]
          }));
        }
      }

      await Prediction.insertMany([volumePrediction, ...deptPrediction]);
      logger.info(`[PredictionEngine] Saved predictions.`);
      return 1 + deptPrediction.length;
    } catch (err) {
      logger.error(`[PredictionEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = PredictionEngine;
