const express = require('express');
const { interact } = require('../controllers/voiceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/interact', protect, interact);

module.exports = router;
