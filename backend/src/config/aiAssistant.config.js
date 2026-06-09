/**
 * AI Assistant Configuration
 * Environment-based configuration for voice services and AI endpoints
 */

require('dotenv').config();

module.exports = {
  // Voice Services Configuration
  voiceServices: {
    // Azure Speech Services (preferred)
    azure: {
      enabled: process.env.AZURE_SPEECH_ENABLED === 'true',
      key: process.env.AZURE_SPEECH_KEY,
      region: process.env.AZURE_SPEECH_REGION || 'centralindia',
      speechRecognitionEndpoint: process.env.AZURE_STT_ENDPOINT,
      speechSynthesisEndpoint: process.env.AZURE_TTS_ENDPOINT
    },

    // Fallback: Local voice service
    local: {
      enabled: process.env.LOCAL_VOICE_SERVICE_ENABLED === 'true',
      speechToTextApi: process.env.SPEECH_TO_TEXT_API || 'http://localhost:5000/speech-to-text',
      textToSpeechApi: process.env.TEXT_TO_SPEECH_API || 'http://localhost:5000/text-to-speech'
    },

    // Audio settings
    audio: {
      sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
      channels: 1,
      bitDepth: 16,
      format: 'wav'
    }
  },

  // AI Services Configuration
  aiServices: {
    // Intent Classification
    intentClassifier: {
      endpoint: process.env.INTENT_CLASSIFIER_API || 'http://localhost:5002/classify-intent',
      timeout: parseInt(process.env.INTENT_CLASSIFIER_TIMEOUT || '5000'),
      retryAttempts: 2
    },

    // Image Analysis
    imageAnalysis: {
      departmentDetectionEndpoint: process.env.DEPT_DETECTION_API || 'http://localhost:5003/detect-department',
      categoryDetectionEndpoint: process.env.CATEGORY_DETECTION_API || 'http://localhost:5003/detect-category',
      severityDetectionEndpoint: process.env.SEVERITY_DETECTION_API || 'http://localhost:5003/detect-severity',
      timeout: parseInt(process.env.IMAGE_ANALYSIS_TIMEOUT || '8000'),
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760') // 10MB
    },

    // NLP Services
    nlp: {
      textSimilarityApi: process.env.NLP_SERVICE_ENDPOINT || 'http://localhost:5002/text-similarity',
      languageDetectionApi: process.env.LANGUAGE_DETECTION_API || 'http://localhost:5002/language-detection',
      timeout: parseInt(process.env.NLP_TIMEOUT || '5000')
    },

    // Computer Vision
    imageComparison: {
      endpoint: process.env.IMAGE_SERVICE_ENDPOINT || 'http://localhost:5003/compare-images',
      timeout: parseInt(process.env.IMAGE_COMPARISON_TIMEOUT || '10000')
    },

    // Translation Service
    translation: {
      endpoint: process.env.TRANSLATION_API || 'http://localhost:5001/translate',
      timeout: parseInt(process.env.TRANSLATION_TIMEOUT || '5000')
    },

    // Model versions
    modelVersions: {
      intentClassifier: process.env.INTENT_CLASSIFIER_VERSION || '1.0',
      imageAnalysis: process.env.IMAGE_ANALYSIS_MODEL_VERSION || '1.0',
      nlp: process.env.NLP_MODEL_VERSION || '1.0'
    }
  },

  // Session Configuration
  session: {
    maxDuration: parseInt(process.env.SESSION_MAX_DURATION || '1800000'), // 30 minutes
    idleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || '600000'), // 10 minutes
    sessionId: {
      length: 36 // UUID v4
    }
  },

  // Conversation Configuration
  conversation: {
    maxTurns: parseInt(process.env.MAX_CONVERSATION_TURNS || '100'),
    maxHistoryLength: parseInt(process.env.MAX_HISTORY_LENGTH || '50'),
    autoClearAfterMinutes: parseInt(process.env.AUTO_CLEAR_HISTORY_MINUTES || '60')
  },

  // Workflow Configuration
  workflow: {
    raiseComplaint: {
      imageUploadTimeout: parseInt(process.env.IMAGE_UPLOAD_TIMEOUT || '30000'),
      aiAnalysisTimeout: parseInt(process.env.AI_ANALYSIS_TIMEOUT || '8000'),
      duplicateCheckTimeout: parseInt(process.env.DUPLICATE_CHECK_TIMEOUT || '10000')
    },

    trackComplaint: {
      searchTimeout: parseInt(process.env.COMPLAINT_SEARCH_TIMEOUT || '5000'),
      statusUpdateInterval: parseInt(process.env.STATUS_UPDATE_INTERVAL || '60000') // 1 minute
    }
  },

  // Accessibility Configuration
  accessibility: {
    defaultLargeTextSize: parseInt(process.env.DEFAULT_LARGE_TEXT_SIZE || '18'),
    defaultTextSize: parseInt(process.env.DEFAULT_TEXT_SIZE || '14'),
    highContrastThreshold: parseInt(process.env.HIGH_CONTRAST_THRESHOLD || '7')
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
    backend: process.env.CACHE_BACKEND || 'memory' // 'memory' or 'redis'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'janseva',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000')
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    destination: process.env.LOG_DESTINATION || 'console', // 'console' or 'file'
    filePath: process.env.LOG_FILE_PATH || './logs/ai-assistant.log',
    maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760'), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '10')
  },

  // Error Tracking
  errorTracking: {
    enabled: process.env.SENTRY_ENABLED === 'true',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    sessionMaxRequests: parseInt(process.env.RATE_LIMIT_SESSION_MAX || '50')
  },

  // Security
  security: {
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    hstsEnabled: process.env.HSTS_ENABLED !== 'false',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
    apiKeyRequired: process.env.API_KEY_REQUIRED !== 'false',
    apiKey: process.env.API_KEY || 'dev-key-change-in-production'
  },

  // Feature Flags
  features: {
    voiceInputEnabled: process.env.VOICE_INPUT_ENABLED !== 'false',
    imageAnalysisEnabled: process.env.IMAGE_ANALYSIS_ENABLED !== 'false',
    duplicateDetectionEnabled: process.env.DUPLICATE_DETECTION_ENABLED !== 'false',
    multilingualEnabled: process.env.MULTILINGUAL_ENABLED !== 'false',
    accessibilityEnabled: process.env.ACCESSIBILITY_ENABLED !== 'false',
    emergencyHelpEnabled: process.env.EMERGENCY_HELP_ENABLED !== 'false'
  },

  // Supported Languages
  supportedLanguages: {
    'en-IN': {
      code: 'en-IN',
      name: 'English',
      enabled: true
    },
    'te-IN': {
      code: 'te-IN',
      name: 'Telugu',
      enabled: process.env.ENABLE_TELUGU !== 'false'
    },
    'ta-IN': {
      code: 'ta-IN',
      name: 'Tamil',
      enabled: process.env.ENABLE_TAMIL !== 'false'
    },
    'kn-IN': {
      code: 'kn-IN',
      name: 'Kannada',
      enabled: process.env.ENABLE_KANNADA !== 'false'
    }
  },

  // Supported Intents
  supportedIntents: [
    'RAISE_COMPLAINT',
    'TRACK_COMPLAINT',
    'GOVERNMENT_UPDATES',
    'EMERGENCY_HELP'
  ],

  // File Upload Configuration
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadDirectory: process.env.UPLOAD_DIR || './uploads',
    tempDirectory: process.env.TEMP_DIR || './temp'
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  }
};
