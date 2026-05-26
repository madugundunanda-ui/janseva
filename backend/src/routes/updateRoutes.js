const express = require('express');
const { getLiveUpdates } = require('../controllers/updateController');

const router = express.Router();

router.get('/live', getLiveUpdates);

module.exports = router;
