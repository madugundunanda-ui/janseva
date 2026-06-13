const eventBus = require('./eventBus');
const { Complaint, Department, User } = require('../models');
const logger = require('../utils/logger');

// Simulated AI Analytics function
const analyzeGovernanceTrends = async () => {
  try {
    logger.info('[IntelligenceService] Running periodic smart governance analysis...');
    
    // In a real application, this would query aggregated timeseries data.
    // For demo purposes, we will construct a smart alert.
    
    // Find admins to send insight
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      eventBus.emitEvent('GovernanceInsight', {
        recipientId: admin._id,
        data: {
          insight: 'Road complaints increased 42% in Tirupati this month.',
          recommendation: 'Allocate additional Public Works budget to the Tirupati sector.'
        }
      });
    }

    logger.info('[IntelligenceService] Governance insight analysis complete.');
  } catch (err) {
    logger.error(`[IntelligenceService] Trend analysis failed: ${err.message}`);
  }
};

// Expose manual trigger for demo/API purposes
const triggerInsightManual = () => {
  return analyzeGovernanceTrends();
};

module.exports = {
  analyzeGovernanceTrends,
  triggerInsightManual
};
