const AppError = require('../../utils/AppError');

class VisionProvider {
  /**
   * Analyze a uploaded image and return structured JSON
   * @param {Object} file - The Express file object (Multer)
   * @returns {Promise<Object>} The structured analysis results
   */
  async analyzeImage(file) {
    throw new AppError('analyzeImage method must be implemented by concrete VisionProviders', 500);
  }
}

module.exports = VisionProvider;
