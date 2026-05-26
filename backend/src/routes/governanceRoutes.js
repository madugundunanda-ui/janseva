const express = require('express');
const { getTimeline } = require('../controllers/governanceController');

const router = express.Router();

router.get('/timeline', getTimeline);

module.exports = router;
