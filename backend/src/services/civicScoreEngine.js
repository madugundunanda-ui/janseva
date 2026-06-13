const { Complaint, CivicHealthScore } = require('../models');
const logger = require('../utils/logger');

class CivicScoreEngine {
  static async computeScores(tenantId = 'default-municipality') {
    logger.info(`[CivicScoreEngine] Starting computation for tenant ${tenantId}`);
    try {
      // Very simplified aggregate for Wards
      const wardStats = await Complaint.aggregate([
        { $match: { tenantId } },
        { 
          $group: { 
            _id: { $ifNull: ['$location.ward', 'Unknown Ward'] },
            totalComplaints: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            avgSeverity: { $avg: '$severityScore' },
            emergencies: { $sum: { $cond: [{ $in: ['$priority', ['urgent', 'critical']] }, 1, 0] } }
          }
        }
      ]);

      const scores = [];

      for (const stat of wardStats) {
        // Mock Formula:
        // Base 100
        // - (avgSeverity * 5)
        // - (emergencies * 2)
        // + (resolved / totalComplaints * 20)
        let score = 100;
        score -= (stat.avgSeverity || 0) * 5;
        score -= (stat.emergencies || 0) * 2;
        
        const resolveRate = stat.totalComplaints ? (stat.resolved / stat.totalComplaints) : 0;
        score += (resolveRate * 20);

        // Cap between 0 and 100
        score = Math.max(0, Math.min(100, Math.round(score)));

        let status = 'Excellent';
        if (score < 60) status = 'Critical';
        else if (score < 80) status = 'Needs Improvement';
        else if (score < 90) status = 'Good';

        let previousScore = null;
        let trendPercentage = null;
        const reasoning = [
          `Base Score: 100`,
          `Severity Penalty: -${(stat.avgSeverity || 0) * 5}`,
          `Emergency Penalty: -${(stat.emergencies || 0) * 2}`,
          `Resolution Bonus: +${resolveRate * 20}`,
        ];

        // Fetch previous score to calculate trend
        const prevScores = await CivicHealthScore.find({ 
          tenantId, 
          areaName: stat._id, 
          level: 'Ward' 
        }).sort({ calculationDate: -1 }).limit(1);

        if (prevScores.length > 0) {
          previousScore = prevScores[0].score;
          if (previousScore > 0) {
            trendPercentage = Math.round(((score - previousScore) / previousScore) * 100);
            reasoning.push(`Trend calculated against previous score of ${previousScore}`);
          }
        }

        const chs = new CivicHealthScore({
          tenantId,
          level: 'Ward',
          areaName: stat._id,
          score,
          status,
          previousScore,
          trendPercentage,
          reasoning,
          metrics: {
            complaintVolume: stat.totalComplaints,
            resolvedComplaints: stat.resolved,
            averageResolutionTimeHours: 0, // Placeholder
            citizenSatisfactionScore: 0, // Placeholder
            slaCompliancePercentage: 0, // Placeholder
            emergencyIncidents: stat.emergencies,
          }
        });
        
        scores.push(chs);
      }

      if (scores.length > 0) {
        await CivicHealthScore.insertMany(scores);
        logger.info(`[CivicScoreEngine] Saved ${scores.length} ward scores.`);
      }

      // We would ideally aggregate City, District, State similarly.
      
      return scores.length;
    } catch (err) {
      logger.error(`[CivicScoreEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = CivicScoreEngine;
