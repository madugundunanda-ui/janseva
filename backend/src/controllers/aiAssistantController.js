/**
 * AI Voice Assistant Controller
 * Coordinates voice interactions, session management, and workflow routing
 */

const express = require('express');
const Pool = require('pg').Pool;
const uuid = require('uuid');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const voiceService = require('../services/voiceService');
const intentClassifier = require('../services/intentClassifierService');
const aiServiceIntegration = require('../services/aiServiceIntegration');
const duplicateDetectionService = require('../services/duplicateDetectionService');

// Database pool
const pool = require('../config/db');

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

  const sessionId = uuid.v4();
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    // Create session record
    const query = `
      INSERT INTO voice_conversation_sessions 
      (session_id, user_id, language, status, device_type, browser_info, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, session_id, language, status
    `;

    const result = await pool.query(query, [
      sessionId,
      userId || null,
      language,
      'active',
      deviceType,
      userAgent,
      ipAddress
    ]);

    const session = result.rows[0];

    // If user is authenticated, get their language preferences
    let userPreferences = null;
    if (userId) {
      const prefQuery = `
        SELECT * FROM user_language_preferences WHERE user_id = $1
      `;
      const prefResult = await pool.query(prefQuery, [userId]);
      userPreferences = prefResult.rows[0] || null;
    }

    logger.info(`Session initialized: ${sessionId} for language: ${language}`);

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.session_id,
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
    // Convert base64 to buffer
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
      language: language
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
    const query = `
      INSERT INTO ai_assistant_workflows 
      (user_id, workflow_type, language, session_id, status, current_step, completed_steps)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, workflow_type, status, language
    `;

    const result = await pool.query(query, [
      userId,
      'RAISE_COMPLAINT',
      language,
      sessionId,
      'in_progress',
      'image_upload',
      JSON.stringify([])
    ]);

    const workflow = result.rows[0];

    // Update session intent
    await updateSessionIntent(sessionId, 'RAISE_COMPLAINT');

    logger.info(`Raise complaint workflow initiated: ${workflow.id}`);

    res.status(200).json({
      success: true,
      data: {
        workflowId: workflow.id,
        workflowType: workflow.workflow_type,
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
    // Start async image analysis
    // Return immediately, stream results via WebSocket or polling
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

    // Start background analysis (don't wait for completion)
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
    const query = `
      SELECT id, detected_department, detected_category, detected_severity,
             department_confidence, category_confidence, severity_confidence,
             ai_suggestions
      FROM ai_assistant_workflows
      WHERE id = $1
    `;

    const result = await pool.query(query, [workflowId]);
    const workflow = result.rows[0];

    if (!workflow) {
      return res.status(404).json(new AppError('Workflow not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        workflowId: workflowId,
        department: {
          value: workflow.detected_department,
          confidence: workflow.department_confidence,
          status: workflow.detected_department ? 'complete' : 'pending'
        },
        category: {
          value: workflow.detected_category,
          confidence: workflow.category_confidence,
          status: workflow.detected_category ? 'complete' : 'pending'
        },
        severity: {
          value: workflow.detected_severity,
          confidence: workflow.severity_confidence,
          status: workflow.detected_severity ? 'complete' : 'pending'
        },
        allAnalysisComplete: !!(workflow.detected_department && workflow.detected_category && workflow.detected_severity)
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
  const { imagePath, description, location, department, category, language = 'en-IN' } = req.body;

  try {
    const imageBuffer = imagePath ? await readImageFile(imagePath) : null;

    const duplicateCheckResult = await duplicateDetectionService.checkForDuplicates(
      {
        imagePath: imagePath,
        description: description,
        location: location,
        department: department,
        category: category
      },
      language
    );

    // Record duplicate check
    if (duplicateCheckResult.duplicatesFound) {
      const similarIds = duplicateCheckResult.similarComplaints.map(c => c.complaintId);
      await duplicateDetectionService.recordDuplicateCheck(workflowId, similarIds, {});
    }

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
    const query = `
      UPDATE voice_conversation_sessions
      SET status = 'completed', end_time = CURRENT_TIMESTAMP
      WHERE session_id = $1
      RETURNING id, status
    `;

    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
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
    const getSessionQuery = `SELECT id FROM voice_conversation_sessions WHERE session_id = $1`;
    const sessionResult = await pool.query(getSessionQuery, [sessionId]);
    if (sessionResult.rows.length === 0) return;

    const sessionDbId = sessionResult.rows[0].id;

    const getTurnCountQuery = `SELECT COUNT(*) as count FROM voice_conversation_turns WHERE session_id = $1`;
    const turnCountResult = await pool.query(getTurnCountQuery, [sessionDbId]);
    const turnNumber = (turnCountResult.rows[0].count || 0) + 1;

    const insertQuery = `
      INSERT INTO voice_conversation_turns 
      (session_id, turn_number, user_input_type, user_input_raw, user_input_processed,
       speech_confidence, detected_intent, intent_confidence, user_input_language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await pool.query(insertQuery, [
      sessionDbId,
      turnNumber,
      turnData.inputType || null,
      turnData.inputText || null,
      turnData.inputText || null,
      turnData.speechConfidence || null,
      turnData.intent || null,
      turnData.intentConfidence || null,
      turnData.language || 'en-IN'
    ]);
  } catch (error) {
    logger.warn(`Error logging conversation turn: ${error.message}`);
  }
};

const updateSessionIntent = async (sessionId, intent) => {
  try {
    const query = `
      UPDATE voice_conversation_sessions
      SET intent = $1
      WHERE session_id = $2
    `;
    await pool.query(query, [intent, sessionId]);
  } catch (error) {
    logger.warn(`Error updating session intent: ${error.message}`);
  }
};

const updateSessionMetrics = async (sessionId, metrics) => {
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (metrics.voiceInputCount) {
      updates.push(`voice_input_count = voice_input_count + $${paramCount}`);
      values.push(metrics.voiceInputCount);
      paramCount++;
    }
    if (metrics.textInputCount) {
      updates.push(`text_input_count = text_input_count + $${paramCount}`);
      values.push(metrics.textInputCount);
      paramCount++;
    }
    if (metrics.voiceOutputCount) {
      updates.push(`voice_output_count = voice_output_count + $${paramCount}`);
      values.push(metrics.voiceOutputCount);
      paramCount++;
    }

    if (updates.length === 0) return;

    values.push(sessionId);
    const query = `
      UPDATE voice_conversation_sessions
      SET ${updates.join(', ')}
      WHERE session_id = $${paramCount}
    `;

    await pool.query(query, values);
  } catch (error) {
    logger.warn(`Error updating session metrics: ${error.message}`);
  }
};

const analyzeImageInBackground = async (workflowId, imageBuffer, language) => {
  try {
    const progressCallback = async (type, value, confidence) => {
      // Update workflow with progressive results
      const query = `
        UPDATE ai_assistant_workflows
        SET detected_${type} = $1, ${type}_confidence = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;
      await pool.query(query, [value, confidence, workflowId]);

      logger.info(`Workflow ${workflowId}: ${type} = ${value} (${confidence})`);
    };

    const analysisResult = await aiServiceIntegration.analyzeComplaintImage(
      imageBuffer,
      language,
      progressCallback
    );

    logger.info(`Background analysis complete for workflow ${workflowId}`);
  } catch (error) {
    logger.error(`Background analysis failed: ${error.message}`);
  }
};

const readImageFile = async (imagePath) => {
  // Placeholder - implement based on your storage solution
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
