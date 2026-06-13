const CivicScoreEngine = require('./civicScoreEngine');
const DepartmentPerformanceEngine = require('./departmentPerformanceEngine');
const OfficerPerformanceEngine = require('./officerPerformanceEngine');
const SlaIntelligence = require('./slaIntelligence');
const civicIntelligenceService = require('./civicIntelligenceService');
const PredictionEngine = require('./predictionEngine');
const HeatmapEngine = require('./heatmapEngine');
const GovernanceInsightsEngine = require('./governanceInsightsEngine');
const GovernanceCommandCenterEngine = require('./governanceCommandCenterEngine');
const { AnalyticsAuditLog, AnalyticsSnapshot } = require('../models');
const logger = require('../utils/logger');
// Pre-existing dashboard service for generating the snapshot
const dashboardService = require('./dashboardService');

class AnalyticsCronManager {
  static async runEngine(engineName, fn) {
    const startTime = Date.now();
    try {
      logger.info(`[AnalyticsCronManager] Running engine: ${engineName}`);
      const recordsProcessed = await fn();
      const durationMs = Date.now() - startTime;
      
      await AnalyticsAuditLog.create({
        tenantId: 'default-municipality',
        engineName,
        status: 'Success',
        durationMs,
        recordsProcessed: typeof recordsProcessed === 'number' ? recordsProcessed : 1
      });
      logger.info(`[AnalyticsCronManager] ${engineName} completed in ${durationMs}ms`);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      await AnalyticsAuditLog.create({
        tenantId: 'default-municipality',
        engineName,
        status: 'Failed',
        durationMs,
        errorMessage: err.message
      });
      logger.error(`[AnalyticsCronManager] ${engineName} failed: ${err.message}`);
    }
  }

  static async generateAnalyticsSnapshots() {
    return this.runEngine('SnapshotGenerator', async () => {
      // 1. Generate Global Snapshot
      const globalStats = await dashboardService.getDashboardStats();
      await AnalyticsSnapshot.create({
        tenantId: 'default-municipality',
        snapshotType: 'Global',
        data: globalStats
      });

      // 2. Generate Admin Snapshot
      const adminStats = await dashboardService.getDashboardStats({ role: 'admin' });
      await AnalyticsSnapshot.create({
        tenantId: 'default-municipality',
        snapshotType: 'Admin',
        data: adminStats
      });

      return 2;
    });
  }

  static async runAllEnginesHourly() {
    logger.info('[AnalyticsCronManager] Starting HOURLY analytics engines...');
    await this.runEngine('PredictionEngine', () => PredictionEngine.computePredictions());
    await this.runEngine('HeatmapEngine', () => HeatmapEngine.computeHeatmaps());
    await this.runEngine('GovernanceInsightsEngine', () => GovernanceInsightsEngine.computeInsights());
    await this.runEngine('GovernanceCommandCenterEngine', () => GovernanceCommandCenterEngine.computeExecutiveMetrics());
    await this.runEngine('CivicIntelligenceRiskSync', () => civicIntelligenceService.predictAreaRisks());
    await this.generateAnalyticsSnapshots();
  }

  static async runAllEngines10Min() {
    logger.info('[AnalyticsCronManager] Starting 10-MIN analytics engines...');
    await this.runEngine('SlaIntelligence', () => SlaIntelligence.computeSla());
  }

  static startCron() {
    // 15 Minutes
    setInterval(() => {
      this.runEngine('CivicIntelligenceClusterSync', () => civicIntelligenceService.generateClusters()).catch(console.error);
    }, 15 * 60 * 1000);

    // 30 Minutes
    setInterval(() => {
      this.runEngine('CivicIntelligenceHotspotSync', () => civicIntelligenceService.generateHotspots()).catch(console.error);
    }, 30 * 60 * 1000);

    // Hourly
    setInterval(() => {
      this.runAllEnginesHourly().catch(console.error);
    }, 60 * 60 * 1000);

    // Every 10 Minutes
    setInterval(() => {
      this.runAllEngines10Min().catch(console.error);
    }, 10 * 60 * 1000);

    // 6 Hours
    setInterval(() => {
      this.runEngine('CivicIntelligenceRecurringSync', () => civicIntelligenceService.detectRecurringIssues()).catch(console.error);
    }, 6 * 60 * 60 * 1000);

    // Daily
    setInterval(() => {
      this.runEngine('CivicScoreEngine', () => CivicScoreEngine.computeScores()).catch(console.error);
      this.runEngine('DepartmentPerformanceEngine', () => DepartmentPerformanceEngine.computePerformance()).catch(console.error);
      this.runEngine('OfficerPerformanceEngine', () => OfficerPerformanceEngine.computePerformance()).catch(console.error);
    }, 24 * 60 * 60 * 1000);

    // Initial run
    setTimeout(() => {
      this.runAllEnginesHourly().catch(console.error);
      this.runAllEngines10Min().catch(console.error);
      this.runEngine('CivicScoreEngine', () => CivicScoreEngine.computeScores()).catch(console.error);
    }, 5000);
    
    logger.info('[AnalyticsCronManager] Cron scheduled successfully.');
  }
}

module.exports = AnalyticsCronManager;
