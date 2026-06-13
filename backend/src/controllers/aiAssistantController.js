/**
 * AI Voice Assistant Controller
 * Coordinates voice interactions, session management, and workflow routing
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const voiceService = require('../services/voiceService');
const intentClassifier = require('../services/intentClassifierService');
const aiServiceIntegration = require('../services/aiServiceIntegration');
const civicIntelligenceService = require('../services/civicIntelligenceService');

const {
  VoiceConversationSession,
  VoiceConversationTurn,
  AiAssistantWorkflow,
  UserLanguagePreference
} = require('../models');

/**
 * POST /api/ai-assistant/init-session
 * Initialize voice conversation session
 */
const initializeSession = asyncHandler(async (req, res) => {
  const { language = 'en-IN', userId = null, deviceType = 'web' } = req.body;

  // Validate language
  if (!voiceService.isValidLanguage(language)) {
    return res.status(400).json(new AppError('Invalid language', 400));
  }

  const sessionId = crypto.randomUUID();
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    // Create session record in MongoDB
    const session = await VoiceConversationSession.create({
      sessionId,
      userId: userId || null,
      language,
      status: 'active',
      deviceType,
      browserInfo: userAgent,
      ipAddress
    });

    // If user is authenticated, get their language preferences
    let userPreferences = null;
    if (userId) {
      userPreferences = await UserLanguagePreference.findOne({ userId });
    }

    logger.info(`Session initialized: ${sessionId} for language: ${language}`);

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        language: session.language,
        status: session.status,
        userPreferences: userPreferences,
        supportedIntents: intentClassifier.getSupportedIntents(language),
        supportedLanguages: voiceService.getSupportedLanguages()
      }
    });
  } catch (error) {
    logger.error(`Session initialization error: ${error.message}`);
    res.status(500).json(new AppError('Failed to initialize session', 500));
  }
});

/**
 * POST /api/ai-assistant/process-voice
 * Process voice input (speech to text, intent classification, etc.)
 */
const processVoiceInput = asyncHandler(async (req, res) => {
  const { sessionId, audioBase64, language = 'en-IN' } = req.body;

  if (!sessionId || !audioBase64) {
    return res.status(400).json(new AppError('Missing sessionId or audio', 400));
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Detect voice activity
    const voiceActivity = await voiceService.detectVoiceActivity(audioBuffer);
    if (!voiceActivity.hasVoice) {
      return res.status(200).json({
        success: true,
        data: {
          silenceDetected: true,
          message: 'No voice detected. Please speak clearly.'
        }
      });
    }

    // Process voice input through pipeline
    const processedInput = await aiServiceIntegration.processVoiceInput(
      audioBuffer,
      language,
      sessionId
    );

    if (processedInput.error) {
      return res.status(200).json({
        success: true,
        data: {
          error: processedInput.error,
          message: 'Unable to process voice input. Please try again or use text input.'
        }
      });
    }

    // Log conversation turn
    await logConversationTurn(sessionId, {
      inputType: 'voice',
      inputText: processedInput.processed.text,
      speechConfidence: processedInput.processed.confidence,
      intent: processedInput.processed.intent,
      intentConfidence: processedInput.processed.intentConfidence,
      language: language
    });

    // Update session
    await updateSessionMetrics(sessionId, { voiceInputCount: 1 });

    logger.info(`Voice input processed: ${processedInput.processed.text}`);

    res.status(200).json({
      success: true,
      data: {
        text: processedInput.processed.text,
        confidence: processedInput.processed.confidence,
        intent: processedInput.processed.intent,
        intentConfidence: processedInput.processed.intentConfidence,
        alternatives: processedInput.processed.alternatives,
        languageMismatch: processedInput.processed.languageMismatch || false
      }
    });
  } catch (error) {
    logger.error(`Voice processing error: ${error.message}`);
    res.status(500).json(new AppError('Failed to process voice input', 500));
  }
});

/**
 * POST /api/ai-assistant/classify-intent
 * Classify text/speech intent
 */
const classifyUserIntent = asyncHandler(async (req, res) => {
  const { sessionId, text, language = 'en-IN' } = req.body;

  if (!text) {
    return res.status(400).json(new AppError('Missing text input', 400));
  }

  try {
    const result = await intentClassifier.classifyIntent(text, language);

    // Log conversation turn
    await logConversationTurn(sessionId, {
      inputType: 'text',
      inputText: text,
      intent: result.intent,
      intentConfidence: result.confidence,
      language: language
    });

    // Update session intent
    if (result.intent) {
      await updateSessionIntent(sessionId, result.intent);
    }

    // Update session metrics
    await updateSessionMetrics(sessionId, { textInputCount: 1 });

    logger.info(`Intent classified: ${result.intent} (${result.confidence})`);

    res.status(200).json({
      success: true,
      data: {
        intent: result.intent,
        confidence: result.confidence,
        alternatives: result.alternatives,
        fallback: result.fallback,
        message: result.message
      }
    });
  } catch (error) {
    logger.error(`Intent classification error: ${error.message}`);
    res.status(500).json(new AppError('Failed to classify intent', 500));
  }
});

/**
 * POST /api/ai-assistant/generate-speech
 * Convert text to speech
 */
const generateSpeech = asyncHandler(async (req, res) => {
  const { sessionId, text, language = 'en-IN', options = {} } = req.body;

  if (!text) {
    return res.status(400).json(new AppError('Missing text input', 400));
  }

  try {
    const ttsResult = await voiceService.textToSpeech(text, language, options);

    // Log conversation turn
    await logConversationTurn(sessionId, {
      responseType: 'voice',
      responseText: text,
      ttsDuration: ttsResult.duration,
      language: language,
      ttsGenerated: true
    });

    // Update session metrics
    await updateSessionMetrics(sessionId, { voiceOutputCount: 1 });

    logger.info(`Speech generated: ${text.substring(0, 50)}...`);

    res.status(200)
      .set({
        'Content-Type': `audio/${ttsResult.format}`,
        'X-Duration': ttsResult.duration,
        'Cache-Control': 'no-cache'
      })
      .send(ttsResult.audioBuffer);
  } catch (error) {
    logger.error(`Speech generation error: ${error.message}`);
    res.status(500).json(new AppError('Failed to generate speech', 500));
  }
});

/**
 * POST /api/ai-assistant/workflow/raise-complaint
 * Initialize complaint raising workflow
 */
const initiateRaiseComplaintWorkflow = asyncHandler(async (req, res) => {
  const { sessionId, userId, language = 'en-IN' } = req.body;

  try {
    const sessionDoc = await VoiceConversationSession.findOne({ sessionId });
    if (!sessionDoc) {
      return res.status(404).json(new AppError('Session not found', 404));
    }

    const workflow = await AiAssistantWorkflow.create({
      userId: userId || null,
      workflowType: 'RAISE_COMPLAINT',
      language,
      sessionId: sessionDoc._id,
      status: 'in_progress',
      currentStep: 'image_upload',
      completedSteps: []
    });

    // Update session intent
    await updateSessionIntent(sessionId, 'RAISE_COMPLAINT');

    logger.info(`Raise complaint workflow initiated: ${workflow._id}`);

    res.status(200).json({
      success: true,
      data: {
        workflowId: workflow._id,
        workflowType: workflow.workflowType,
        status: workflow.status,
        currentStep: 'image_upload',
        nextSteps: ['description', 'location', 'department', 'category', 'severity', 'submit']
      }
    });
  } catch (error) {
    logger.error(`Workflow initiation error: ${error.message}`);
    res.status(500).json(new AppError('Failed to initiate workflow', 500));
  }
});

/**
 * POST /api/ai-assistant/workflow/:workflowId/analyze-image
 * Analyze complaint image asynchronously
 */
const analyzeComplaintImage = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { imagePath, language = 'en-IN' } = req.body;

  if (!imagePath) {
    return res.status(400).json(new AppError('Missing image path', 400));
  }

  try {
    const imageBuffer = await readImageFile(imagePath);

    res.status(200).json({
      success: true,
      data: {
        workflowId: workflowId,
        analysisStarted: true,
        message: 'Image analysis started. Results will be streamed progressively.',
        pollEndpoint: `/api/ai-assistant/workflow/${workflowId}/analysis-status`,
        wsEndpoint: `/ws/ai-assistant/${workflowId}/analysis`
      }
    });

    // Start background analysis
    analyzeImageInBackground(workflowId, imageBuffer, language).catch(err => {
      logger.error(`Background analysis error: ${err.message}`);
    });
  } catch (error) {
    logger.error(`Image analysis error: ${error.message}`);
    res.status(500).json(new AppError('Failed to analyze image', 500));
  }
});

/**
 * GET /api/ai-assistant/workflow/:workflowId/analysis-status
 * Poll for analysis results
 */
const getAnalysisStatus = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;

  try {
    const workflow = await AiAssistantWorkflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json(new AppError('Workflow not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        workflowId: workflowId,
        department: {
          value: workflow.detectedDepartment,
          confidence: workflow.departmentConfidence,
          status: workflow.detectedDepartment ? 'complete' : 'pending'
        },
        category: {
          value: workflow.detectedCategory,
          confidence: workflow.categoryConfidence,
          status: workflow.detectedCategory ? 'complete' : 'pending'
        },
        severity: {
          value: workflow.detectedSeverity,
          confidence: workflow.severityConfidence,
          status: workflow.detectedSeverity ? 'complete' : 'pending'
        },
        allAnalysisComplete: !!(workflow.detectedDepartment && workflow.detectedCategory && workflow.detectedSeverity)
      }
    });
  } catch (error) {
    logger.error(`Status check error: ${error.message}`);
    res.status(500).json(new AppError('Failed to get analysis status', 500));
  }
});

/**
 * POST /api/ai-assistant/workflow/:workflowId/check-duplicates
 * Check for duplicate complaints
 */
const checkDuplicateComplaints = asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { description, location, department, category } = req.body;

  try {
    const duplicateCheckResult = await civicIntelligenceService.detectDuplicates({
      description,
      category: category || department,
      location
    });

    res.status(200).json({
      success: true,
      data: duplicateCheckResult
    });
  } catch (error) {
    logger.error(`Duplicate check error: ${error.message}`);
    res.status(500).json(new AppError('Failed to check for duplicates', 500));
  }
});

/**
 * POST /api/ai-assistant/close-session
 * Close voice conversation session
 */
const closeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await VoiceConversationSession.findOneAndUpdate(
      { sessionId },
      { status: 'completed', endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json(new AppError('Session not found', 404));
    }

    logger.info(`Session closed: ${sessionId}`);

    res.status(200).json({
      success: true,
      data: {
        sessionId: sessionId,
        status: 'closed'
      }
    });
  } catch (error) {
    logger.error(`Session close error: ${error.message}`);
    res.status(500).json(new AppError('Failed to close session', 500));
  }
});

/**
 * Helper functions
 */

const logConversationTurn = async (sessionId, turnData) => {
  try {
    const sessionDoc = await VoiceConversationSession.findOne({ sessionId });
    if (!sessionDoc) return;

    const turnCount = await VoiceConversationTurn.countDocuments({ sessionId: sessionDoc._id });
    const turnNumber = turnCount + 1;

    await VoiceConversationTurn.create({
      sessionId: sessionDoc._id,
      turnNumber,
      userInputType: turnData.inputType || 'text',
      userInputRaw: turnData.inputText || null,
      userInputProcessed: turnData.inputText || null,
      speechConfidence: turnData.speechConfidence || null,
      detectedIntent: turnData.intent || null,
      intentConfidence: turnData.intentConfidence || null,
      userInputLanguage: turnData.language || 'en-IN',
      assistantResponse: turnData.responseText || null,
      responseType: turnData.responseType || 'text',
      ttsGenerated: turnData.ttsGenerated || false,
      ttsDurationMs: turnData.ttsDuration || null
    });
  } catch (error) {
    logger.warn(`Error logging conversation turn: ${error.message}`);
  }
};

const updateSessionIntent = async (sessionId, intent) => {
  try {
    await VoiceConversationSession.updateOne({ sessionId }, { intent });
  } catch (error) {
    logger.warn(`Error updating session intent: ${error.message}`);
  }
};

const updateSessionMetrics = async (sessionId, metrics) => {
  try {
    const update = {};
    if (metrics.voiceInputCount) {
      update.$inc = update.$inc || {};
      update.$inc.voiceInputCount = metrics.voiceInputCount;
    }
    if (metrics.textInputCount) {
      update.$inc = update.$inc || {};
      update.$inc.textInputCount = metrics.textInputCount;
    }
    if (metrics.voiceOutputCount) {
      update.$inc = update.$inc || {};
      update.$inc.voiceOutputCount = metrics.voiceOutputCount;
    }

    if (Object.keys(update).length === 0) return;

    await VoiceConversationSession.updateOne({ sessionId }, update);
  } catch (error) {
    logger.warn(`Error updating session metrics: ${error.message}`);
  }
};

const analyzeImageInBackground = async (workflowId, imageBuffer, language) => {
  try {
    const progressCallback = async (type, value, confidence) => {
      // Update workflow with progressive results
      const update = {};
      update[`detected${type.charAt(0).toUpperCase() + type.slice(1)}`] = value;
      update[`${type}Confidence`] = confidence;

      await AiAssistantWorkflow.findByIdAndUpdate(workflowId, update);

      logger.info(`Workflow ${workflowId}: ${type} = ${value} (${confidence})`);
    };

    const results = await aiServiceIntegration.analyzeComplaintImage(
      imageBuffer,
      language,
      progressCallback
    );

    // Log AI predictions to the audit table
    await aiServiceIntegration.logAIPrediction(workflowId, 'department', {
      predictedValue: results.department,
      confidence: results.analysisMetadata.departmentConfidence,
      explanation: results.explanation.department,
      inputData: { language }
    });
    await aiServiceIntegration.logAIPrediction(workflowId, 'category', {
      predictedValue: results.category,
      confidence: results.analysisMetadata.categoryConfidence,
      explanation: results.explanation.category,
      inputData: { language }
    });
    await aiServiceIntegration.logAIPrediction(workflowId, 'severity', {
      predictedValue: results.severity,
      confidence: results.analysisMetadata.severityConfidence,
      explanation: results.explanation.severity,
      inputData: { language }
    });

    logger.info(`Background analysis complete for workflow ${workflowId}`);
  } catch (error) {
    logger.error(`Background analysis failed: ${error.message}`);
  }
};

const readImageFile = async (imagePath) => {
  const fs = require('fs').promises;
  return await fs.readFile(imagePath);
};

module.exports = {
  initializeSession,
  processVoiceInput,
  classifyUserIntent,
  generateSpeech,
  initiateRaiseComplaintWorkflow,
  analyzeComplaintImage,
  getAnalysisStatus,
  checkDuplicateComplaints,
  closeSession
};
