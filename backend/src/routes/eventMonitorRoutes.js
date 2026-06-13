const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getEventMetrics } = require('../controllers/eventMonitorController');

const router = express.Router();

// Only Admins can monitor events
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getEventMetrics);

module.exports = router;
