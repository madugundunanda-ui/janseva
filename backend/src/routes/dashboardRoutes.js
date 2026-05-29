const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', optionalProtect, dashboardController.getStats);

module.exports = router;

