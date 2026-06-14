const express = require('express');
const { getInfrastructureMetrics } = require('../controllers/infrastructureController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Only Admins can view infrastructure metrics
router.get('/metrics', protect, authorizeRoles('admin'), getInfrastructureMetrics);

module.exports = router;
