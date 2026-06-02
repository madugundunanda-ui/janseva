const GeminiVisionProvider = require('./GeminiVisionProvider');
const OpenAiVisionProvider = require('./OpenAiVisionProvider');
const MockVisionProvider = require('./MockVisionProvider');
const logger = require('../../utils/logger');

class VisionProviderFactory {
  static getProvider() {
    const providerType = (process.env.VISION_PROVIDER || 'mock').toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    logger.info('Initializing VisionProvider', { configuredProvider: providerType });

    if (providerType === 'gemini') {
      if (geminiKey) {
        logger.info('Gemini Vision Provider active');
        return new GeminiVisionProvider(geminiKey);
      }
      logger.warn('Gemini API key missing. Falling back to MockVisionProvider.');
    } else if (providerType === 'openai' || providerType === 'gpt4o') {
      if (openaiKey) {
        logger.info('OpenAI Vision Provider active');
        return new OpenAiVisionProvider(openaiKey);
      }
      logger.warn('OpenAI API key missing. Falling back to MockVisionProvider.');
    }

    logger.info('Mock Vision Provider active');
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return new MockVisionProvider(aiUrl);
  }
}

module.exports = VisionProviderFactory;
