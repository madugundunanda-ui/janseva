const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/stats', protect, authorizeRoles('citizen', 'officer', 'supervisor', 'admin'), dashboardController.getStats);

module.exports = router;
