const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const { validate } = require('../middleware/validate');
const { createAnnouncementSchema } = require('../validators');

const router = express.Router();

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', protect, authorizeRoles('admin', 'supervisor'), upload.single('thumbnail'), validate(createAnnouncementSchema), announcementController.createAnnouncement);
router.put('/:id', protect, authorizeRoles('admin', 'supervisor'), upload.single('thumbnail'), validate(createAnnouncementSchema), announcementController.updateAnnouncement);
router.delete('/:id', protect, authorizeRoles('admin', 'supervisor'), announcementController.deleteAnnouncement);

module.exports = router;
