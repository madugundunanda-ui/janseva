const GeminiVisionProvider = require('./GeminiVisionProvider');
const MockVisionProvider = require('./MockVisionProvider');
const logger = require('../../utils/logger');

class VisionProviderFactory {
  static getProvider() {
    const isProduction = process.env.NODE_ENV === 'production';
    const providerType = (process.env.VISION_PROVIDER || (isProduction ? 'gemini' : 'mock')).toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY;

    logger.info('Initializing VisionProvider', { configuredProvider: providerType });

    if (providerType === 'gemini') {
      if (geminiKey) {
        logger.info('Gemini Vision Provider active');
        return new GeminiVisionProvider(geminiKey);
      }
      logger.warn('Gemini API key missing. Falling back to MockVisionProvider.');
    }

    logger.info('Mock Vision Provider active');
    return new MockVisionProvider();
  }
}

module.exports = VisionProviderFactory;
