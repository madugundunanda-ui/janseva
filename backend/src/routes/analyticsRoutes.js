const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/civic-health', analyticsController.getCivicHealth);
router.get('/departments', analyticsController.getDepartments);
router.get('/officers', analyticsController.getOfficers);
router.get('/sla', analyticsController.getSla);
router.get('/risks', analyticsController.getRisks);
router.get('/governance-insights', analyticsController.getGovernanceInsights);
router.get('/predictions', analyticsController.getPredictions);
router.get('/heatmaps', analyticsController.getHeatmaps);
router.get('/executive-dashboard', analyticsController.getExecutiveDashboard);
router.get('/executive-reports', analyticsController.getExecutiveReports);
router.get('/ai-metrics', analyticsController.getAiMetrics);
router.get('/dashboard', analyticsController.getDashboard);
router.get('/maps', analyticsController.getMaps);

module.exports = router;
