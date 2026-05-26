const express = require('express');
const geoController = require('../controllers/geoController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/reverse', geoController.reverseGeocode);
router.get('/hotspots', geoController.getHotspots);
router.get('/nearby', geoController.getNearbyIssues);
router.post('/cluster', geoController.triggerClustering);

module.exports = router;
