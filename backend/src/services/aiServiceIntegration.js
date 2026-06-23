/**
 * AI Service Integration Layer
 * Coordinates between multiple AI services (image analysis, intent classification, etc.)
 * Handles async operations, caching, and fallbacks
 */

const logger = require('../utils/logger');
const voiceService = require('./voiceService');
const intentClassifier = require('./intentClassifierService');
const { AiPredictionAudit } = require('../models');
const VisionProviderFactory = require('../ai/providers/VisionProviderFactory');

// In-memory zero-dependency cache implementation
class SimpleCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.stdTTL = (options.stdTTL || 3600) * 1000;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl) {
    const duration = ttl ? ttl * 1000 : this.stdTTL;
    this.cache.set(key, {
      value,
      expiry: Date.now() + duration
    });
    return true;
  }

  del(key) {
    return this.cache.delete(key);
  }

  flushAll() {
    this.cache.clear();
  }

  getStats() {
    return { keys: this.cache.size };
  }
}

const aiCache = new SimpleCache({ stdTTL: 3600 });

// AI Service endpoints (kept for backwards compatibility if needed, but not used in local execution)
const AI_ENDPOINTS = {
  IMAGE_ANALYSIS: process.env.IMAGE_ANALYSIS_API || 'http://localhost:5003/analyze-image',
  DEPARTMENT_DETECTION: process.env.DEPT_DETECTION_API || 'http://localhost:5003/detect-department',
  CATEGORY_DETECTION: process.env.CATEGORY_DETECTION_API || 'http://localhost:5003/detect-category',
  SEVERITY_DETECTION: process.env.SEVERITY_DETECTION_API || 'http://localhost:5003/detect-severity'
};

// Default timeout for AI service calls
const AI_CALL_TIMEOUT = 8000; // 8 seconds

/**
 * Analyze complaint image and extract department, category, severity
 * Returns progressive updates (streams results as they become available)
 * Non-blocking operation
 * 
 * @param {Buffer} imageBuffer - Image data
 * @param {string} language - Language code
 * @param {function} progressCallback - Callback to stream results: (type, data, confidence) => {}
 * @returns {Promise<{department, category, severity, explanation}>}
 */
const analyzeComplaintImage = async (imageBuffer, language = 'en-IN', progressCallback = null) => {
  try {
    logger.info('Starting local image analysis for complaint...');

    const results = {
      department: null,
      category: null,
      severity: null,
      explanation: {},
      analysisMetadata: {
        startTime: Date.now(),
        endTime: null,
        totalDuration: null,
        departmentConfidence: 0,
        categoryConfidence: 0,
        severityConfidence: 0
      }
    };

    // Check cache
    const cacheKey = `image_analysis_${Buffer.from(imageBuffer).toString('base64').substring(0, 100)}`;
    const cachedResult = aiCache.get(cacheKey);
    if (cachedResult) {
      logger.info('Using cached image analysis result');
      if (progressCallback) {
        progressCallback('department', cachedResult.department, cachedResult.analysisMetadata.departmentConfidence);
        progressCallback('category', cachedResult.category, cachedResult.analysisMetadata.categoryConfidence);
        progressCallback('severity', cachedResult.severity, cachedResult.analysisMetadata.severityConfidence);
      }
      return cachedResult;
    }

    // Write buffer to temporary file for VisionProvider
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), `janseva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`);
    fs.writeFileSync(tempPath, imageBuffer);

    const file = {
      path: tempPath,
      mimetype: 'image/jpeg',
      originalname: 'complaint.jpg',
      filename: 'complaint.jpg'
    };

    let result;
    try {
      const provider = VisionProviderFactory.getProvider();
      result = await provider.analyzeImage(file);
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (err) {
        logger.warn(`Failed to clean up temp file: ${err.message}`);
      }
    }

    results.department = result.department || 'Roads & Highways';
    results.category = result.category || 'Road Damage';
    results.severity = (result.severity || 'medium').toLowerCase();
    results.analysisMetadata.departmentConfidence = result.confidence || 85;
    results.analysisMetadata.categoryConfidence = result.confidence || 85;
    results.analysisMetadata.severityConfidence = result.confidence || 85;
    results.explanation = {
      department: result.explanation?.[0] || 'Department detected from image analysis',
      category: result.explanation?.[0] || 'Category detected from image analysis',
      severity: result.explanation?.[1] || 'Severity estimated from image analysis'
    };

    // Trigger progressive callbacks
    if (progressCallback) {
      progressCallback('department', results.department, results.analysisMetadata.departmentConfidence);
      progressCallback('category', results.category, results.analysisMetadata.categoryConfidence);
      progressCallback('severity', results.severity, results.analysisMetadata.severityConfidence);
    }

    results.analysisMetadata.endTime = Date.now();
    results.analysisMetadata.totalDuration = results.analysisMetadata.endTime - results.analysisMetadata.startTime;

    // Cache the result
    aiCache.set(cacheKey, results);

    return results;
  } catch (error) {
    logger.error(`Image analysis error: ${error.message}`);
    throw error;
  }
};

/**
 * Process voice input through full pipeline
 * Speech → Intent Classification → Workflow Routing
 * 
 * @param {Buffer} audioBuffer - Audio data
 * @param {string} language - Language code
 * @param {string} sessionId - Voice session ID
 * @returns {Promise<{text, intent, confidence, routing, alternatives}>}
 */
const processVoiceInput = async (audioBuffer, language = 'en-IN', sessionId = null) => {
  try {
    logger.info('Processing voice input through pipeline...');

    const result = {
      raw: {},
      processed: {},
      error: null
    };

    // Step 1: Convert speech to text
    try {
      result.raw.speechToText = await voiceService.speechToText(audioBuffer, language);
      result.processed.text = result.raw.speechToText.text;
      result.processed.confidence = result.raw.speechToText.confidence;
    } catch (error) {
      logger.error(`Speech-to-text failed: ${error.message}`);
      result.error = 'Unable to convert speech to text';
      throw error;
    }

    // Step 2: Classify intent
    try {
      result.raw.intentClassification = await intentClassifier.classifyIntent(result.processed.text, language);
      result.processed.intent = result.raw.intentClassification.intent;
      result.processed.intentConfidence = result.raw.intentClassification.confidence;
      result.processed.alternatives = result.raw.intentClassification.alternatives;
    } catch (error) {
      logger.error(`Intent classification failed: ${error.message}`);
      result.error = 'Unable to classify intent';
    }

    // Step 3: Detect language (validate)
    try {
      const detected = await voiceService.detectLanguage(result.processed.text);
      result.processed.detectedLanguage = detected.language;
      result.processed.languageConfidence = detected.confidence;

      // Check for language mixing
      if (detected.language !== language && detected.confidence > 0.8) {
        logger.warn(`Language mismatch: Expected ${language}, detected ${detected.language}`);
        result.processed.languageMismatch = true;
      }
    } catch (error) {
      logger.warn(`Language detection failed: ${error.message}`);
    }

    return result;
  } catch (error) {
    logger.error(`Voice input processing error: ${error.message}`);
    throw error;
  }
};

/**
 * Store AI prediction for audit log
 * @param {string} workflowId - Workflow ID (ObjectId)
 * @param {string} predictionType - 'department', 'category', 'severity', 'duplicate_detection'
 * @param {object} predictionData - {predicted_value, confidence, input_data, explanation}
 * @returns {Promise<void>}
 */
const logAIPrediction = async (workflowId, predictionType, predictionData) => {
  try {
    const modelVersion = process.env.AI_MODEL_VERSION || '1.0';

    await AiPredictionAudit.create({
      workflowId,
      predictionType,
      inputData: predictionData.inputData || {},
      predictedValue: predictionData.predictedValue || null,
      confidenceScore: predictionData.confidence || 0,
      aiModelVersion: modelVersion,
      explanation: predictionData.explanation || null
    });

    logger.info(`Logged AI prediction for workflow ${workflowId}`);
  } catch (error) {
    logger.error(`Error logging AI prediction: ${error.message}`);
  }
};

/**
 * Generate explanation for AI prediction
 * Format: "X detected because Y features were identified"
 * 
 * @param {string} predictionType - Type of prediction
 * @param {object} predictionData - Prediction data with features
 * @param {string} language - Language code
 * @returns {string}
 */
const generatePredictionExplanation = (predictionType, predictionData, language = 'en-IN') => {
  const explanations = {
    'en-IN': {
      department: `${predictionData.department} department identified because ${(predictionData.features || []).join(', ')} were detected in the image.`,
      category: `${predictionData.category} category identified because ${(predictionData.features || []).join(', ')} were detected.`,
      severity: `${predictionData.severity} severity identified because ${(predictionData.features || []).join(', ')} indicate this level of issue.`
    },
    'te-IN': {
      department: `${predictionData.department} విభాగం గుర్తించబడింది ఎందుకంటే ${(predictionData.features || []).join(', ')} చిత్రంలో గుర్తించబడ్డాయి.`,
      category: `${predictionData.category} వర్గం గుర్తించబడింది ఎందుకంటే ${(predictionData.features || []).join(', ')} గుర్తించబడ్డాయి.`,
      severity: `${predictionData.severity} తీవ్రత గుర్తించబడింది ఎందుకంటే ${(predictionData.features || []).join(', ')} ఈ స్థాయి సమస్య సూచిస్తాయి.`
    },
    'ta-IN': {
      department: `${predictionData.department} துறை அடையாளம் காணப்பட்டது ஏனெனில் ${(predictionData.features || []).join(', ')} பட்டணத்தில் கண்டறியப்பட்டது.`,
      category: `${predictionData.category} வகை அடையாளம் காணப்பட்டது ஏனெனில் ${(predictionData.features || []).join(', ')} கண்டறியப்பட்டது.`,
      severity: `${predictionData.severity} கடுமை அடையாளம் காணப்பட்டது ஏனெனில் ${(predictionData.features || []).join(', ')} இந்த அளவிலான சிக்கலைக் குறிக்கும்.`
    },
    'kn-IN': {
      department: `${predictionData.department} ವಿಭಾಗ ಗುರುತಿಸಲಾಗಿದೆ ಏಕೆಂದರೆ ${(predictionData.features || []).join(', ')} ಚಿತ್ರದಲ್ಲಿ ಗುರುತಿಸಲಾಗಿದೆ.`,
      category: `${predictionData.category} ವರ್ಗ ಗುರುತಿಸಲಾಗಿದೆ ಏಕೆಂದರೆ ${(predictionData.features || []).join(', ')} ಗುರುತಿಸಲಾಗಿದೆ.`,
      severity: `${predictionData.severity} ತೀವ್ರತೆ ಗುರುತಿಸಲಾಗಿದೆ ಏಕೆಂದರೆ ${(predictionData.features || []).join(', ')} ಈ ಹಂತದ ಸಮಸ್ಯೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ.`
    }
  };

  return explanations[language]?.[predictionType] ||
    explanations['en-IN'][predictionType] ||
    'AI prediction generated based on image analysis.';
};

/**
 * Clear cache for specific key or all
 * @param {string} key - Cache key (optional)
 */
const clearAICache = (key = null) => {
  if (key) {
    aiCache.del(key);
  } else {
    aiCache.flushAll();
  }
};

/**
 * Get cache statistics
 * @returns {object}
 */
const getCacheStats = () => aiCache.getStats();

module.exports = {
  analyzeComplaintImage,
  processVoiceInput,
  logAIPrediction,
  generatePredictionExplanation,
  clearAICache,
  getCacheStats,
  AI_ENDPOINTS,
  AI_CALL_TIMEOUT
};

