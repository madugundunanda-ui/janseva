const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { Complaint, ComplaintCluster, Hotspot, RiskAssessment, EmergencyZone, RecurringIssue, CivicImpactScore, DuplicateComplaintCheck, IntelligenceAlert } = require('../models');
const eventBus = require('./eventBus');

// Basic text similarity using word overlap
const basicTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  const normalize = (text) => text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size; // Jaccard similarity
};

class CivicIntelligenceService {
  /**
   * Detect duplicates for a given complaint using MongoDB 2dsphere $geoNear and Jaccard similarity
   */
  static async detectDuplicates(complaintData) {
    try {
      if (!complaintData.location || !complaintData.location.coordinates) {
        return { duplicatesFound: false, similarComplaints: [] };
      }

      const coordinates = complaintData.location.coordinates;
      let lat, lng;
      if (Array.isArray(coordinates)) {
        lng = Number(coordinates[0]);
        lat = Number(coordinates[1]);
      } else {
        lng = Number(coordinates.lng);
        lat = Number(coordinates.lat);
      }

      if (isNaN(lat) || isNaN(lng)) {
        return { duplicatesFound: false, similarComplaints: [] };
      }

      // GeoNear to limit search space to 200 meters, matching category
      const recentComplaints = await Complaint.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            maxDistance: 200, // 200 meters radius
            spherical: true,
            query: {
              status: { $nin: ['closed', 'rejected', 'resolved'] },
              category: new RegExp(`^${complaintData.category}$`, 'i'),
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        },
        { $limit: 10 }
      ]);

      const similarComplaints = [];

      for (const existing of recentComplaints) {
        // Exclude self if checking after creation
        if (complaintData._id && existing._id.toString() === complaintData._id.toString()) continue;

        const titleScore = basicTextSimilarity(complaintData.title, existing.title);
        const descScore = basicTextSimilarity(complaintData.description, existing.description);
        
        // Convert physical distance to score (0m = 100%, 200m = 0%)
        const distanceScore = Math.max(0, 1 - (existing.distance / 200));

        // Combined Score: 40% Geo Distance + 30% Title Similarity + 30% Description Similarity
        const combinedScore = (distanceScore * 0.40) + (titleScore * 0.30) + (descScore * 0.30);

        if (combinedScore > 0.65) {
          similarComplaints.push({
            complaintId: existing._id,
            complaintNumber: existing._id.toString().substring(0, 8).toUpperCase(),
            titleScore,
            descScore,
            distance: existing.distance,
            combinedScore,
            status: existing.status
          });
        }
      }

      similarComplaints.sort((a, b) => b.combinedScore - a.combinedScore);

      return {
        duplicatesFound: similarComplaints.length > 0,
        similarComplaints: similarComplaints.slice(0, 3)
      };
    } catch (err) {
      logger.error(`[CivicIntelligence] Duplicate detection failed: ${err.message}`);
      return { duplicatesFound: false, similarComplaints: [] };
    }
  }

  /**
   * Generate Complaint Clusters using Geospatial Bucketing / Centroid mapping
   * Eliminates the old O(N^2) JS loop by leveraging DB aggregation
   */
  static async generateClusters(tenantId = 'default-municipality') {
    try {
      logger.info('[CivicIntelligence] Generating complaint clusters...');
      
      // Clear existing active clusters
      await ComplaintCluster.deleteMany({ tenantId, clusterType: 'Complaint' });

      // Find areas with high density of similar categories within 500m
      // Note: MongoDB natively does not support DBSCAN. 
      // We'll use a geoNear aggregation trick by taking active complaints and finding neighbors.
      // To scale, we group by rounded coordinates (approx 500m grid) and then refine.
      
      // Grid grouping approach:
      // ~0.005 degrees is approx 500m at equator
      const precision = 0.005;

      const clusters = await Complaint.aggregate([
        { 
          $match: { 
            tenantId, 
            status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
            'location.geoPoint.coordinates': { $exists: true }
          } 
        },
        {
          $project: {
            category: 1,
            department: 1,
            priority: 1,
            ward: '$location.ward',
            coords: '$location.geoPoint.coordinates',
            gridLat: { $round: [{ $arrayElemAt: ['$location.geoPoint.coordinates', 1] }, 3] },
            gridLng: { $round: [{ $arrayElemAt: ['$location.geoPoint.coordinates', 0] }, 3] }
          }
        },
        {
          $group: {
            _id: { category: '$category', gridLat: '$gridLat', gridLng: '$gridLng' },
            complaintIds: { $push: '$_id' },
            complaintCount: { $sum: 1 },
            avgLat: { $avg: { $arrayElemAt: ['$coords', 1] } },
            avgLng: { $avg: { $arrayElemAt: ['$coords', 0] } },
            criticalCount: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
            highCount: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
            ward: { $first: '$ward' },
            department: { $first: '$department' }
          }
        },
        { $match: { complaintCount: { $gte: 3 } } } // A cluster needs at least 3 complaints
      ]);

      const clusterDocs = clusters.map(c => ({
        tenantId,
        clusterType: 'Complaint',
        category: c._id.category,
        department: c.department,
        complaintIds: c.complaintIds,
        complaintCount: c.complaintCount,
        severityProfile: {
          criticalCount: c.criticalCount,
          highCount: c.highCount
        },
        location: {
          type: 'Point',
          coordinates: [c.avgLng, c.avgLat]
        },
        radiusMeters: 500,
        ward: c.ward
      }));

      if (clusterDocs.length > 0) {
        await ComplaintCluster.insertMany(clusterDocs);
      }

      logger.info(`[CivicIntelligence] Created ${clusterDocs.length} complaint clusters.`);
      return clusterDocs;
    } catch (err) {
      logger.error(`[CivicIntelligence] Cluster generation failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Generate Hotspots (Replaces old geoService.js logic)
   */
  static async generateHotspots(tenantId = 'default-municipality') {
    try {
      logger.info('[CivicIntelligence] Generating hotspots...');
      await Hotspot.deleteMany({}); // Clear old

      // Aggregate all active complaints by Ward to compute density hotspots
      const wardAgg = await Complaint.aggregate([
        { 
          $match: { 
            tenantId, 
            status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
            'location.ward': { $exists: true, $ne: null }
          } 
        },
        {
          $group: {
            _id: '$location.ward',
            complaintCount: { $sum: 1 },
            avgLat: { $avg: { $arrayElemAt: ['$location.geoPoint.coordinates', 1] } },
            avgLng: { $avg: { $arrayElemAt: ['$location.geoPoint.coordinates', 0] } },
            emergencies: { $sum: { $cond: [{ $in: ['$priority', ['urgent', 'critical']] }, 1, 0] } }
          }
        },
        { $match: { complaintCount: { $gte: 5 } } }
      ]);

      const hotspots = wardAgg.map(w => {
        let priority = 'medium';
        if (w.complaintCount > 20 || w.emergencies > 2) priority = 'critical';
        else if (w.complaintCount > 10) priority = 'high';

        return {
          area: w._id,
          latitude: w.avgLat,
          longitude: w.avgLng,
          geoPoint: {
            type: 'Point',
            coordinates: [w.avgLng, w.avgLat]
          },
          complaintsCount: w.complaintCount,
          priority
        };
      });

      if (hotspots.length > 0) {
        await Hotspot.insertMany(hotspots);
      }

      return hotspots;
    } catch (err) {
      logger.error(`[CivicIntelligence] Hotspot generation failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Detect Emergency Zones (Flood, Collapse, Electrocution)
   */
  static async detectEmergencyZones(tenantId = 'default-municipality') {
    try {
      logger.info('[CivicIntelligence] Detecting emergency zones...');
      await EmergencyZone.updateMany({ tenantId }, { isActive: false });

      const emergencyKeywords = ['flood', 'collapse', 'fire', 'live wire', 'electrocution', 'accident', 'bridge'];
      
      const regex = new (RegExp)(emergencyKeywords.join('|'), 'i');

      const emergencies = await Complaint.aggregate([
        {
          $match: {
            tenantId,
            status: { $in: ['submitted', 'assigned', 'in_progress', 'escalated'] },
            $or: [
              { priority: { $in: ['critical', 'urgent'] } },
              { description: { $regex: regex } },
              { title: { $regex: regex } },
              { category: { $in: ['Disaster Management', 'Fire', 'Electrical Hazard', 'Road Collapse'] } },
              { isAIEmergency: true } // AI flag check
            ]
          }
        },
        {
          $project: {
            _id: 1,
            ward: '$location.ward',
            coords: '$location.geoPoint.coordinates',
            category: 1
          }
        },
        {
          $group: {
            _id: { ward: '$ward', category: '$category' },
            complaintIds: { $push: '$_id' },
            count: { $sum: 1 },
            avgLat: { $avg: { $arrayElemAt: ['$coords', 1] } },
            avgLng: { $avg: { $arrayElemAt: ['$coords', 0] } }
          }
        },
        { $match: { count: { $gte: 2 } } } // 2 critical issues in same ward/category is a zone
      ]);

      const zones = emergencies.map(e => ({
        tenantId,
        zoneName: `${e._id.ward} ${e._id.category} Emergency`,
        type: e._id.category,
        priorityLevel: 'Emergency',
        responseRecommendation: 'Immediate cross-departmental dispatch required.',
        complaintIds: e.complaintIds,
        location: { type: 'Point', coordinates: [e.avgLng, e.avgLat] },
        radiusMeters: 1000,
        ward: e._id.ward
      }));

      if (zones.length > 0) {
        await EmergencyZone.insertMany(zones);
      }

      return zones;
    } catch (err) {
      logger.error(`[CivicIntelligence] Emergency Zone detection failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Area Risk Engine (Replaces areaRiskEngine.js)
   */
  static async predictAreaRisks(tenantId = 'default-municipality') {
    try {
      logger.info(`[CivicIntelligence] Predicting Area Risks...`);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const areaRisks = await Complaint.aggregate([
        { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { $ifNull: ['$location.ward', 'Unknown Ward'] },
            total: { $sum: 1 },
            unresolved: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'assigned', 'in_progress', 'escalated']] }, 1, 0] } },
            emergencies: { $sum: { $cond: [{ $in: ['$priority', ['urgent', 'critical']] }, 1, 0] } }
          }
        },
        { $match: { total: { $gt: 5 } } }
      ]);

      const assessments = areaRisks.map(area => {
        let riskScore = (area.unresolved * 3) + (area.emergencies * 15);
        riskScore = Math.min(100, Math.max(0, riskScore));

        let category = 'Low';
        if (riskScore > 75) category = 'Critical';
        else if (riskScore > 50) category = 'High';
        else if (riskScore > 25) category = 'Medium';

        return {
          tenantId,
          areaName: area._id,
          riskType: area.emergencies > 0 ? 'Emergency Risk' : 'Volume Risk',
          riskScore,
          riskCategory: category,
          trendDescription: `Unresolved: ${area.unresolved}, Emergencies: ${area.emergencies}`,
          recommendedAction: category === 'Critical' ? 'Deploy Task Force' : 'Monitor'
        };
      });

      if (assessments.length > 0) {
        await RiskAssessment.insertMany(assessments);
      }

      return assessments;
    } catch (err) {
      logger.error(`[CivicIntelligence] Risk Prediction failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Detect Recurring Issues (Time Series Geospatial)
   */
  static async detectRecurringIssues(tenantId = 'default-municipality') {
    try {
      logger.info(`[CivicIntelligence] Detecting Recurring Issues...`);
      await RecurringIssue.updateMany({ tenantId }, { isActive: false });

      // Find issues closed/resolved repeatedly in the same area over 45 days
      const windowStart = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

      const issues = await Complaint.aggregate([
        { 
          $match: { 
            tenantId, 
            createdAt: { $gte: windowStart }
          }
        },
        {
          $project: {
            category: 1,
            ward: '$location.ward',
            gridLat: { $round: [{ $arrayElemAt: ['$location.geoPoint.coordinates', 1] }, 3] },
            gridLng: { $round: [{ $arrayElemAt: ['$location.geoPoint.coordinates', 0] }, 3] }
          }
        },
        {
          $group: {
            _id: { category: '$category', ward: '$ward', gridLat: '$gridLat', gridLng: '$gridLng' },
            occurrences: { $sum: 1 },
            avgLat: { $avg: '$gridLat' },
            avgLng: { $avg: '$gridLng' }
          }
        },
        { $match: { occurrences: { $gte: 5 } } } // Same category in same micro-grid 5+ times
      ]);

      const recurrences = issues.map(iss => ({
        tenantId,
        issueType: `${iss._id.category} Recurrence`,
        category: iss._id.category,
        occurrences: iss.occurrences,
        timeframeDays: 45,
        rootCauseCandidate: `Underlying infrastructural weakness in ${iss._id.ward} for ${iss._id.category}`,
        recommendedInspection: `Mandate deeper physical audit of ${iss._id.category} infrastructure in ${iss._id.ward}`,
        location: { type: 'Point', coordinates: [iss.avgLng, iss.avgLat] },
        radiusMeters: 500,
        ward: iss._id.ward,
        isActive: true
      }));

      if (recurrences.length > 0) {
        await RecurringIssue.insertMany(recurrences);
      }

      return recurrences;
    } catch (err) {
      logger.error(`[CivicIntelligence] Recurring Issue Detection failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Calculate Civic Impact
   */
  static async calculateCivicImpact(complaintId, userId) {
    try {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) return null;

      // Arbitrary heuristic: Severe issues benefit more people
      let multiplier = 50;
      if (complaint.priority === 'critical') multiplier = 500;
      else if (complaint.priority === 'urgent') multiplier = 200;

      // Check if it belongs to a cluster
      const cluster = await ComplaintCluster.findOne({ complaintIds: complaintId });
      if (cluster) {
        multiplier *= (cluster.complaintCount * 1.5);
      }

      const score = new CivicImpactScore({
        tenantId: complaint.tenantId,
        complaintId,
        userId,
        clusterId: cluster ? cluster._id : null,
        citizensBenefited: Math.round(multiplier),
        areaScoreImprovement: complaint.priority === 'critical' ? 5 : 1,
        ward: complaint.location?.ward
      });
      await score.save();
      return score;
    } catch (err) {
      logger.error(`[CivicIntelligence] Civic Impact Calculation failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Generate Heatmap Data
   */
  static async generateHeatmapData(tenantId = 'default-municipality') {
    try {
      logger.info('[CivicIntelligence] Generating Heatmap Data...');
      
      const heatmapPoints = await Complaint.aggregate([
        { 
          $match: { 
            tenantId, 
            status: { $in: ['submitted', 'assigned', 'in_progress', 'escalated'] },
            'location.geoPoint.coordinates': { $exists: true }
          }
        },
        {
          $project: {
            lat: { $arrayElemAt: ['$location.geoPoint.coordinates', 1] },
            lng: { $arrayElemAt: ['$location.geoPoint.coordinates', 0] },
            weight: { 
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'critical'] }, then: 10 },
                  { case: { $eq: ['$priority', 'urgent'] }, then: 8 },
                  { case: { $eq: ['$priority', 'high'] }, then: 5 }
                ],
                default: 2
              }
            }
          }
        }
      ]);

      return heatmapPoints;
    } catch (err) {
      logger.error(`[CivicIntelligence] Heatmap Data Generation failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Create an Intelligence Alert and broadcast via EventBus
   */
  static async createAlert(tenantId, alertType, message, severity, ward = null, referenceId = null) {
    try {
      const alert = await IntelligenceAlert.create({
        tenantId,
        alertType,
        message,
        severity,
        ward,
        referenceId
      });

      // Broadcast to notification service
      eventBus.emitEvent('IntelligenceAlertCreated', alert);

      return alert;
    } catch (err) {
      logger.error(`[CivicIntelligence] Failed to create Intelligence Alert: ${err.message}`);
    }
  }

  /**
   * Bulk Sync Engine
   */
  static async executeFullIntelligenceSync(tenantId = 'default-municipality') {
    try {
      logger.info('Starting Full Civic Intelligence Sync...');
      const clusters = await this.generateClusters(tenantId);
      const hotspots = await this.generateHotspots(tenantId);
      const emergencies = await this.detectEmergencyZones(tenantId);
      const risks = await this.predictAreaRisks(tenantId);
      const issues = await this.detectRecurringIssues(tenantId);

      // Optionally generate alerts based on these anomalies
      for (const e of emergencies) {
        await this.createAlert(tenantId, 'Emergency', `Critical: ${e.zoneName} detected!`, 'critical', e.ward, null);
      }
      for (const r of risks.filter(r => r.riskCategory === 'Critical')) {
        await this.createAlert(tenantId, 'Trend', `Risk Alert: Unresolved issues spiking in ${r.areaName}.`, 'high', r.areaName, null);
      }
      for (const i of issues) {
        await this.createAlert(tenantId, 'Recurring', `Systemic failure alert: ${i.issueType} in ${i.ward}.`, 'medium', i.ward, null);
      }
      logger.info('Full Civic Intelligence Sync Completed successfully.');
    } catch (err) {
      logger.error(`Intelligence Sync failed: ${err.message}`);
    }
  }

  /**
   * Detect duplicates and update clusters/hotspots after a complaint is created
   */
  static async detectDuplicateOrCluster(complaintId) {
    try {
      logger.info(`[CivicIntelligence] Running detectDuplicateOrCluster for complaint ${complaintId}`);
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        logger.warn(`[CivicIntelligence] Complaint ${complaintId} not found`);
        return;
      }

      // 1. Run duplicate check
      const dupResults = await this.detectDuplicates(complaint);
      if (dupResults.duplicatesFound && dupResults.similarComplaints.length > 0) {
        logger.info(`[CivicIntelligence] Duplicate(s) detected for complaint ${complaintId}`);
        await DuplicateComplaintCheck.create({
          newComplaintId: complaintId,
          similarComplaintIds: dupResults.similarComplaints.map(sc => sc.complaintId),
          descriptionSimilarityScores: dupResults.similarComplaints.map(sc => sc.descScore),
          locationProximityScores: dupResults.similarComplaints.map(sc => sc.distance),
          duplicateDetected: true,
          userAction: 'pending'
        });
      }

      // 2. Generate clusters & hotspots
      const tenantId = complaint.tenantId || 'default-municipality';
      await this.generateClusters(tenantId);
      await this.generateHotspots(tenantId);
      
    } catch (err) {
      logger.error(`[CivicIntelligence] detectDuplicateOrCluster failed: ${err.message}`);
    }
  }
}

module.exports = CivicIntelligenceService;
