const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { User } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const getUsers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.department) {
    filter.department = req.query.department;
  }

  const users = await User.find(filter).select('-password').populate('department', 'name');

  sendSuccess(res, 200, 'Users fetched successfully', {
    count: users.length,
    users,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('department', 'name');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, 200, 'User fetched successfully', {
    user,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const creatorRole = req.user.role;

  if (role !== 'supervisor' && role !== 'officer') {
    throw new AppError('Role must be supervisor or officer', 400);
  }

  if (creatorRole === 'officer' && role !== 'supervisor') {
    throw new AppError('Officers can only create supervisors', 403);
  }
  
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const payload = { ...req.body };
  if (!payload.employeeId || payload.employeeId.trim() === '') {
    payload.employeeId = undefined;
  }

  const user = await User.create(payload);
  const userObj = user.toObject();
  delete userObj.password;
  sendSuccess(res, 201, 'User created successfully', { user: userObj });
});

const updateUser = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.password) {
    const salt = await require('bcryptjs').genSalt(10);
    payload.password = await require('bcryptjs').hash(payload.password, salt);
  }
  
  if (payload.employeeId === '') {
    payload.employeeId = undefined;
  }
  
  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select('-password').populate('department', 'name');
  if (!user) throw new AppError('User not found', 404);
  sendSuccess(res, 200, 'User updated successfully', { user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  await user.deleteOne();
  sendSuccess(res, 200, 'User deleted successfully', {});
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, 200, 'Profile fetched successfully', {
    user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatableFields = [
    'firstName',
    'lastName',
    'phone',
    'currentAddress',
    'permanentAddress',
    'age',
    'gender',
    'occupation',
    'profilePhotoUrl',
    'aadhaarNumber',
    'ward',
    'district',
  ];


  for (const field of updatableFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = req.body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'firstName') || Object.prototype.hasOwnProperty.call(req.body, 'lastName')) {
    const firstName = Object.prototype.hasOwnProperty.call(req.body, 'firstName')
      ? req.body.firstName
      : user.firstName;
    const lastName = Object.prototype.hasOwnProperty.call(req.body, 'lastName')
      ? req.body.lastName
      : user.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      user.name = fullName;
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'currentAddress')) {
    user.address = req.body.currentAddress;
  }

  if (req.body.newPassword) {
    user.password = req.body.newPassword;
  }

  await user.save();

  const updatedUser = await User.findById(req.user.id).select('-password');

  sendSuccess(res, 200, 'Profile updated successfully', {
    user: updatedUser,
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
};
