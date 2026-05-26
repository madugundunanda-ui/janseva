const express = require('express');
const complaintController = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');

const router = express.Router();

router.use(protect);
router.get('/nearby', complaintController.getNearbyComplaints);
router.post('/:id/validate', upload.single('image'), complaintController.validateComplaint);
router.get('/', complaintController.getComplaints);
router.get('/:id', complaintController.getComplaintById);
router.post('/check-duplicate', upload.single('image'), complaintController.checkDuplicate);
router.post('/:id/join', complaintController.joinComplaint);
router.post('/upload', upload.single('image'), complaintController.uploadComplaintImages);
router.post('/', upload.single('image'), complaintController.createComplaint);
router.get('/:id/assignment-options', authorizeRoles('admin', 'supervisor'), complaintController.getAssignmentOptions);
router.patch('/:id/assign-officer', authorizeRoles('admin', 'supervisor'), complaintController.assignOfficer);
router.patch('/:id/assign-supervisor', authorizeRoles('officer'), complaintController.assignSupervisor);
router.patch('/:id', authorizeRoles('admin', 'supervisor', 'officer'), upload.single('afterImage'), complaintController.updateComplaint);

module.exports = router;
