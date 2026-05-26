const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getAdminLogs } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));
router.get('/logs', getAdminLogs);

module.exports = router;
