const VisionProvider = require('./VisionProvider');
const logger = require('../../utils/logger');
const fs = require('fs');

class MockVisionProvider extends VisionProvider {
  constructor(fallbackUrl = 'http://localhost:8000') {
    super();
    this.fallbackUrl = fallbackUrl;
  }

  async analyzeImage(file) {
    logger.info('Using MockVisionProvider for image analysis', { filename: file.originalname });

    // 1. Try local Python Flask service first if available
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s fast health check
      const healthRes = await fetch(`${this.fallbackUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData.status === 'healthy') {
          logger.info('Local Python AI service is healthy. Bypassing mock to use local model.');
          
          const fileStream = fs.createReadStream(file.path);
          const formData = new FormData();
          formData.append('image', fileStream, file.originalname);
          
          const response = await fetch(`${this.fallbackUrl}/predict`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const prediction = await response.json();
            logger.info('Python AI service response successful in VisionProvider', { prediction });
            return {
              title: prediction.title || 'Civic Issue',
              description: prediction.description || 'Issue detected via visual analysis.',
              category: prediction.category || 'Road Damage',
              department: prediction.department || 'Roads & Transport',
              severity: prediction.priority || 'medium',
              priority: prediction.priority || 'medium',
              reasons: prediction.reasons || ['Local model visual check complete'],
              confidence: prediction.confidence || 85,
              low_confidence: !!prediction.low_confidence,
              broad_category: prediction.broad_category || 'roads'
            };
          }
        }
      }
    } catch (healthErr) {
      logger.warn('MockVisionProvider health pre-check failed. Using keyword fallback rules.', { message: healthErr.message });
    }

    // 2. Local heuristic rule fallback based on filename/originalname keywords
    const nameLower = (file.originalname || '').toLowerCase();
    
    // Simulate < 500ms delay to make it feel premium but ultra-fast
    await new Promise(resolve => setTimeout(resolve, 300));

    if (nameLower.includes('pothole') || nameLower.includes('road') || nameLower.includes('crack') || nameLower.includes('asphalt')) {
      return {
        title: 'Road Surface Damage / Pothole',
        description: 'Pothole or cracked asphalt detected, posing risk to vehicles and pedestrians.',
        category: 'Road Damage',
        department: 'Roads & Transport',
        severity: 'medium',
        priority: 'medium',
        reasons: ['Visible road structural damage', 'Pedestrian hazard'],
        confidence: 90,
        low_confidence: false,
        broad_category: 'roads'
      };
    }

    if (nameLower.includes('garbage') || nameLower.includes('waste') || nameLower.includes('trash') || nameLower.includes('dump') || nameLower.includes('litter')) {
      return {
        title: 'Garbage and Waste Pileup',
        description: 'Garbage accumulation detected in public space causing sanitation concern.',
        category: 'Garbage / Waste',
        department: 'Waste Management',
        severity: 'medium',
        priority: 'medium',
        reasons: ['Accumulated roadside litter', 'Public health/odor risk'],
        confidence: 92,
        low_confidence: false,
        broad_category: 'sanitation'
      };
    }

    if (nameLower.includes('water') || nameLower.includes('leak') || nameLower.includes('pipe') || nameLower.includes('burst')) {
      return {
        title: 'Water Utility Pipeline Leakage',
        description: 'Water leaking or line burst detected causing municipal water waste.',
        category: 'Water Leakage',
        department: 'Water Supply',
        severity: 'medium',
        priority: 'medium',
        reasons: ['Water pipe leak detected', 'Risk of flooding/wastage'],
        confidence: 88,
        low_confidence: false,
        broad_category: 'water'
      };
    }

    if (nameLower.includes('drain') || nameLower.includes('sewer') || nameLower.includes('manhole') || nameLower.includes('sewage')) {
      return {
        title: 'Blocked Drainage / Sewage Overflow',
        description: 'Blocked sewer line or stormwater drain causing dirty wastewater overflow.',
        category: 'Drainage Issue',
        department: 'Drainage',
        severity: 'high',
        priority: 'high',
        reasons: ['Blocked sewage outlet overflowing', 'Biohazard warning'],
        confidence: 94,
        low_confidence: false,
        broad_category: 'drainage'
      };
    }

    if (nameLower.includes('wire') || nameLower.includes('electric') || nameLower.includes('transformer') || nameLower.includes('power')) {
      return {
        title: 'Electrical Infrastructure Problem',
        description: 'Electrical hazard, hanging cables, or transformer fault posing safety threat.',
        category: 'Electricity Problem',
        department: 'Electricity',
        severity: 'high',
        priority: 'high',
        reasons: ['Exposed power line cables', 'High electrocution/fire risk'],
        confidence: 95,
        low_confidence: false,
        broad_category: 'electricity'
      };
    }

    if (nameLower.includes('light') || nameLower.includes('lamp') || nameLower.includes('streetlight')) {
      return {
        title: 'Street Light Failure / Outage',
        description: 'Broken or non-functioning street lighting causing dark public space.',
        category: 'Street Light Failure',
        department: 'Street Lighting',
        severity: 'low',
        priority: 'low',
        reasons: ['Damaged street lamp post', 'Insufficient lighting risk'],
        confidence: 85,
        low_confidence: false,
        broad_category: 'electricity'
      };
    }

    // Default fallback when no keywords match (simulate low-confidence/blurry image behavior)
    return {
      title: '',
      description: 'Unable to confidently identify issue type. Please select the category and fill details manually.',
      category: '',
      department: 'General Inquiry',
      severity: 'low',
      priority: 'low',
      reasons: ['AI confidence is below governance reliability threshold'],
      confidence: 0,
      low_confidence: true,
      broad_category: ''
    };
  }
}

module.exports = MockVisionProvider;
