const express = require('express');
const departmentController = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', departmentController.getDepartments);
router.post('/', protect, authorizeRoles('admin'), departmentController.createDepartment);
router.put('/:id', protect, authorizeRoles('admin'), departmentController.updateDepartment);
router.delete('/:id', protect, authorizeRoles('admin'), departmentController.deleteDepartment);

module.exports = router;
