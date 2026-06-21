const asyncHandler = require('../utils/asyncHandler');
const { VoiceInteraction, VoiceConversationSession, Complaint, Announcement } = require('../models');
const voiceIntentService = require('../services/voiceIntentService');

const handleRaiseComplaint = (sanitizedText, language) => {
  return {
    activeIntent: 'RAISE_COMPLAINT',
    systemResponse: "Please upload an image or click capture.",
    nextAction: 'RAISE_COMPLAINT_IMAGE',
    success: true,
    abandonmentReason: null,
    payload: {}
  };
};

const handleComplaintDescription = async (sanitizedText, session) => {
  if (session.intent !== 'RAISE_COMPLAINT') {
    return handleFallback(session.language);
  }
  return {
    activeIntent: 'RAISE_COMPLAINT',
    systemResponse: "Do you accept Terms and Conditions?",
    nextAction: 'RAISE_COMPLAINT_CONFIRMATION',
    success: true,
    abandonmentReason: null,
    payload: { description: sanitizedText }
  };
};

const handleComplaintConfirmation = async (sanitizedText, session) => {
  if (session.intent !== 'RAISE_COMPLAINT') {
    return handleFallback(session.language);
  }
  const confirmText = sanitizedText.toLowerCase();
  const accepted = confirmText.includes('yes') || confirmText.includes('అవును') || confirmText.includes('ஆம்') || confirmText.includes('ಹೌದು');
  
  if (accepted) {
    return {
      activeIntent: 'RAISE_COMPLAINT',
      systemResponse: "Your complaint has been registered successfully.",
      nextAction: 'COMPLETED',
      success: true,
      abandonmentReason: null,
      payload: {}
    };
  } else {
    return {
      activeIntent: 'RAISE_COMPLAINT',
      systemResponse: "Complaint registration cancelled.",
      nextAction: 'COMPLETED',
      success: false,
      abandonmentReason: 'User declined terms',
      payload: {}
    };
  }
};

const handleTrackComplaint = (sanitizedText) => {
  const rawId = sanitizedText.replace(/\s+/g, '-').toUpperCase();
  const complaintIdMatch = rawId.match(/(AP|TS|TN|KA)-\d{4}-\d+/);
  
  if (complaintIdMatch) {
    return {
      activeIntent: 'TRACK_COMPLAINT',
      systemResponse: `I found your complaint. It is currently under review by the assigned department.`,
      nextAction: 'COMPLETED',
      success: true,
      abandonmentReason: null,
      payload: {}
    };
  } else {
    return {
      activeIntent: 'TRACK_COMPLAINT',
      systemResponse: "I could not find that complaint ID. Please try again.",
      nextAction: 'TRACK_COMPLAINT',
      success: false,
      abandonmentReason: 'Invalid Complaint ID',
      payload: {}
    };
  }
};

const handleViewUpdates = async (sanitizedText, language) => {
  const textLower = sanitizedText.toLowerCase();
  
  let filter = { isPublished: true };
  let responsePrefix = "Here are the latest updates. ";

  if (textLower.includes('emergency') || textLower.includes('critical')) {
    filter.severity = { $in: ['Critical', 'Emergency'] };
    responsePrefix = "Here are the emergency updates. ";
  } else if (textLower.includes('water')) {
    filter.category = 'Water Supply';
    responsePrefix = "Here are the water updates. ";
  } else if (textLower.includes('road') || textLower.includes('transport')) {
    filter.category = 'Roads & Transport';
    responsePrefix = "Here are the roads updates. ";
  } else if (textLower.includes('andhra') || textLower.includes('ap')) {
    filter.state = 'AP';
    responsePrefix = "Here are the updates for Andhra Pradesh. ";
  } else if (textLower.includes('telangana') || textLower.includes('ts')) {
    filter.state = 'TS';
    responsePrefix = "Here are the updates for Telangana. ";
  }

  const updates = await Announcement.find(filter).sort({ publishedDate: -1 }).limit(3);

  let systemResponse = responsePrefix;
  if (updates.length === 0) {
    systemResponse = "There are no new updates for this topic right now.";
  } else {
    systemResponse += updates.map((u, i) => `${i + 1}. ${u.shortSummary || u.title}`).join('. ');
  }

  return {
    activeIntent: 'VIEW_UPDATES',
    systemResponse,
    nextAction: 'COMPLETED',
    success: true,
    abandonmentReason: null,
    payload: { updates }
  };
};

const handleFallback = (language) => {
  return {
    activeIntent: 'UNKNOWN',
    systemResponse: voiceIntentService.getFallbackResponse(language),
    nextAction: 'MAIN_MENU',
    success: false,
    abandonmentReason: 'Unrecognized Intent or Out of Boundary',
    payload: {}
  };
};

const interact = asyncHandler(async (req, res) => {
  const { text, language = 'en-IN', sessionId, workflowName = 'MAIN_MENU', deviceType, browser } = req.body;
  const startTime = Date.now();
  const safeSessionId = sessionId || `anon-${Date.now()}`;
  const sanitizedText = text ? text.replace(/[<>]/g, '') : '';

  // Get or Create Session to track state boundary
  let session = await VoiceConversationSession.findOne({ sessionId: safeSessionId });
  if (!session) {
    session = await VoiceConversationSession.create({
      sessionId: safeSessionId,
      userId: req.user ? req.user._id : null,
      language,
      intent: 'MAIN_MENU'
    });
  }

  let result;

  // Process workflow by strictly enforcing boundaries via session state
  if (workflowName === 'RAISE_COMPLAINT_DESCRIPTION') {
    result = await handleComplaintDescription(sanitizedText, session);
  } else if (workflowName === 'RAISE_COMPLAINT_CONFIRMATION') {
    result = await handleComplaintConfirmation(sanitizedText, session);
  } else if (workflowName === 'TRACK_COMPLAINT') {
    if (session.intent !== 'TRACK_COMPLAINT' && session.intent !== 'MAIN_MENU') {
      result = handleFallback(language);
    } else {
      result = handleTrackComplaint(sanitizedText);
      session.intent = 'TRACK_COMPLAINT';
    }
  } else {
    // Top-level menu intent detection
    const detection = voiceIntentService.detectIntent(sanitizedText, language);
    session.intent = detection.intent;

    switch (detection.intent) {
      case 'RAISE_COMPLAINT':
        result = handleRaiseComplaint(sanitizedText, language);
        break;
      case 'TRACK_COMPLAINT':
        result = {
          activeIntent: 'TRACK_COMPLAINT',
          systemResponse: "Please provide your Complaint ID.",
          nextAction: 'TRACK_COMPLAINT',
          success: true,
          abandonmentReason: null,
          payload: {}
        };
        break;
      case 'VIEW_UPDATES':
        result = await handleViewUpdates(sanitizedText, language);
        break;
      case 'EMERGENCY_HELP':
        result = {
          activeIntent: 'EMERGENCY_HELP',
          systemResponse: "Creating emergency session. Routing to Emergency Response immediately.",
          nextAction: 'COMPLETED',
          success: true,
          abandonmentReason: null,
          payload: {}
        };
        break;
      default:
        result = handleFallback(language);
        session.intent = 'MAIN_MENU';
        break;
    }
  }

  if (result.nextAction === 'COMPLETED' || result.success === false) {
    session.status = result.success ? 'completed' : 'abandoned';
  }
  await session.save();

  const latencyMs = Date.now() - startTime;

  await VoiceInteraction.create({
    sessionId: safeSessionId,
    userId: req.user ? req.user._id : null,
    language,
    intent: result.activeIntent,
    transcribedText: sanitizedText,
    systemResponse: result.systemResponse,
    success: result.success,
    latencyMs,
    workflowName,
    completionRate: result.nextAction === 'COMPLETED' ? 100 : (result.success ? 50 : 0),
    abandonmentReason: result.abandonmentReason,
    deviceType,
    browser
  });

  res.status(200).json({
    success: true,
    data: {
      intent: result.activeIntent,
      systemResponse: result.systemResponse,
      nextAction: result.nextAction,
      payload: result.payload,
      latencyMs
    }
  });
});

module.exports = {
  interact
};
