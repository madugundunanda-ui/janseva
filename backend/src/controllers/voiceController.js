const asyncHandler = require('../utils/asyncHandler');
const { VoiceInteraction } = require('../models');
const voiceIntentService = require('../services/voiceIntentService');
const { Complaint } = require('../models');

const interact = asyncHandler(async (req, res) => {
  const { text, language = 'en-IN', sessionId, workflowName = 'MAIN_MENU', deviceType, browser } = req.body;
  const startTime = Date.now();

  let activeIntent = 'UNKNOWN';
  let systemResponse = '';
  let nextAction = null;
  let success = true;
  let abandonmentReason = null;
  let payload = {};

  // Sanitize transcript (basic removal of dangerous characters)
  const sanitizedText = text ? text.replace(/[<>]/g, '') : '';

  // Process Explicit State Machine
  switch (workflowName) {
    case 'RAISE_COMPLAINT_DESCRIPTION':
      activeIntent = 'RAISE_COMPLAINT';
      systemResponse = "Do you accept Terms and Conditions?";
      nextAction = 'RAISE_COMPLAINT_CONFIRMATION';
      payload = { description: sanitizedText };
      break;

    case 'RAISE_COMPLAINT_CONFIRMATION':
      activeIntent = 'RAISE_COMPLAINT';
      const confirmText = sanitizedText.toLowerCase();
      if (confirmText.includes('yes') || confirmText.includes('అవును') || confirmText.includes('ஆம்') || confirmText.includes('ಹೌದು')) {
        systemResponse = "Your complaint has been registered successfully.";
        nextAction = 'COMPLETED';
      } else {
        systemResponse = "Complaint registration cancelled.";
        nextAction = 'COMPLETED';
        success = false;
        abandonmentReason = 'User declined terms';
      }
      break;

    case 'TRACK_COMPLAINT':
      activeIntent = 'TRACK_COMPLAINT';
      const rawId = sanitizedText.replace(/\s+/g, '-').toUpperCase();
      const complaintIdMatch = rawId.match(/(AP|TS|TN|KA)-\d{4}-\d+/);
      
      if (complaintIdMatch) {
        systemResponse = `I found your complaint. It is currently under review by the assigned department.`;
        nextAction = 'COMPLETED';
      } else {
        systemResponse = "I could not find that complaint ID. Please try again.";
        nextAction = 'TRACK_COMPLAINT';
        success = false;
        abandonmentReason = 'Invalid Complaint ID';
      }
      break;

    case 'MAIN_MENU':
    case 'IDLE':
    case 'LANGUAGE_SELECTION':
    default:
      // Top-level menu intent detection
      const detection = voiceIntentService.detectIntent(sanitizedText, language);
      activeIntent = detection.intent;

      switch (activeIntent) {
        case 'RAISE_COMPLAINT':
          systemResponse = "Please upload an image or click capture.";
          nextAction = 'RAISE_COMPLAINT_IMAGE';
          break;
        case 'TRACK_COMPLAINT':
          systemResponse = "Please provide your Complaint ID.";
          nextAction = 'TRACK_COMPLAINT';
          break;
        case 'VIEW_UPDATES':
          systemResponse = "Reading latest updates. The city council has announced road repairs next week.";
          nextAction = 'COMPLETED';
          break;
        case 'EMERGENCY_HELP':
          systemResponse = "Creating emergency session. Routing to Emergency Response immediately.";
          nextAction = 'COMPLETED';
          break;
        case 'UNKNOWN':
        default:
          systemResponse = voiceIntentService.getFallbackResponse(language);
          nextAction = 'MAIN_MENU';
          success = false;
          abandonmentReason = 'Unrecognized Intent';
          break;
      }
      break;
  }

  const latencyMs = Date.now() - startTime;

  // Log interaction
  await VoiceInteraction.create({
    sessionId: sessionId || `anon-${Date.now()}`,
    userId: req.user ? req.user._id : null,
    language,
    intent: activeIntent,
    transcribedText: sanitizedText,
    systemResponse,
    success,
    latencyMs,
    workflowName,
    completionRate: nextAction === 'COMPLETED' ? 100 : (success ? 50 : 0),
    abandonmentReason,
    deviceType,
    browser
  });

  res.status(200).json({
    success: true,
    data: {
      intent: activeIntent,
      systemResponse,
      nextAction,
      payload,
      latencyMs
    }
  });
});

module.exports = {
  interact
};
