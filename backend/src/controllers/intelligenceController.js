const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseFormatter');
const civicIntelligenceService = require('../services/civicIntelligenceService');
const { ComplaintCluster, Hotspot, RiskAssessment, EmergencyZone, RecurringIssue, CivicImpactScore } = require('../models');

/**
 * Get Clusters
 * @route GET /api/v1/intelligence/clusters
 */
const getClusters = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const clusters = await ComplaintCluster.find({ tenantId, clusterType: 'Complaint' }).sort('-complaintCount');
  sendSuccess(res, 200, 'Complaint clusters retrieved successfully', { clusters });
});

/**
 * Get Hotspots
 * @route GET /api/v1/intelligence/hotspots
 */
const getHotspots = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const hotspots = await Hotspot.find().sort('-complaintsCount');
  sendSuccess(res, 200, 'Hotspots retrieved successfully', { hotspots });
});

/**
 * Get Risks
 * @route GET /api/v1/intelligence/risks
 */
const getRisks = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const risks = await RiskAssessment.find({ tenantId }).sort('-riskScore');
  sendSuccess(res, 200, 'Area risks retrieved successfully', { risks });
});

/**
 * Get Emergency Zones
 * @route GET /api/v1/intelligence/emergency-zones
 */
const getEmergencyZones = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const emergencyZones = await EmergencyZone.find({ tenantId, isActive: true }).populate('complaintIds', 'priority status category');
  sendSuccess(res, 200, 'Emergency zones retrieved successfully', { emergencyZones });
});

/**
 * Get Recurring Issues
 * @route GET /api/v1/intelligence/recurring-issues
 */
const getRecurringIssues = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const recurringIssues = await RecurringIssue.find({ tenantId, isActive: true }).sort('-occurrences');
  sendSuccess(res, 200, 'Recurring issues retrieved successfully', { recurringIssues });
});

/**
 * Get Civic Impact for User
 * @route GET /api/v1/intelligence/impact
 */
const getCivicImpact = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const userId = req.user.id;
  const impacts = await CivicImpactScore.find({ tenantId, userId });
  
  const totalBenefited = impacts.reduce((acc, curr) => acc + curr.citizensBenefited, 0);
  const totalImprovement = impacts.reduce((acc, curr) => acc + curr.areaScoreImprovement, 0);

  sendSuccess(res, 200, 'Civic impact retrieved successfully', { 
    totalBenefited,
    totalImprovement,
    impacts
  });
});
/**
 * @desc    Get intelligence heatmap data
 * @route   GET /api/v1/intelligence/heatmap
 * @access  Private
 */
const getHeatmap = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';

  const heatmap = await civicIntelligenceService.generateHeatmapData(tenantId);

  sendSuccess(res, 200, 'Heatmap data retrieved successfully', {
    heatmapCount: heatmap.length,
    heatmap
  });
});
/**
 * Run Full Sync (Admin only)
 * @route POST /api/v1/intelligence/sync
 */
const syncIntelligence = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  await civicIntelligenceService.executeFullIntelligenceSync(tenantId);
  sendSuccess(res, 200, 'Civic intelligence engine sync complete');
});

module.exports = {
  getClusters,
  getHotspots,
  getRisks,
  getEmergencyZones,
  getRecurringIssues,
  getCivicImpact,
  getHeatmap,
  syncIntelligence
};
