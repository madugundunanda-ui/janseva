/**
 * AI Service Integration Layer
 * Coordinates between multiple AI services (image analysis, intent classification, etc.)
 * Handles async operations, caching, and fallbacks
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const voiceService = require('./voiceService');
const intentClassifier = require('./intentClassifierService');
const duplicateDetectionService = require('./duplicateDetectionService');
const Pool = require('pg').Pool;

// Database pool
const pool = require('../config/db');

// Initialize cache (TTL: 1 hour)
const aiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// AI Service endpoints
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
    logger.info('Starting image analysis for complaint...');

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
      return cachedResult;
    }

    try {
      // Step 1: Detect Department (typically fastest)
      const departmentPromise = detectDepartment(imageBuffer, language)
        .then(result => {
          results.department = result.department;
          results.analysisMetadata.departmentConfidence = result.confidence;
          results.explanation.department = result.explanation;
          if (progressCallback) progressCallback('department', result.department, result.confidence);
          logger.info(`Department detected: ${result.department} (${result.confidence})`);
        })
        .catch(err => logger.warn(`Department detection failed: ${err.message}`));

      // Step 2: Detect Category (medium complexity)
      const categoryPromise = Promise.resolve().then(() => {
        // Wait for department to be available before detecting category
        return new Promise(resolve => {
          const checkDept = () => {
            if (results.department) {
              resolve();
            } else {
              setTimeout(checkDept, 100);
            }
          };
          checkDept();
        });
      }).then(() => 
        detectCategory(imageBuffer, language, results.department)
          .then(result => {
            results.category = result.category;
            results.analysisMetadata.categoryConfidence = result.confidence;
            results.explanation.category = result.explanation;
            if (progressCallback) progressCallback('category', result.category, result.confidence);
            logger.info(`Category detected: ${result.category} (${result.confidence})`);
          })
          .catch(err => logger.warn(`Category detection failed: ${err.message}`))
      );

      // Step 3: Detect Severity (usually fastest or parallel)
      const severityPromise = detectSeverity(imageBuffer, language)
        .then(result => {
          results.severity = result.severity;
          results.analysisMetadata.severityConfidence = result.confidence;
          results.explanation.severity = result.explanation;
          if (progressCallback) progressCallback('severity', result.severity, result.confidence);
          logger.info(`Severity detected: ${result.severity} (${result.confidence})`);
        })
        .catch(err => logger.warn(`Severity detection failed: ${err.message}`));

      // Run in parallel with timeout
      await Promise.race([
        Promise.all([departmentPromise, categoryPromise, severityPromise]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI analysis timeout')), AI_CALL_TIMEOUT)
        )
      ]);

    } catch (timeoutError) {
      logger.warn(`AI analysis timeout after ${AI_CALL_TIMEOUT}ms: ${timeoutError.message}`);
      // Return partial results even on timeout
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
 * Detect department from image
 * @private
 */
const detectDepartment = async (imageBuffer, language) => {
  try {
    const response = await axios.post(
      AI_ENDPOINTS.DEPARTMENT_DETECTION,
      { image: imageBuffer.toString('base64'), language },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    return {
      department: response.data.department || null,
      confidence: response.data.confidence || 0,
      explanation: response.data.explanation || 'Department detected from image analysis',
      alternatives: response.data.alternatives || []
    };
  } catch (error) {
    logger.warn(`Department detection API error: ${error.message}`);
    return {
      department: null,
      confidence: 0,
      explanation: 'Unable to detect department'
    };
  }
};

/**
 * Detect category from image
 * @private
 */
const detectCategory = async (imageBuffer, language, department) => {
  try {
    const response = await axios.post(
      AI_ENDPOINTS.CATEGORY_DETECTION,
      {
        image: imageBuffer.toString('base64'),
        language,
        department // Pass detected department to improve accuracy
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    return {
      category: response.data.category || null,
      confidence: response.data.confidence || 0,
      explanation: response.data.explanation || 'Category detected from image analysis',
      alternatives: response.data.alternatives || []
    };
  } catch (error) {
    logger.warn(`Category detection API error: ${error.message}`);
    return {
      category: null,
      confidence: 0,
      explanation: 'Unable to detect category'
    };
  }
};

/**
 * Detect severity from image
 * @private
 */
const detectSeverity = async (imageBuffer, language) => {
  try {
    const response = await axios.post(
      AI_ENDPOINTS.SEVERITY_DETECTION,
      { image: imageBuffer.toString('base64'), language },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    return {
      severity: response.data.severity || 'medium',
      confidence: response.data.confidence || 0,
      explanation: response.data.explanation || 'Severity estimated from image analysis',
      alternatives: response.data.alternatives || []
    };
  } catch (error) {
    logger.warn(`Severity detection API error: ${error.message}`);
    return {
      severity: 'medium',
      confidence: 0,
      explanation: 'Unable to detect severity'
    };
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
 * @param {integer} workflowId - Workflow ID
 * @param {string} predictionType - 'department', 'category', 'severity', 'duplicate_detection'
 * @param {object} predictionData - {predicted_value, confidence, input_data, explanation}
 * @returns {Promise<void>}
 */
const logAIPrediction = async (workflowId, predictionType, predictionData) => {
  try {
    const query = `
      INSERT INTO ai_prediction_audits 
      (workflow_id, prediction_type, input_data, predicted_value, confidence_score, 
       ai_model_version, explanation)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const modelVersion = process.env.AI_MODEL_VERSION || '1.0';

    await pool.query(query, [
      workflowId,
      predictionType,
      JSON.stringify(predictionData.inputData || {}),
      predictionData.predictedValue || null,
      predictionData.confidence || 0,
      modelVersion,
      predictionData.explanation || null
    ]);

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
