const {
  CivicHealthScore,
  DepartmentPerformance,
  OfficerPerformance,
  RiskAssessment,
  SlaMetric,
  ExecutiveDashboardMetric,
  ExecutiveGovernanceReport
} = require('../models');
const logger = require('../utils/logger');

class GovernanceCommandCenterEngine {
  static async computeExecutiveMetrics(tenantId = 'default-municipality') {
    logger.info(`[GovernanceCommandCenterEngine] Generating executive metrics for tenant ${tenantId}`);
    try {
      // 1. Fetch freshest snapshots
      const stateScoreDoc = await CivicHealthScore.findOne({ tenantId, level: 'Global' }).sort({ calculationDate: -1 });
      const districtScores = await CivicHealthScore.find({ tenantId, level: 'Ward' }).sort({ calculationDate: -1 }).limit(50);
      const deptPerf = await DepartmentPerformance.find({ tenantId }).sort({ calculationDate: -1 }).limit(20);
      const officerPerf = await OfficerPerformance.find({ tenantId }).sort({ calculationDate: -1 }).limit(50);
      const risks = await RiskAssessment.find({ tenantId }).sort({ calculationDate: -1 }).limit(50);
      const sla = await SlaMetric.findOne({ tenantId, entityType: 'Global' }).sort({ calculationDate: -1 });

      // Build Top/Worst Districts
      const sortedDistricts = [...districtScores].sort((a, b) => b.score - a.score);
      const topDistricts = sortedDistricts.slice(0, 10).map(d => ({ name: d.areaName, score: d.score }));
      const worstDistricts = sortedDistricts.slice(-10).reverse().map(d => ({ name: d.areaName, score: d.score }));

      // Build Top/Underperforming Departments
      const sortedDepts = [...deptPerf].sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);
      const topDepartments = sortedDepts.slice(0, 5).map(d => ({ name: d.departmentName, score: d.metrics.performanceScore }));
      const underperformingDepartments = sortedDepts.slice(-5).reverse().map(d => ({ name: d.departmentName, score: d.metrics.performanceScore }));

      // Officers
      const sortedOfficers = [...officerPerf].sort((a, b) => b.performanceScore - a.performanceScore);
      const topOfficers = sortedOfficers.slice(0, 10).map(o => ({ name: o.officerName, score: o.performanceScore }));

      // Risks
      const sortedRisks = [...risks].sort((a, b) => b.riskScore - a.riskScore);
      const criticalRiskAreas = sortedRisks.slice(0, 10).map(r => ({ name: r.areaName, score: r.riskScore }));
      const emergencyHotspots = sortedRisks.filter(r => r.riskCategory === 'Critical').slice(0, 10).map(r => ({ name: r.areaName, score: r.riskScore }));

      // Global Metrics
      const stateCivicHealthScore = stateScoreDoc ? stateScoreDoc.score : 0;
      const slaComplianceIndex = sla && sla.metrics ? Math.round((sla.metrics.withinSla / (sla.metrics.totalResolved || 1)) * 100) : 0;
      const citizenSatisfactionIndex = stateScoreDoc && stateScoreDoc.metrics ? stateScoreDoc.metrics.citizenSatisfactionScore : 0;

      // Governance Effectiveness Formula
      let governanceEffectivenessScore = Math.round(
        (slaComplianceIndex * 0.4) + 
        (citizenSatisfactionIndex * 0.3) + 
        (stateCivicHealthScore * 0.3)
      );
      if (isNaN(governanceEffectivenessScore)) governanceEffectivenessScore = 0;

      let governanceCategory = 'Needs Improvement';
      if (governanceEffectivenessScore >= 90) governanceCategory = 'Excellent';
      else if (governanceEffectivenessScore >= 75) governanceCategory = 'Good';
      else if (governanceEffectivenessScore < 60) governanceCategory = 'Critical';

      // Ensure scores don't exceed 100
      governanceEffectivenessScore = Math.min(Math.max(governanceEffectivenessScore, 0), 100);

      const metric = new ExecutiveDashboardMetric({
        tenantId,
        stateCivicHealthScore,
        governanceEffectivenessScore,
        governanceCategory,
        emergencyRiskIndex: criticalRiskAreas.length > 0 ? criticalRiskAreas[0].score : 0,
        slaComplianceIndex,
        citizenSatisfactionIndex,
        aiAccuracyIndex: 92, // Mocked for now until AI engine verification is built
        topDistricts,
        worstDistricts,
        topDepartments,
        underperformingDepartments,
        topOfficers,
        criticalRiskAreas,
        emergencyHotspots
      });

      await metric.save();

      // Generate Summary string
      const summaries = [];
      if (topDepartments.length > 0) {
        summaries.push(`${topDepartments[0].name} is the top performing department with a score of ${topDepartments[0].score}.`);
      }
      if (slaComplianceIndex > 0) {
        summaries.push(`Overall SLA Compliance stands at ${slaComplianceIndex}%.`);
      }
      if (criticalRiskAreas.length > 0) {
        summaries.push(`${criticalRiskAreas[0].name} remains the highest risk area with a risk index of ${criticalRiskAreas[0].score}.`);
      }

      const report = new ExecutiveGovernanceReport({
        tenantId,
        reportType: 'Daily',
        summaryContent: summaries
      });
      await report.save();

      logger.info(`[GovernanceCommandCenterEngine] Successfully generated executive metrics.`);
      return true;
    } catch (err) {
      logger.error(`[GovernanceCommandCenterEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = GovernanceCommandCenterEngine;
