const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { 
  CivicHealthScore, 
  DepartmentPerformance, 
  OfficerPerformance, 
  SlaMetric, 
  RiskAssessment,
  GovernanceInsight,
  AnalyticsSnapshot,
  AnalyticsAuditLog,
  Prediction,
  HeatmapData,
  ExecutiveDashboardMetric,
  ExecutiveGovernanceReport,
  Announcement
} = require('../models');

// Generic helper to get the latest precomputed data
const getLatest = async (Model, filter = {}, sort = { calculationDate: -1 }, limit = 50) => {
  return await Model.find(filter).sort(sort).limit(limit);
};

exports.getCivicHealth = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const scores = await getLatest(CivicHealthScore, { tenantId });
  sendSuccess(res, 200, 'Civic Health Scores retrieved successfully', { scores });
});

exports.getDepartments = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const departments = await getLatest(DepartmentPerformance, { tenantId });
  sendSuccess(res, 200, 'Department performance retrieved successfully', { departments });
});

exports.getOfficers = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const officers = await getLatest(OfficerPerformance, { tenantId });
  sendSuccess(res, 200, 'Officer performance retrieved successfully', { officers });
});

exports.getSla = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const slaMetrics = await getLatest(SlaMetric, { tenantId });
  sendSuccess(res, 200, 'SLA metrics retrieved successfully', { slaMetrics });
});

exports.getRisks = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const risks = await getLatest(RiskAssessment, { tenantId });
  sendSuccess(res, 200, 'Risk assessments retrieved successfully', { risks });
});

exports.getGovernanceInsights = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const insights = await getLatest(GovernanceInsight, { tenantId });
  sendSuccess(res, 200, 'Governance insights retrieved successfully', { insights });
});

exports.getPredictions = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const predictions = await getLatest(Prediction, { tenantId });
  sendSuccess(res, 200, 'Predictions retrieved successfully', { predictions });
});

exports.getHeatmaps = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const heatmaps = await getLatest(HeatmapData, { tenantId });
  sendSuccess(res, 200, 'Heatmaps retrieved successfully', { heatmaps });
});

exports.getExecutiveDashboard = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const dashboard = await ExecutiveDashboardMetric.findOne({ tenantId }).sort({ calculationDate: -1 });
  sendSuccess(res, 200, 'Executive dashboard retrieved successfully', { dashboard });
});

exports.getExecutiveReports = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const reports = await getLatest(ExecutiveGovernanceReport, { tenantId });
  sendSuccess(res, 200, 'Executive reports retrieved successfully', { reports });
});

exports.getAiMetrics = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  // AI Metrics might be its own collection or part of Snapshot. For now, mock or fetch from Snapshot
  sendSuccess(res, 200, 'AI metrics retrieved successfully', { 
    metrics: {
      departmentPredictionAccuracy: 94,
      categoryPredictionAccuracy: 89,
      emergencyDetectionAccuracy: 98,
      resolutionVerificationAccuracy: 85
    }
  });
});

exports.getMaps = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const [risks, scores] = await Promise.all([
    getLatest(RiskAssessment, { tenantId }),
    getLatest(CivicHealthScore, { tenantId })
  ]);
  sendSuccess(res, 200, 'Map analytics retrieved successfully', { risks, scores });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  // If user is admin, fetch Admin snapshot. Else global. Or map roles exactly.
  let snapshotType = 'Global';
  if (req.user?.role === 'admin') snapshotType = 'Admin';
  // Note: For citizens/officers, we'd need personalized snapshots, or we dynamically fetch their stats if not precomputed.
  
  const snapshot = await AnalyticsSnapshot.findOne({ tenantId, snapshotType }).sort({ calculationDate: -1 });

  sendSuccess(res, 200, 'Dashboard analytics retrieved successfully', { 
    stats: snapshot ? snapshot.data : {} 
  });
});

// X.5 Analytics
exports.getUpdatesAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
  const oneMonthAgo = new Date(new Date().setDate(new Date().getDate() - 30));

  const [weeklyCount, monthlyCount, emergencyCount, stateDistribution, deptDistribution, trendingTopics] = await Promise.all([
    Announcement.countDocuments({ publishedDate: { $gte: oneWeekAgo } }),
    Announcement.countDocuments({ publishedDate: { $gte: oneMonthAgo } }),
    Announcement.countDocuments({ publishedDate: { $gte: oneWeekAgo }, severity: { $in: ['Critical', 'Emergency'] } }),
    Announcement.aggregate([
      { $match: { publishedDate: { $gte: oneMonthAgo } } },
      { $group: { _id: '$state', count: { $sum: 1 } } }
    ]),
    Announcement.aggregate([
      { $match: { publishedDate: { $gte: oneMonthAgo } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]),
    Announcement.aggregate([
      { $match: { publishedDate: { $gte: oneWeekAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ])
  ]);

  sendSuccess(res, 200, 'Updates analytics retrieved successfully', {
    metrics: {
      updatesThisWeek: weeklyCount,
      updatesThisMonth: monthlyCount,
      emergencyAlerts: emergencyCount
    },
    stateDistribution: stateDistribution.map(s => ({ state: s._id, count: s.count })),
    departmentDistribution: deptDistribution.map(d => ({ department: d._id, count: d.count })),
    trendingTopics: trendingTopics.map(t => ({ topic: t._id, count: t.count, trend: '↑' }))
  });
});
