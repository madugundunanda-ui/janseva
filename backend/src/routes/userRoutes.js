const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/', authorizeRoles('admin', 'supervisor', 'officer'), userController.getUsers);
router.get('/:id', authorizeRoles('admin', 'supervisor'), userController.getUserById);
router.post('/', authorizeRoles('admin', 'officer'), userController.createUser);
router.put('/:id', authorizeRoles('admin'), userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
