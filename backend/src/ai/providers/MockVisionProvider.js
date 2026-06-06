const BaseVisionProvider = require('./BaseVisionProvider');
const logger = require('../../utils/logger');

class MockVisionProvider extends BaseVisionProvider {
  async analyzeImage(file) {
    logger.info('Using MockVisionProvider (Development Only) for image analysis', { filename: file.originalname });
    logger.info('[AI_REQUEST] Sending image analysis request to Mock API', { jobId: file.filename || file.originalname });

    const nameLower = (file.originalname || '').toLowerCase();
    
    // Simulate minor delay to emulate network request
    await new Promise(resolve => setTimeout(resolve, 300));

    let results;

    if (nameLower.includes('pothole') || nameLower.includes('road') || nameLower.includes('crack') || nameLower.includes('asphalt')) {
      results = {
        title: 'Road Surface Damage / Pothole',
        category: 'Road Damage',
        department: 'Roads & Highways',
        severity: 'medium',
        priority: 'medium',
        confidence: 90,
        emergency: false,
        explanation: ['Visible road structural damage', 'Vehicle alignment hazard']
      };
    } else if (nameLower.includes('garbage') || nameLower.includes('waste') || nameLower.includes('trash') || nameLower.includes('dump') || nameLower.includes('litter')) {
      results = {
        title: 'Garbage and Waste Pileup',
        category: 'Garbage / Waste',
        department: 'Sanitation',
        severity: 'medium',
        priority: 'medium',
        confidence: 92,
        emergency: false,
        explanation: ['Accumulated roadside litter', 'Public health/odor risk']
      };
    } else if (nameLower.includes('water') || nameLower.includes('leak') || nameLower.includes('pipe') || nameLower.includes('burst')) {
      results = {
        title: 'Water Utility Pipeline Leakage',
        category: 'Water Leakage',
        department: 'Water Supply',
        severity: 'medium',
        priority: 'medium',
        confidence: 88,
        emergency: false,
        explanation: ['Water pipe leak detected', 'Municipal water waste risk']
      };
    } else if (nameLower.includes('wire') || nameLower.includes('electric') || nameLower.includes('transformer') || nameLower.includes('power')) {
      const isExtreme = nameLower.includes('fire') || nameLower.includes('spark') || nameLower.includes('live');
      results = {
        title: isExtreme ? 'Severe Transformer Fire / Live Wire Hazard' : 'Electrical Infrastructure Issue',
        category: 'Electricity Problem',
        department: 'Electricity',
        severity: isExtreme ? 'urgent' : 'high',
        priority: isExtreme ? 'urgent' : 'high',
        confidence: 95,
        emergency: isExtreme,
        explanation: ['Exposed power line cables', isExtreme ? 'High immediate electrocution/fire risk' : 'Public safety concern']
      };
    } else if (nameLower.includes('light') || nameLower.includes('lamp') || nameLower.includes('streetlight')) {
      results = {
        title: 'Street Light Failure',
        category: 'Street Light Failure',
        department: 'Electricity',
        severity: 'low',
        priority: 'low',
        confidence: 85,
        emergency: false,
        explanation: ['Street lamp outage', 'Reduced safety/visibility at night']
      };
    } else {
      // Default low confidence fallback
      results = {
        title: '',
        category: 'Emergency Hazard',
        department: 'Emergency Response',
        severity: 'low',
        priority: 'low',
        confidence: 40,
        emergency: false,
        explanation: ['AI confidence is below governance reliability threshold']
      };
    }

    logger.info('[AI_RESPONSE] Mock Vision analysis completed successfully', { jobId: file.filename || file.originalname, results });
    return results;
  }

  async compareImages(beforeImagePath, afterFile) {
    logger.info('Using MockVisionProvider (Development Only) for image comparison');
    
    // Simulate minor delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      status: 'Verified',
      confidence: 85,
      differenceScore: 75,
      result: 'Issue appears resolved (mock verification)',
      reasons: ['Visual difference check complete', 'Problem objects successfully resolved']
    };
  }
}

module.exports = MockVisionProvider;
