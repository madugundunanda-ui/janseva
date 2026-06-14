const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Protected routes
router.use(protect);

router.get('/clusters', intelligenceController.getClusters);
router.get('/hotspots', intelligenceController.getHotspots);
router.get('/risks', intelligenceController.getRisks);
router.get('/emergency-zones', intelligenceController.getEmergencyZones);
router.get('/recurring', intelligenceController.getRecurringIssues);
router.get('/impact', intelligenceController.getCivicImpact);
router.get('/heatmap', intelligenceController.getHeatmap);

// Admin / System operations
router.post('/sync', authorizeRoles('admin', 'system'), intelligenceController.syncIntelligence);

module.exports = router;
