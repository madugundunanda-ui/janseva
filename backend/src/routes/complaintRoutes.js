const express = require('express');
const complaintController = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const { compressImage } = require('../middleware/imageProcessor');
const { validate } = require('../middleware/validate');
const {
  createComplaintSchema,
  updateComplaintSchema,
  validateComplaintSchema,
  assignOfficerSchema,
  assignSupervisorSchema
} = require('../validators');

const router = express.Router();

router.use(protect);
router.get('/nearby', complaintController.getNearbyComplaints);
router.post('/:id/validate', upload.single('image'), compressImage, validate(validateComplaintSchema), complaintController.validateComplaint);
router.get('/', complaintController.getComplaints);
router.get('/:id', complaintController.getComplaintById);
router.post('/check-duplicate', upload.single('image'), compressImage, complaintController.checkDuplicate);
router.post('/:id/join', complaintController.joinComplaint);
router.post('/upload', upload.single('image'), compressImage, complaintController.uploadComplaintImages);
router.post('/', upload.single('image'), compressImage, validate(createComplaintSchema), complaintController.createComplaint);
router.get('/:id/assignment-options', authorizeRoles('admin', 'supervisor'), complaintController.getAssignmentOptions);
router.patch('/:id/assign-officer', authorizeRoles('admin', 'supervisor'), validate(assignOfficerSchema), complaintController.assignOfficer);
router.patch('/:id/assign-supervisor', authorizeRoles('admin', 'supervisor', 'officer'), validate(assignSupervisorSchema), complaintController.assignSupervisor);
router.patch('/:id', authorizeRoles('admin', 'supervisor', 'officer'), upload.single('afterImage'), compressImage, validate(updateComplaintSchema), complaintController.updateComplaint);

module.exports = router;
