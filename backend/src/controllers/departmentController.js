const asyncHandler = require('../utils/asyncHandler');
const { Department } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const normalize = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const dedupeByName = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item.name || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getDepartments = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const savedDepartments = await Department.find({ tenantId }).populate('officers', 'name email role');
  const data = dedupeByName(savedDepartments);

  sendSuccess(res, 200, 'Departments fetched successfully', {
    count: data.length,
    departments: data,
  });
});

const createDepartment = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const department = await Department.create({ ...req.body, tenantId });

  sendSuccess(res, 201, 'Department created successfully', {
    department,
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  sendSuccess(res, 200, 'Department updated successfully', { department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const department = await Department.findOne({ _id: req.params.id, tenantId });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  
  if (department.officers && department.officers.length > 0) {
    return res.status(400).json({ success: false, message: 'Cannot delete department with active officers' });
  }
  
  await department.deleteOne();
  sendSuccess(res, 200, 'Department deleted successfully', {});
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
