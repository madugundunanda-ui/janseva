/**
 * AI Assistant Routes
 * REST API endpoints for JanSeva AI Voice Assistant
 */

const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateVoiceInput, validateIntentClassification } = require('../middleware/aiAssistantMiddleware');

/**
 * Public routes (no authentication required for initial session)
 */

/**
 * POST /api/ai-assistant/init-session
 * Initialize voice conversation session
 * Body: {language, userId?, deviceType?}
 */
router.post('/init-session', aiAssistantController.initializeSession);

/**
 * POST /api/ai-assistant/process-voice
 * Process voice input (speech to text, intent classification)
 * Body: {sessionId, audioBase64, language?}
 */
router.post('/process-voice', validateVoiceInput, aiAssistantController.processVoiceInput);

/**
 * POST /api/ai-assistant/classify-intent
 * Classify text/speech intent
 * Body: {sessionId, text, language?}
 */
router.post(
  '/classify-intent',
  validateIntentClassification,
  aiAssistantController.classifyUserIntent
);

/**
 * POST /api/ai-assistant/generate-speech
 * Convert text to speech
 * Body: {sessionId, text, language?, options?}
 */
router.post('/generate-speech', aiAssistantController.generateSpeech);

/**
 * POST /api/ai-assistant/close-session
 * Close voice conversation session
 * Body: {sessionId}
 */
router.post('/close-session', aiAssistantController.closeSession);

/**
 * Workflow routes (may require authentication)
 */

/**
 * POST /api/ai-assistant/workflow/raise-complaint
 * Initialize complaint raising workflow
 * Body: {sessionId, userId, language?}
 */
router.post(
  '/workflow/raise-complaint',
  protect,
  aiAssistantController.initiateRaiseComplaintWorkflow
);

/**
 * POST /api/ai-assistant/workflow/:workflowId/analyze-image
 * Analyze complaint image (async)
 * Body: {imagePath, language?}
 */
router.post(
  '/workflow/:workflowId/analyze-image',
  protect,
  aiAssistantController.analyzeComplaintImage
);

/**
 * GET /api/ai-assistant/workflow/:workflowId/analysis-status
 * Poll for image analysis results
 */
router.get(
  '/workflow/:workflowId/analysis-status',
  protect,
  aiAssistantController.getAnalysisStatus
);

/**
 * POST /api/ai-assistant/workflow/:workflowId/check-duplicates
 * Check for duplicate complaints
 * Body: {imagePath?, description, location, department, category, language?}
 */
router.post(
  '/workflow/:workflowId/check-duplicates',
  protect,
  aiAssistantController.checkDuplicateComplaints
);

module.exports = router;
