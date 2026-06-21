const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/updateSourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin', 'supervisor'));

router.get('/', sourceController.getSources);
router.post('/', sourceController.createSource);
router.post('/ingest', sourceController.triggerIngestion);
router.get('/jobs', sourceController.getJobHistory);
router.get('/audit-logs', sourceController.getAuditLogs);

module.exports = router;
