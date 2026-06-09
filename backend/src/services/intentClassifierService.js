/**
 * Intent Classifier Service
 * Classifies user input/speech into one of 4 supported intents
 * Supported intents: RAISE_COMPLAINT, TRACK_COMPLAINT, GOVERNMENT_UPDATES, EMERGENCY_HELP
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Supported intents
const SUPPORTED_INTENTS = {
  RAISE_COMPLAINT: 'raise_complaint',
  TRACK_COMPLAINT: 'track_complaint',
  GOVERNMENT_UPDATES: 'government_updates',
  EMERGENCY_HELP: 'emergency_help'
};

// Intent keywords and patterns for different languages
const INTENT_PATTERNS = {
  'en-IN': {
    [SUPPORTED_INTENTS.RAISE_COMPLAINT]: [
      'report', 'complaint', 'issue', 'problem', 'submit', 'file',
      'pothole', 'garbage', 'street light', 'water', 'sewer', 'road',
      'damage', 'broken', 'missing', 'not working'
    ],
    [SUPPORTED_INTENTS.TRACK_COMPLAINT]: [
      'track', 'status', 'complaint number', 'check', 'update',
      'where', 'when', 'progress', 'solved', 'resolved'
    ],
    [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: [
      'scheme', 'update', 'news', 'announcement', 'government',
      'application', 'subsidy', 'benefit', 'eligibility', 'notification',
      'circular', 'order', 'gazette'
    ],
    [SUPPORTED_INTENTS.EMERGENCY_HELP]: [
      'emergency', 'urgent', 'help', 'ambulance', 'police',
      'fire', 'rescue', 'accident', 'disaster', 'crisis',
      'danger', 'critical', 'call', 'helpline'
    ]
  },
  'te-IN': {
    [SUPPORTED_INTENTS.RAISE_COMPLAINT]: [
      'ఫిర్యాదు', 'ఐటీసీ', 'సమస్య', 'ఇబ్బందी', 'నివేదన',
      'రోడ్డు', 'జలం', 'విద్యుత్', 'చెత్త', 'నష్టం'
    ],
    [SUPPORTED_INTENTS.TRACK_COMPLAINT]: [
      'ట్రాక్', 'స్థితి', 'అప్‌డేట్', 'చెక్', 'సమాధానం',
      'ఎక్కడ', 'ఎప్పుడు', 'ఆ', 'పర్యవేక్షణ'
    ],
    [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: [
      'పథకం', 'ఉद్ఘాటన', 'వార్త', 'ప్రకటన', 'ప్రభుత్వం',
      'దరఖాస్తు', 'సబ్సిడీ', 'ప్రయోజనం', 'సమర్థత'
    ],
    [SUPPORTED_INTENTS.EMERGENCY_HELP]: [
      'ఎమర్జెన్సీ', 'వెంటనే', 'సహాయం', 'ఆంబులెన్స్',
      'పోలీసు', 'అగ్నిమន్ని', 'ప్రమాదం', 'సంకట'
    ]
  },
  'ta-IN': {
    [SUPPORTED_INTENTS.RAISE_COMPLAINT]: [
      'புகார்', 'பிரச்சனை', 'சிக்கல்', 'சாலை', 'தண்ணீர்',
      'மின்சாரம்', 'குப்பை', 'உடைந்த', 'பழுதான'
    ],
    [SUPPORTED_INTENTS.TRACK_COMPLAINT]: [
      'பதிவு', 'நிலை', 'புதுப்பிப்பு', 'சரிபார்',
      'எங்கே', 'எப்போது', 'முன்னேற்றம்'
    ],
    [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: [
      'திட்டம்', 'அறிவிப்பு', 'செய்திகள்', 'அரசு',
      'விண்ணப்பம்', 'மானியம்', 'நன்மை', 'தகுதி'
    ],
    [SUPPORTED_INTENTS.EMERGENCY_HELP]: [
      'அவசரம்', 'உடனடி', 'உதவி', 'ஆம்புலன்ஸ்',
      'போலீஸ்', 'தீயணைப்பு', 'விபத்து', '위기'
    ]
  },
  'kn-IN': {
    [SUPPORTED_INTENTS.RAISE_COMPLAINT]: [
      'ಅಭಿಯೋಗ', 'ಸಮಸ್ಯೆ', 'ಸಮಸ್ಯೆ', 'ರಸ್ತೆ', 'ನೀರು',
      'ವಿದ್ಯುತ್', 'ಅವರೋಹಣೆ', 'ಹಾಳೆಯ', 'ಹಾಳೆಯ'
    ],
    [SUPPORTED_INTENTS.TRACK_COMPLAINT]: [
      'ಟ್ರ್ಯಾಕ್', 'ಸ್ಥಿತಿ', 'ನವೀಕರಣ', 'ಪರಿಶೀಲಿಸಿ',
      'ಎಲ್ಲಿ', 'ಯಾವಾಗ', 'ಪ್ರಗತಿ'
    ],
    [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: [
      'ಯೋಜನೆ', 'ಘೋಷಣೆ', 'ಸುದ್ದಿ', 'ಸರ್ಕಾರ',
      'ಅರ್ಜಿ', 'ಭತ್ಯೆ', 'ಪ್ರಯೋಜನ', 'ಅರ್ಹತೆ'
    ],
    [SUPPORTED_INTENTS.EMERGENCY_HELP]: [
      'ತುರ್ತು', 'ತುರ್ತು', 'ಸಹಾಯ', 'ಆಂಬುಲೆನ್ಸ್',
      'ಪೋಲೀಸ್', 'ಅಗ್ನಿಶಾಮಕ', 'ಪ್ರಕೋಪ', 'ಸಂಕಟ'
    ]
  }
};

// Default fallback message for unsupported intents
const FALLBACK_MESSAGE = 'Sorry, I can only assist with government-related services. Please choose from: Raise Complaint, Track Complaint, Government Updates, or Emergency Help.';

const FALLBACK_MESSAGE_TE = 'క్షమించండి, నేను ప్రభుత్వ సంబంధిత సేవలకు మాత్రమే సహాయం చేయగలను. దయచేసి ఎంచుకోండి: ఫిర్యాదు వేయండి, ఫిర్యాదు ట్రాక్ చేయండి, ప్రభుత్వ నవీకరణలు, లేదా అవసర సహాయం.';

const FALLBACK_MESSAGE_TA = 'மன்னிக்கவும், நான் அரசு சார்ந்த சேவைகளுக்கு மட்டுமே உதவ முடியும். தயவுசெய்து தேர்ந்தெடுக்கவும்: புகார் தெரிவிக்கவும், புகார் ட்র்যாக் செய்யவும், அரசு புதுப்பிப்புகள் அல்லது জরூரிய உதவி.';

const FALLBACK_MESSAGE_KN = 'ಕ್ಷಮಿಸಿ, ನಾನು ಸರ್ಕಾರ ಸಂಬಂಧಿತ ಸೇವೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಹುದು. ದಯವಿಟ್ಟು ಆರಿಸಿಕೊಳ್ಳಿ: ಅಭಿಯೋಗ ಸಲ್ಲಿಸಿ, ಅಭಿಯೋಗ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಸರ್ಕಾರಿ ನವೀಕರಣ ಅಥವಾ ತುರ್ತು ಸಹಾಯ.';

/**
 * Classify user input into one of the supported intents
 * @param {string} text - User input text
 * @param {string} language - Language code (en-IN, te-IN, ta-IN, kn-IN)
 * @returns {Promise<{intent: string, confidence: number, alternatives: array, fallback: boolean, message: string}>}
 */
const classifyIntent = async (text, language = 'en-IN') => {
  try {
    if (!text || text.trim().length === 0) {
      return {
        intent: null,
        confidence: 0,
        alternatives: [],
        fallback: true,
        message: getFallbackMessage(language),
        language: language
      };
    }

    logger.info(`Classifying intent for text: "${text.substring(0, 50)}..." [${language}]`);

    // Try ML-based classification first
    const mlResult = await classifyIntentML(text, language);
    if (mlResult.confidence >= 0.7) {
      return mlResult;
    }

    // Fallback to keyword-based classification
    const keywordResult = classifyIntentKeyword(text, language);
    if (keywordResult.confidence > 0) {
      return keywordResult;
    }

    // No intent matched
    return {
      intent: null,
      confidence: 0,
      alternatives: [],
      fallback: true,
      message: getFallbackMessage(language),
      language: language
    };
  } catch (error) {
    logger.error(`Intent classification error: ${error.message}`);
    return {
      intent: null,
      confidence: 0,
      alternatives: [],
      fallback: true,
      message: getFallbackMessage(language),
      error: error.message,
      language: language
    };
  }
};

/**
 * ML-based intent classification using NLU service
 * @private
 */
const classifyIntentML = async (text, language) => {
  try {
    const nluEndpoint = process.env.NLU_SERVICE_ENDPOINT || 'http://localhost:5002/classify-intent';
    
    const response = await axios.post(
      nluEndpoint,
      {
        text: text,
        language: language,
        intents: Object.values(SUPPORTED_INTENTS)
      },
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const intent = response.data.intent || null;
    const confidence = response.data.confidence || 0;
    const alternatives = response.data.alternatives || [];

    // Validate intent
    if (!Object.values(SUPPORTED_INTENTS).includes(intent)) {
      return { intent: null, confidence: 0, alternatives: [] };
    }

    return {
      intent: intent,
      confidence: Math.min(confidence, 1.0),
      alternatives: alternatives,
      fallback: false,
      classifier: 'ml',
      language: language
    };
  } catch (error) {
    logger.warn(`ML classification failed: ${error.message}`);
    return { intent: null, confidence: 0, alternatives: [] };
  }
};

/**
 * Keyword-based intent classification (fallback)
 * @private
 */
const classifyIntentKeyword = (text, language = 'en-IN') => {
  const lowerText = text.toLowerCase();
  const patterns = INTENT_PATTERNS[language] || INTENT_PATTERNS['en-IN'];
  
  const scores = {};
  
  // Calculate match score for each intent
  for (const [intent, keywords] of Object.entries(patterns)) {
    let matchCount = 0;
    let totalKeywordLength = 0;
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
        totalKeywordLength += keyword.length;
      }
    });
    
    // Confidence score: (matches / total keywords) * keyword quality factor
    scores[intent] = matchCount > 0 
      ? (matchCount / keywords.length) * (1 - (totalKeywordLength / (lowerText.length * 2)))
      : 0;
  }
  
  // Find best match
  const bestIntentEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const bestIntent = bestIntentEntry?.[0];
  const bestScore = bestIntentEntry?.[1] || 0;
  
  // Get alternatives (non-best matches with score > 0.1)
  const alternatives = Object.entries(scores)
    .filter(([intent, score]) => intent !== bestIntent && score > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([intent, score]) => ({ intent, confidence: score }));
  
  return {
    intent: bestScore > 0.2 ? bestIntent : null,
    confidence: bestScore,
    alternatives: alternatives,
    fallback: bestScore <= 0.2,
    classifier: 'keyword',
    language: language
  };
};

/**
 * Validate if the intent is supported
 * @param {string} intent - Intent to validate
 * @returns {boolean}
 */
const isValidIntent = (intent) => Object.values(SUPPORTED_INTENTS).includes(intent);

/**
 * Get user-friendly intent name
 * @param {string} intent - Intent code
 * @param {string} language - Language code
 * @returns {string}
 */
const getIntentDisplayName = (intent, language = 'en-IN') => {
  const names = {
    'en-IN': {
      [SUPPORTED_INTENTS.RAISE_COMPLAINT]: 'Raise a Complaint',
      [SUPPORTED_INTENTS.TRACK_COMPLAINT]: 'Track Complaint',
      [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: 'Government Updates',
      [SUPPORTED_INTENTS.EMERGENCY_HELP]: 'Emergency Help'
    },
    'te-IN': {
      [SUPPORTED_INTENTS.RAISE_COMPLAINT]: 'ఫిర్యాదు వేయండి',
      [SUPPORTED_INTENTS.TRACK_COMPLAINT]: 'ఫిర్యాదు ట్రాక్ చేయండి',
      [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: 'ప్రభుత్వ నవీకరణలు',
      [SUPPORTED_INTENTS.EMERGENCY_HELP]: 'అవసర సహాయం'
    },
    'ta-IN': {
      [SUPPORTED_INTENTS.RAISE_COMPLAINT]: 'புகார் தெரிவிக்க',
      [SUPPORTED_INTENTS.TRACK_COMPLAINT]: 'புகார் ட్র్యாக్ செய்க',
      [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: 'அரசு புதுப்பிப்புகள்',
      [SUPPORTED_INTENTS.EMERGENCY_HELP]: 'அவசர உதவி'
    },
    'kn-IN': {
      [SUPPORTED_INTENTS.RAISE_COMPLAINT]: 'ಅಭಿಯೋಗ ಸಲ್ಲಿಸಿ',
      [SUPPORTED_INTENTS.TRACK_COMPLAINT]: 'ಅಭಿಯೋಗ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      [SUPPORTED_INTENTS.GOVERNMENT_UPDATES]: 'ಸರ್ಕಾರಿ ನವೀಕರಣ',
      [SUPPORTED_INTENTS.EMERGENCY_HELP]: 'ತುರ್ತು ಸಹಾಯ'
    }
  };

  return names[language]?.[intent] || names['en-IN'][intent] || 'Unknown';
};

/**
 * Get fallback message in specified language
 * @private
 */
const getFallbackMessage = (language) => {
  const messages = {
    'en-IN': FALLBACK_MESSAGE,
    'te-IN': FALLBACK_MESSAGE_TE,
    'ta-IN': FALLBACK_MESSAGE_TA,
    'kn-IN': FALLBACK_MESSAGE_KN
  };

  return messages[language] || FALLBACK_MESSAGE;
};

/**
 * Get all supported intents with display names
 * @param {string} language - Language code
 * @returns {array}
 */
const getSupportedIntents = (language = 'en-IN') => {
  return Object.values(SUPPORTED_INTENTS).map(intent => ({
    value: intent,
    label: getIntentDisplayName(intent, language)
  }));
};

module.exports = {
  classifyIntent,
  isValidIntent,
  getIntentDisplayName,
  getSupportedIntents,
  getFallbackMessage,
  SUPPORTED_INTENTS,
  INTENT_PATTERNS
};
