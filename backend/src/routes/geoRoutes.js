const express = require('express');
const geoController = require('../controllers/geoController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { reverseGeocodeSchema, nearbyQuerySchema } = require('../validators');

const router = express.Router();

router.use(protect);

router.post('/reverse', validate(reverseGeocodeSchema), geoController.reverseGeocode);
router.get('/hotspots', geoController.getHotspots);
router.get('/nearby', validate(nearbyQuerySchema, 'query'), geoController.getNearbyIssues);
router.post('/cluster', geoController.triggerClustering);

module.exports = router;
