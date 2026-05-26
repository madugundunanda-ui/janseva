const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', protect, authorizeRoles('citizen'), feedbackController.createFeedback);
router.get('/my', protect, authorizeRoles('citizen'), feedbackController.getMyFeedback);
router.get('/public', feedbackController.getPublicFeedback);
router.get('/stats', protect, authorizeRoles('admin'), feedbackController.getFeedbackStats);
router.get('/admin', protect, authorizeRoles('admin'), feedbackController.getAllFeedback);
router.patch('/:id/approve', protect, authorizeRoles('admin'), feedbackController.approveFeedback);
router.patch('/:id/reject', protect, authorizeRoles('admin'), feedbackController.rejectFeedback);
router.delete('/:id', protect, authorizeRoles('admin'), feedbackController.deleteFeedback);

module.exports = router;
