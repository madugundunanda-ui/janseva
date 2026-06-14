const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getEventMetrics } = require('../controllers/eventMonitorController');

const router = express.Router();

// Only Admins can monitor events
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/', getEventMetrics);

module.exports = router;
