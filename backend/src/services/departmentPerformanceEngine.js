const { Complaint, DepartmentPerformance, Department } = require('../models');
const logger = require('../utils/logger');

class DepartmentPerformanceEngine {
  static async computePerformance(tenantId = 'default-municipality') {
    logger.info(`[DepartmentPerformanceEngine] Starting computation for tenant ${tenantId}`);
    try {
      const stats = await Complaint.aggregate([
        { $match: { tenantId, department: { $ne: null } } },
        { 
          $group: { 
            _id: '$department',
            totalComplaints: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
          }
        }
      ]);

      const records = [];

      for (const stat of stats) {
        const dept = await Department.findById(stat._id);
        if (!dept) continue;

        // Mock SLA and Feedback scores
        const citizenFeedbackScore = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
        const slaCompliancePercentage = Math.round(Math.random() * 30 + 70); // 70 to 100

        const dp = new DepartmentPerformance({
          tenantId,
          departmentId: dept._id,
          departmentName: dept.name,
          metrics: {
            totalComplaints: stat.totalComplaints,
            resolvedComplaints: stat.resolved,
            averageResolutionTimeHours: Math.round(Math.random() * 48 + 12), // 12 to 60 hours
            citizenFeedbackScore: parseFloat(citizenFeedbackScore),
            slaCompliancePercentage
          }
        });
        
        records.push(dp);
      }

      if (records.length > 0) {
        await DepartmentPerformance.insertMany(records);
        logger.info(`[DepartmentPerformanceEngine] Saved ${records.length} department records.`);
      }

      return records.length;
    } catch (err) {
      logger.error(`[DepartmentPerformanceEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = DepartmentPerformanceEngine;
