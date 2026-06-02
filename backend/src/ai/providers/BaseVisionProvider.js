const AppError = require('../../utils/AppError');

class BaseVisionProvider {
  /**
   * Analyze an uploaded image and return structured JSON
   * @param {Object} file - The Express file object (Multer)
   * @returns {Promise<Object>} The structured analysis results
   */
  async analyzeImage(file) {
    throw new AppError('analyzeImage method must be implemented by concrete VisionProviders', 500);
  }

  /**
   * Compare before and after images for resolution proof
   * @param {string} beforeImagePath - Relative or absolute path to the original complaint image
   * @param {Object} afterFile - The Express file object of the resolution proof
   * @returns {Promise<Object>} The comparison results
   */
  async compareImages(beforeImagePath, afterFile) {
    throw new AppError('compareImages method must be implemented by concrete VisionProviders', 500);
  }
}

module.exports = BaseVisionProvider;
