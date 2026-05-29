const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const { validate } = require('../middleware/validate');
const { recommendOfficerSchema, detectSpamSchema, spamActionSchema, updateSettingsSchema } = require('../validators');
const { 
  analyzeImage, 
  analyzeImageStream,
  getAiHealth,
  predictResolutionController,
  getSeverityController,
  recommendOfficerController,
  getSettingsController,
  updateSettingsController,
  detectSpamController,
  spamActionController,
  verifyResolutionController,
  aiFeedbackController
} = require('../controllers/aiController');

const router = express.Router();

router.post('/analyze', protect, upload.single('image'), analyzeImage);
router.get('/analyze-stream/:analysisId', protect, analyzeImageStream);
router.get('/health', protect, getAiHealth);
router.post('/predict-resolution', protect, predictResolutionController);
router.post('/severity', protect, getSeverityController);
router.post('/recommend-officer', protect, validate(recommendOfficerSchema), recommendOfficerController);
router.get('/settings', protect, getSettingsController);
router.post('/settings', protect, validate(updateSettingsSchema), updateSettingsController);
router.post('/spam-detect', protect, validate(detectSpamSchema), detectSpamController);
router.post('/spam-action', protect, validate(spamActionSchema), spamActionController);
router.post('/verify-resolution', protect, upload.single('afterImage'), verifyResolutionController);
router.post('/feedback', protect, aiFeedbackController);

module.exports = router;
