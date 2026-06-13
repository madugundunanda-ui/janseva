const logger = require('../utils/logger');

// Strict governance intent keyword mapping
const INTENT_MAP = {
  'en-IN': {
    RAISE_COMPLAINT: ['raise', 'create', 'new complaint', 'register', 'file', 'report', 'issue', 'problem', '1', 'one'],
    TRACK_COMPLAINT: ['track', 'status', 'check', 'where is my complaint', '2', 'two'],
    VIEW_UPDATES: ['updates', 'government', 'news', 'latest', '3', 'three'],
    EMERGENCY_HELP: ['emergency', 'help', 'critical', 'danger', 'fire', 'ambulance', 'police', '4', 'four'],
    MY_COMPLAINTS: ['my complaints', 'my history', 'past complaints', '5', 'five'],
    HELPDESK: ['helpdesk', 'contact', 'support', 'agent', '6', 'six']
  },
  'te-IN': {
    RAISE_COMPLAINT: ['ఫిర్యాదు', 'నమోదు', 'సమస్య', 'రిపోర్ట్', '1', 'ఒకటి'],
    TRACK_COMPLAINT: ['ట్రాక్', 'స్థితి', 'చెక్', '2', 'రెండు'],
    VIEW_UPDATES: ['అప్‌డేట్స్', 'వార్తలు', 'ప్రభుత్వ', '3', 'మూడు'],
    EMERGENCY_HELP: ['అత్యవసర', 'సహాయం', 'ప్రమాదం', '4', 'నాలుగు'],
    MY_COMPLAINTS: ['నా ఫిర్యాదులు', 'చరిత్ర', '5', 'ఐదు'],
    HELPDESK: ['హెల్ప్‌డెస్క్', 'మద్దతు', 'సంప్రదించండి', '6', 'ఆరు']
  },
  'ta-IN': {
    RAISE_COMPLAINT: ['புகார்', 'பதிவு', 'பிரச்சினை', '1', 'ஒன்று'],
    TRACK_COMPLAINT: ['நிலை', 'எங்கே', 'கண்காணி', '2', 'இரண்டு'],
    VIEW_UPDATES: ['செய்திகள்', 'அரசு', 'புதுப்பிப்புகள்', '3', 'மூன்று'],
    EMERGENCY_HELP: ['அவசரம்', 'உதவி', 'ஆபத்து', '4', 'நான்கு'],
    MY_COMPLAINTS: ['என் புகார்கள்', 'வரலாறு', '5', 'ஐந்து'],
    HELPDESK: ['உதவி மையம்', 'தொடர்பு', '6', 'ஆறு']
  },
  'kn-IN': {
    RAISE_COMPLAINT: ['ದೂರು', 'ದಾಖಲಿಸಿ', 'ಸಮಸ್ಯೆ', '1', 'ಒಂದು'],
    TRACK_COMPLAINT: ['ಸ್ಥಿತಿ', 'ಟ್ರ್ಯಾಕ್', 'ಪರಿಶೀಲಿಸಿ', '2', 'ಎರಡು'],
    VIEW_UPDATES: ['ಸುದ್ದಿ', 'ಸರ್ಕಾರದ', 'ನವೀಕರಣಗಳು', '3', 'ಮೂರು'],
    EMERGENCY_HELP: ['ತುರ್ತು', 'ಸಹಾಯ', 'ಅಪಾಯ', '4', 'ನಾಲ್ಕು'],
    MY_COMPLAINTS: ['ನನ್ನ ದೂರುಗಳು', 'ಇತಿಹಾಸ', '5', 'ಐದು'],
    HELPDESK: ['ಸಹಾಯವಾಣಿ', 'ಸಂಪರ್ಕಿಸಿ', '6', 'ಆರು']
  }
};

const UNKNOWN_RESPONSES = {
  'en-IN': "Sorry. I can only help with government services. Please choose: 1. Raise Complaint 2. Track Complaint 3. Government Updates 4. Emergency Help",
  'te-IN': "క్షమించండి. నేను ప్రభుత్వ సేవలకు సంబంధించిన సహాయం మాత్రమే అందించగలను.",
  'ta-IN': "மன்னிக்கவும். அரசு சேவைகள் தொடர்பான உதவிகளை மட்டுமே வழங்க முடியும்.",
  'kn-IN': "ಕ್ಷಮಿಸಿ. ನಾನು ಸರ್ಕಾರದ ಸೇವೆಗಳ ಸಹಾಯವನ್ನು ಮಾತ್ರ ನೀಡಬಹುದು."
};

const detectIntent = (text, language) => {
  if (!text) return { intent: 'UNKNOWN', confidence: 0 };
  
  const normalizedText = text.toLowerCase().trim();
  const langMap = INTENT_MAP[language] || INTENT_MAP['en-IN'];
  
  let bestMatch = 'UNKNOWN';
  let highestScore = 0;

  for (const [intent, keywords] of Object.entries(langMap)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        // Longer keyword matches or exact matches get higher confidence
        const score = keyword.length / normalizedText.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = intent;
        }
        if (normalizedText === keyword) {
          return { intent, confidence: 1.0 }; // Exact match
        }
      }
    }
  }

  return { 
    intent: highestScore > 0.1 ? bestMatch : 'UNKNOWN', 
    confidence: highestScore > 0.1 ? highestScore : 0 
  };
};

const getFallbackResponse = (language) => {
  return UNKNOWN_RESPONSES[language] || UNKNOWN_RESPONSES['en-IN'];
};

module.exports = {
  detectIntent,
  getFallbackResponse
};
