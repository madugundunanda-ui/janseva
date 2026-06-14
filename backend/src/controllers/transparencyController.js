const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { Complaint, DepartmentPerformance, CivicScore, CivicImpactScore, IntelligenceAlert } = require('../models');
const transparencyPrivacyService = require('../services/transparencyPrivacyService');
const logger = require('../utils/logger');

// Simple In-Memory Cache to prevent DDoS on public endpoints
class SimpleCache {
  constructor(ttlMs = 60000) { // Default 1 minute cache
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  set(key, value, customTtl = null) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (customTtl || this.ttl)
    });
  }
}

const publicCache = new SimpleCache(5 * 60 * 1000); // 5 minutes

/**
 * Helper to execute with cache
 */
const withCache = async (key, fetchFn, ttl = null) => {
  const cached = publicCache.get(key);
  if (cached) return cached;
  const data = await fetchFn();
  publicCache.set(key, data, ttl);
  return data;
};

/**
 * GET /api/v1/transparency/stats
 * High-level system stats
 */
exports.getStats = asyncHandler(async (req, res) => {
  const cacheKey = `stats_${req.query.state || 'all'}_${req.query.district || 'all'}`;
  
  const data = await withCache(cacheKey, async () => {
    const matchStage = { tenantId: 'default-municipality' };
    if (req.query.state) matchStage['location.state'] = req.query.state;
    if (req.query.district) matchStage['location.city'] = req.query.district; // Map district to city for now

    const stats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          pendingComplaints: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'assigned', 'in_progress', 'escalated']] }, 1, 0] } }
        }
      }
    ]);

    return stats[0] || { totalComplaints: 0, resolvedComplaints: 0, pendingComplaints: 0 };
  }, 300000); // 5 minutes cache

  sendSuccess(res, 200, 'Transparency stats retrieved', data);
});

/**
 * GET /api/v1/transparency/civic-scores
 */
exports.getCivicScores = asyncHandler(async (req, res) => {
  const data = await withCache('civic-scores', async () => {
    const scores = await CivicScore.find({ tenantId: 'default-municipality' })
      .sort('-score')
      .limit(100)
      .lean();
    return scores;
  }, 1800000); // 30 minutes cache
  sendSuccess(res, 200, 'Civic scores retrieved', data);
});

/**
 * GET /api/v1/transparency/departments
 */
exports.getDepartments = asyncHandler(async (req, res) => {
  const data = await withCache('departments', async () => {
    const depts = await DepartmentPerformance.find({ tenantId: 'default-municipality' })
      .populate('departmentId', 'name')
      .sort('-resolutionRate')
      .lean();
    return depts;
  }, 900000); // 15 minutes cache
  sendSuccess(res, 200, 'Department performance retrieved', data);
});

/**
 * GET /api/v1/transparency/resolved-complaints
 */
exports.getResolvedComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const cacheKey = `resolved_complaints_p${page}_l${limit}`;

  const data = await withCache(cacheKey, async () => {
    const complaints = await Complaint.find({ tenantId: 'default-municipality', status: { $in: ['resolved', 'closed'] } })
      .populate('department', 'name')
      .sort('-updatedAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
      
      // IMPORTANT: Scour PII
    return transparencyPrivacyService.anonymizeComplaints(complaints);
  }, 300000); // 5 minutes cache

  sendSuccess(res, 200, 'Resolved complaints retrieved', data);
});

/**
 * GET /api/v1/transparency/actions
 * Government verified actions taken
 */
exports.getActions = asyncHandler(async (req, res) => {
  const data = await withCache('actions', async () => {
    const alerts = await IntelligenceAlert.find({ 
      tenantId: 'default-municipality', 
      alertType: 'ActionTaken' 
    }).sort('-createdAt').limit(50).lean();
    return alerts.map(a => transparencyPrivacyService.anonymizeAction(a));
  }, 300000); // 5 minutes cache
  sendSuccess(res, 200, 'Government actions retrieved', data);
});

/**
 * GET /api/v1/transparency/impact
 */
exports.getImpact = asyncHandler(async (req, res) => {
  const data = await withCache('impact', async () => {
    const impacts = await CivicImpactScore.aggregate([
      { $match: { tenantId: 'default-municipality' } },
      {
        $group: {
          _id: null,
          totalCitizensBenefited: { $sum: '$citizensBenefited' }
        }
      }
    ]);
    return impacts[0] || { totalCitizensBenefited: 0 };
  }, 3600000); // 1 hour cache
  sendSuccess(res, 200, 'Impact metrics retrieved', data);
});

/**
 * GET /api/v1/transparency/map
 */
exports.getMap = asyncHandler(async (req, res) => {
  const data = await withCache('map', async () => {
    const complaints = await Complaint.find({ 
      tenantId: 'default-municipality',
      'location.geoPoint.coordinates': { $exists: true }
    })
    .select('location status priority category createdAt')
    .limit(1000)
    .lean();
    
    // Scour exact location data
    return transparencyPrivacyService.anonymizeComplaints(complaints);
  }, 300000); // 5 minutes cache
  sendSuccess(res, 200, 'Map points retrieved', data);
});

/**
 * GET /api/v1/transparency/success-stories
 */
exports.getSuccessStories = asyncHandler(async (req, res) => {
  const data = await withCache('success-stories', async () => {
    // Find top resolved complaints that impacted many citizens
    const stories = await Complaint.find({
      tenantId: 'default-municipality',
      status: { $in: ['resolved', 'closed'] },
      affectedCitizens: { $gt: 5 } // Arbitrary threshold
    })
    .sort('-affectedCitizens')
    .limit(10)
    .lean();

    return stories.map(s => {
      // Further anonymize for success stories narrative
      return {
        id: s._id,
        title: transparencyPrivacyService.sanitizeText(s.title),
        category: s.category,
        ward: s.location?.ward || 'Unknown Ward',
        resolutionTimeDays: Math.max(1, Math.round((new Date(s.updatedAt) - new Date(s.createdAt)) / (1000 * 60 * 60 * 24))),
        benefited: s.affectedCitizens * Math.floor(Math.random() * 50 + 50), // Simulate large impact grouping
        dateResolved: s.updatedAt
      };
    });
  }, 3600000); // 1 hour cache
  
  sendSuccess(res, 200, 'Success stories retrieved', data);
});
