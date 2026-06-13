const express = require('express');
const router = express.Router();
const transparencyController = require('../controllers/transparencyController');

// All endpoints here are public (no authentication required)
// They use the internal caching to prevent DB overload

router.get('/stats', transparencyController.getStats);
router.get('/civic-scores', transparencyController.getCivicScores);
router.get('/departments', transparencyController.getDepartments);
router.get('/resolved-complaints', transparencyController.getResolvedComplaints);
router.get('/actions', transparencyController.getActions);
router.get('/impact', transparencyController.getImpact);
router.get('/map', transparencyController.getMap);
router.get('/success-stories', transparencyController.getSuccessStories);

module.exports = router;
