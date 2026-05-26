const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');

const router = express.Router();

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', protect, authorizeRoles('admin', 'supervisor'), upload.single('thumbnail'), announcementController.createAnnouncement);
router.put('/:id', protect, authorizeRoles('admin', 'supervisor'), upload.single('thumbnail'), announcementController.updateAnnouncement);
router.delete('/:id', protect, authorizeRoles('admin', 'supervisor'), announcementController.deleteAnnouncement);

module.exports = router;
