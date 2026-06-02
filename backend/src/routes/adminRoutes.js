const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getAdminLogs } = require('../controllers/adminController');
const { onboardMunicipality } = require('../controllers/saasController');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));
router.get('/logs', getAdminLogs);
router.post('/onboard-municipality', onboardMunicipality);

module.exports = router;
