const { Complaint, OfficerPerformance, User } = require('../models');
const logger = require('../utils/logger');

class OfficerPerformanceEngine {
  static async computePerformance(tenantId = 'default-municipality') {
    logger.info(`[OfficerPerformanceEngine] Starting computation for tenant ${tenantId}`);
    try {
      const stats = await Complaint.aggregate([
        { $match: { tenantId, assignedOfficer: { $ne: null } } },
        { 
          $group: { 
            _id: '$assignedOfficer',
            totalAssigned: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            emergenciesHandled: { $sum: { $cond: [{ $in: ['$priority', ['urgent', 'critical']] }, 1, 0] } }
          }
        }
      ]);

      const records = [];

      for (const stat of stats) {
        const officer = await User.findById(stat._id).populate('department');
        if (!officer || officer.role !== 'officer') continue;

        // Mock metrics
        const citizenFeedbackScore = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
        const slaCompliancePercentage = Math.round(Math.random() * 30 + 70); // 70 to 100
        const verificationSuccess = Math.round(Math.random() * 20 + 80); // 80 to 100

        // Base 100 formula
        let score = 100;
        score -= (100 - slaCompliancePercentage) * 0.5;
        score -= (100 - verificationSuccess) * 0.5;
        const feedbackPenalty = (5.0 - citizenFeedbackScore) * 10;
        score -= feedbackPenalty;

        score = Math.max(0, Math.min(100, Math.round(score)));

        const op = new OfficerPerformance({
          tenantId,
          officerId: officer._id,
          officerName: `${officer.firstName} ${officer.lastName}`,
          departmentName: officer.department ? officer.department.name : 'Unassigned',
          metrics: {
            complaintsResolved: stat.resolved,
            citizenFeedbackScore: parseFloat(citizenFeedbackScore),
            resolutionVerificationSuccessPercentage: verificationSuccess,
            slaCompliancePercentage,
            emergencyHandlingCount: stat.emergenciesHandled
          },
          performanceScore: score
        });
        
        records.push(op);
      }

      if (records.length > 0) {
        await OfficerPerformance.insertMany(records);
        logger.info(`[OfficerPerformanceEngine] Saved ${records.length} officer records.`);
      }

      return records.length;
    } catch (err) {
      logger.error(`[OfficerPerformanceEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = OfficerPerformanceEngine;
