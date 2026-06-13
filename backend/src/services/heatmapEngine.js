const { Complaint, HeatmapData } = require('../models');
const logger = require('../utils/logger');

class HeatmapEngine {
  static async computeHeatmaps(tenantId = 'default-municipality') {
    logger.info(`[HeatmapEngine] Generating spatial data for tenant ${tenantId}`);
    try {
      const now = new Date();
      const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const geoComplaints = await Complaint.find({
        tenantId,
        createdAt: { $gte: past30Days },
        'location.latitude': { $ne: null },
        'location.longitude': { $ne: null }
      });

      const densityPoints = [];
      const emergencyPoints = [];

      geoComplaints.forEach(c => {
        // Base weight 1
        densityPoints.push({ lat: c.location.latitude, lng: c.location.longitude, weight: 1 });
        
        if (['urgent', 'critical'].includes(c.priority)) {
          emergencyPoints.push({ lat: c.location.latitude, lng: c.location.longitude, weight: 5 });
        }
      });

      const records = [
        new HeatmapData({ tenantId, mapType: 'Complaint Density', points: densityPoints }),
        new HeatmapData({ tenantId, mapType: 'Emergency Density', points: emergencyPoints })
      ];

      await HeatmapData.insertMany(records);
      logger.info(`[HeatmapEngine] Saved heatmap layers.`);
      return 2;
    } catch (err) {
      logger.error(`[HeatmapEngine] Error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = HeatmapEngine;
