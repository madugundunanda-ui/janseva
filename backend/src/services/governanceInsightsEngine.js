const { DepartmentPerformance, GovernanceInsight, Department } = require('../models');
const eventBus = require('./eventBus');
const logger = require('../utils/logger');

class GovernanceInsightsEngine {
  static async computeInsights(tenantId = 'default-municipality') {
    logger.info(`[GovernanceInsightsEngine] Generating insights for tenant ${tenantId}`);
    try {
      // Basic strategy: Compare latest department performance to previous
      const latestDepts = await DepartmentPerformance.find({ tenantId }).sort({ calculationDate: -1 }).limit(20);
      
      let generated = 0;

      for (const dept of latestDepts) {
        const previousDepts = await DepartmentPerformance.find({ 
          tenantId, 
          departmentId: dept.departmentId 
        }).sort({ calculationDate: -1 }).skip(1).limit(1);

        if (previousDepts.length > 0) {
          const prev = previousDepts[0];
          const curr = dept;

          if (curr.metrics.totalComplaints > 0 && prev.metrics.totalComplaints > 0) {
            const changeRate = (curr.metrics.totalComplaints - prev.metrics.totalComplaints) / prev.metrics.totalComplaints;
            
            if (changeRate > 0.15) { // If increased by more than 15%
              const trendPercentage = Math.round(changeRate * 100);
              const severity = trendPercentage > 30 ? 'Critical' : 'High';
              const insight = new GovernanceInsight({
                tenantId,
                title: `${dept.departmentName} Workload Surge`,
                insightType: 'Trend',
                severity,
                description: `${dept.departmentName} complaints increased ${trendPercentage}% recently.`,
                actionableRecommendation: `Allocate additional field officers to ${dept.departmentName}.`,
                departmentId: dept.departmentId,
                trendPercentage,
                confidenceScore: 92,
                reasoning: [
                  `Current snapshot volume: ${curr.metrics.totalComplaints}`,
                  `Previous snapshot volume: ${prev.metrics.totalComplaints}`
                ]
              });

              await insight.save();
              
              // EMIT EVENT FOR NOTIFICATION SERVICE
              eventBus.emitEvent('GovernanceInsightGenerated', insight);
              generated++;
            }
          }
        }
      }

      logger.info(`[GovernanceInsightsEngine] Generated ${generated} insights.`);
      return generated;
    } catch (err) {
      logger.error(`[GovernanceInsightsEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = GovernanceInsightsEngine;
