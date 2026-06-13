const { Complaint, SlaMetric } = require('../models');
const logger = require('../utils/logger');

class SlaIntelligence {
  static async computeSla(tenantId = 'default-municipality') {
    logger.info(`[SlaIntelligence] Starting SLA risk computation for tenant ${tenantId}`);
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find global stats
      const activeComplaints = await Complaint.countDocuments({
        tenantId,
        status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] }
      });

      const breachedComplaints = await Complaint.countDocuments({
        tenantId,
        status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
        slaDeadline: { $lt: now }
      });

      const atRiskComplaints = await Complaint.countDocuments({
        tenantId,
        status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
        slaDeadline: { $gte: now, $lt: next24Hours }
      });

      const compliancePercentage = activeComplaints ? Math.round(((activeComplaints - breachedComplaints) / activeComplaints) * 100) : 100;

      const globalSla = new SlaMetric({
        tenantId,
        entityType: 'Global',
        metrics: {
          totalActive: activeComplaints,
          breached: breachedComplaints,
          atRisk: atRiskComplaints,
          compliancePercentage
        }
      });

      await globalSla.save();
      logger.info(`[SlaIntelligence] Saved global SLA metric. Breached: ${breachedComplaints}, At Risk: ${atRiskComplaints}`);

      // In a full implementation, we'd loop through departments and officers as well,
      // and also create individual Complaint SLA warnings if risk > 80%.

      return { globalSla };
    } catch (err) {
      logger.error(`[SlaIntelligence] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = SlaIntelligence;
